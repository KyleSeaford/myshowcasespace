import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { BillingStatus, CheckoutStatus, DomainType, TenantMemberRole } from "@prisma/client";
import { z } from "zod";
import { requireAuth, requireOwnedTenant, requireTenantAccess } from "../lib/guards.js";
import { newApiKey, newTenantCode, newTemporaryPassword } from "../lib/crypto.js";
import { env } from "../config/env.js";
import { sendTeamInviteEmail } from "../lib/email.js";
import { parseJson, toJsonString } from "../lib/json.js";
import { hashPassword } from "../lib/auth.js";
import { parseTenantTheme, THEME_IDS } from "../lib/theme.js";
import { deleteUploadThingFileByUrl } from "../lib/uploadthing.js";
import {
  applyStripeCheckoutSession,
  applyStripeSubscriptionState,
  applyTenantPlanChange,
  stripePriceIdForPlan
} from "../lib/billing.js";
import { getStripeClient } from "../lib/stripe.js";
import { PAID_PLAN_ALIASES, PAID_PLAN_IDS, PLAN_IDS, ensurePlanCatalog, isPaidPlanId } from "../lib/plans.js";

const socialLinksSchema = z.record(z.string().min(1).max(80), z.string().max(1000));

const themeSchema = z.record(z.string().min(1).max(80), z.string().max(2_000_000));
const customDomainEligiblePlanIds = new Set<string>(PAID_PLAN_ALIASES);

const tenantCreateSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().regex(/^[a-z0-9-]{3,40}$/),
  bio: z.string().max(1000).optional(),
  contactEmail: z.string().email(),
  adminPassword: z.string().min(4).max(128),
  socialLinks: socialLinksSchema.optional(),
  theme: themeSchema.optional()
});

const tenantUpdateSchema = z.object({
  bio: z.string().max(1000).nullable().optional(),
  contactEmail: z.string().email().optional(),
  adminPassword: z.string().min(4).max(128).optional(),
  socialLinks: socialLinksSchema.optional(),
  theme: themeSchema.optional()
});

const themeSelectionSchema = z.object({
  themeId: z.enum(THEME_IDS)
});

const teamInviteSchema = z.object({
  email: z.string().email().max(254)
});

const checkoutSchema = z.object({
  targetPlanId: z.enum(PAID_PLAN_IDS),
  successUrl: z.string().url(),
  cancelUrl: z.string().url()
});

const portalSessionSchema = z.object({
  returnUrl: z.string().url()
});

const billingSyncSchema = z
  .object({
    checkoutSessionId: z.string().min(1).optional()
  })
  .optional();

const customDomainSchema = z.object({
  hostname: z.string().min(3).max(253).regex(/^[a-z0-9.-]+$/)
});

async function allocateTenantCode(app: FastifyInstance): Promise<string> {
  for (let index = 0; index < 6; index += 1) {
    const code = newTenantCode();
    const existing = await app.prisma.tenant.findUnique({ where: { tenantCode: code }, select: { id: true } });
    if (!existing) {
      return code;
    }
  }

  throw new Error("Unable to allocate tenant code");
}

function withPublicPort(url: string): string {
  if (!env.PLATFORM_PUBLIC_PORT) {
    return url;
  }

  return `${url}:${env.PLATFORM_PUBLIC_PORT}`;
}

function buildPublishedUrl(hostname: string): string {
  return withPublicPort(`${env.PLATFORM_PROTOCOL}://${hostname}`);
}

function appendCheckoutSessionPlaceholder(url: string): string {
  if (url.includes("checkout_session_id=")) {
    return url;
  }

  return `${url}${url.includes("?") ? "&" : "?"}checkout_session_id={CHECKOUT_SESSION_ID}`;
}

function serializeTenant<T extends { socialLinks: string | null; theme: string | null }>(
  tenant: T
): Omit<T, "socialLinks" | "theme"> & { socialLinks: Record<string, string>; theme: Record<string, string> } {
  const { socialLinks, theme, ...rest } = tenant;

  return {
    ...rest,
    socialLinks: parseJson<Record<string, string>>(socialLinks, {}),
    theme: parseTenantTheme(theme, "name" in rest && typeof rest.name === "string" ? rest.name : "")
  };
}

function serializeTenantForUser<T extends { socialLinks: string | null; theme: string | null }>(
  tenant: T & {
    members?: Array<{
      id: string;
      role: TenantMemberRole;
      createdAt: Date;
      user: {
        id: string;
        email: string;
      };
    }>;
    billingAccount?: {
      status: BillingStatus;
      currentPeriodEnd: Date | null;
    } | null;
  },
  userRole: TenantMemberRole
) {
  const serialized = serializeTenant(tenant) as unknown as {
    [key: string]: unknown;
    members?: typeof tenant.members;
    teamMembers?: Array<{
      id: string;
      userId: string;
      email: string;
      role: TenantMemberRole;
      createdAt: Date;
    }>;
    userRole: TenantMemberRole;
    billingAccount?: {
      status: BillingStatus;
      currentPeriodEnd: Date | null;
    } | null;
  };

  serialized.userRole = userRole;
  serialized.billingAccount = tenant.billingAccount
    ? {
        status: tenant.billingAccount.status,
        currentPeriodEnd: tenant.billingAccount.currentPeriodEnd
      }
    : null;
  serialized.teamMembers = (tenant.members ?? []).map((member) => ({
    id: member.id,
    userId: member.user.id,
    email: member.user.email,
    role: member.role,
    createdAt: member.createdAt
  }));
  delete serialized.members;

  return serialized;
}

async function findTenantDetails(app: FastifyInstance, tenantId: string) {
  return app.prisma.tenant.findUnique({
    where: {
      id: tenantId
    },
    include: {
      plan: true,
      billingAccount: {
        select: {
          status: true,
          currentPeriodEnd: true
        }
      },
      domains: true,
      apiKeys: {
        where: {
          revokedAt: null
        },
        select: {
          id: true,
          keyPreview: true,
          label: true,
          createdAt: true
        }
      },
      _count: {
        select: {
          pieces: true
        }
      },
      members: {
        orderBy: {
          createdAt: "asc"
        },
        include: {
          user: {
            select: {
              id: true,
              email: true
            }
          }
        }
      }
    }
  });
}

export const tenantRoutes: FastifyPluginAsync = async (app) => {
  app.post("/tenants", async (request, reply) => {
    if (!(await requireAuth(request, reply))) {
      return;
    }

    const parse = tenantCreateSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.flatten() });
    }

    const { name, slug, bio, contactEmail, adminPassword, socialLinks, theme } = parse.data;

    const existing = await app.prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
    if (existing) {
      return reply.status(409).send({ error: "Tenant slug already exists" });
    }

    await ensurePlanCatalog(app.prisma);

    const tenantCode = await allocateTenantCode(app);
    const subdomainHostname = `${slug}.${env.PLATFORM_DOMAIN}`;
    const generatedApiKey = newApiKey();
    const adminPasswordHash = await hashPassword(adminPassword);
    const themeWithAdminHash: Record<string, string> = {
      ...(theme ?? {}),
      adminPasswordHash
    };
    delete themeWithAdminHash.adminPassword;

    const tenant = await app.prisma.$transaction(async (tx) => {
      const createdTenant = await tx.tenant.create({
        data: {
          ownerUserId: request.user!.id,
          planId: PLAN_IDS.starterFree,
          name,
          slug,
          bio,
          contactEmail,
          socialLinks: toJsonString(socialLinks),
          theme: toJsonString(themeWithAdminHash),
          tenantCode,
          published: true,
          publishedUrl: buildPublishedUrl(subdomainHostname)
        }
      });

      await tx.domain.create({
        data: {
          tenantId: createdTenant.id,
          type: DomainType.SUBDOMAIN,
          hostname: subdomainHostname,
          verified: true,
          isPrimary: true
        }
      });

      await tx.billingAccount.create({
        data: {
          tenantId: createdTenant.id,
          status: "INACTIVE"
        }
      });

      await tx.apiKey.create({
        data: {
          tenantId: createdTenant.id,
          keyHash: generatedApiKey.hash,
          keyPreview: generatedApiKey.preview,
          label: "default"
        }
      });

      await tx.tenantMember.create({
        data: {
          tenantId: createdTenant.id,
          userId: request.user!.id,
          role: TenantMemberRole.OWNER
        }
      });

      return createdTenant;
    });

    return reply.status(201).send({
      tenant: serializeTenant(tenant),
      apiKey: generatedApiKey.raw
    });
  });

  app.get("/tenants", async (request, reply) => {
    if (!(await requireAuth(request, reply))) {
      return;
    }

    const tenants = await app.prisma.tenant.findMany({
      where: {
        ownerUserId: request.user!.id
      },
      orderBy: {
        createdAt: "asc"
      },
      include: {
        plan: true,
        domains: {
          orderBy: {
            createdAt: "asc"
          }
        },
        apiKeys: {
          where: {
            revokedAt: null
          },
          select: {
            id: true,
            keyPreview: true,
            label: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            pieces: true
          }
        }
      }
    });

    return reply.send({ tenants: tenants.map((tenant) => serializeTenant(tenant)) });
  });

  app.get("/tenants/:tenantId", async (request, reply) => {
    const params = z.object({ tenantId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid tenant id" });
    }

    const access = await requireTenantAccess(request, reply, params.data.tenantId);
    if (!access) {
      return;
    }

    const payload = await findTenantDetails(app, access.tenant.id);

    return reply.send({ tenant: payload ? serializeTenantForUser(payload, access.role) : null });
  });

  app.patch("/tenants/:tenantId", async (request, reply) => {
    const params = z.object({ tenantId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid tenant id" });
    }

    const access = await requireTenantAccess(request, reply, params.data.tenantId);
    if (!access) {
      return;
    }
    const tenant = access.tenant;

    const parse = tenantUpdateSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.flatten() });
    }

    const updateData: Record<string, unknown> = {};
    if (parse.data.bio !== undefined) updateData.bio = parse.data.bio;
    if (parse.data.contactEmail !== undefined) updateData.contactEmail = parse.data.contactEmail;
    if (parse.data.socialLinks !== undefined) updateData.socialLinks = toJsonString(parse.data.socialLinks);

    let previousAboutPhotoUrlToDelete: string | null = null;
    if (parse.data.theme !== undefined || parse.data.adminPassword !== undefined) {
      const currentTheme = parseJson<Record<string, string>>(tenant.theme, {});
      const previousAboutPhotoUrl = currentTheme.aboutPhotoUrl?.trim() ?? "";
      const nextTheme = {
        ...currentTheme,
        ...(parse.data.theme ?? {})
      };
      delete nextTheme.adminPassword;

      const hasAboutPhotoUpdate =
        parse.data.theme !== undefined && Object.prototype.hasOwnProperty.call(parse.data.theme, "aboutPhotoUrl");
      const nextAboutPhotoUrl = nextTheme.aboutPhotoUrl?.trim() ?? "";
      if (hasAboutPhotoUpdate && previousAboutPhotoUrl && previousAboutPhotoUrl !== nextAboutPhotoUrl) {
        previousAboutPhotoUrlToDelete = previousAboutPhotoUrl;
      }

      if (parse.data.adminPassword !== undefined) {
        nextTheme.adminPasswordHash = await hashPassword(parse.data.adminPassword);
      }

      updateData.theme = toJsonString(nextTheme);
    }

    const updated = await app.prisma.tenant.update({
      where: {
        id: tenant.id
      },
      data: updateData
    });

    if (previousAboutPhotoUrlToDelete) {
      await deleteUploadThingFileByUrl(previousAboutPhotoUrlToDelete, request.log);
    }

    const updatedDetails = await findTenantDetails(app, tenant.id);
    return reply.send({ tenant: updatedDetails ? serializeTenantForUser(updatedDetails, access.role) : serializeTenant(updated) });
  });

  app.patch("/tenants/:tenantId/theme", async (request, reply) => {
    const params = z.object({ tenantId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid tenant id" });
    }

    const access = await requireTenantAccess(request, reply, params.data.tenantId);
    if (!access) {
      return;
    }
    const tenant = access.tenant;

    const parse = themeSelectionSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.flatten() });
    }

    if (!isPaidPlanId(tenant.planId)) {
      return reply.status(403).send({ error: "Theme selection requires a Personal or Studio plan" });
    }

    if (tenant.themeLocked) {
      return reply.status(409).send({ error: "Theme has already been set" });
    }

    await app.prisma.tenant.update({
      where: {
        id: tenant.id
      },
      data: {
        themeId: parse.data.themeId,
        themeLocked: true
      }
    });

    const updated = await findTenantDetails(app, tenant.id);
    return reply.send({ tenant: updated ? serializeTenantForUser(updated, access.role) : null });
  });

  app.post("/tenants/:tenantId/publish", async (request, reply) => {
    const params = z.object({ tenantId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid tenant id" });
    }

    const access = await requireTenantAccess(request, reply, params.data.tenantId);
    if (!access) {
      return;
    }
    const tenant = access.tenant;

    const hostname = `${tenant.slug}.${env.PLATFORM_DOMAIN}`;
    const publishedUrl = buildPublishedUrl(hostname);

    await app.prisma.$transaction(async (tx) => {
      await tx.domain.upsert({
        where: {
          hostname
        },
        update: {
          tenantId: tenant.id,
          type: DomainType.SUBDOMAIN,
          verified: true,
          isPrimary: true
        },
        create: {
          tenantId: tenant.id,
          type: DomainType.SUBDOMAIN,
          hostname,
          verified: true,
          isPrimary: true
        }
      });

      await tx.tenant.update({
        where: {
          id: tenant.id
        },
        data: {
          published: true,
          publishedUrl
        }
      });
    });

    return reply.send({ published: true, publishedUrl });
  });

  app.post("/tenants/:tenantId/team-invitations", async (request, reply) => {
    const params = z.object({ tenantId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid tenant id" });
    }

    const tenant = await requireOwnedTenant(request, reply, params.data.tenantId);
    if (!tenant) {
      return;
    }

    if (tenant.planId !== PLAN_IDS.studio) {
      return reply.status(403).send({ error: "Team invitations require the Studio plan" });
    }

    const parse = teamInviteSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.flatten() });
    }

    const email = parse.data.email.trim().toLowerCase();
    if (email === request.user!.email.toLowerCase()) {
      return reply.status(400).send({ error: "You are already the owner of this Studio" });
    }

    const existingMember = await app.prisma.tenantMember.findFirst({
      where: {
        tenantId: tenant.id,
        user: {
          email
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            passwordChangeRequired: true
          }
        }
      }
    });
    if (existingMember) {
      if (existingMember.user.passwordChangeRequired) {
        const temporaryPassword = newTemporaryPassword();
        const invitation = await app.prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: {
              id: existingMember.user.id
            },
            data: {
              passwordHash: await hashPassword(temporaryPassword),
              passwordChangeRequired: true
            }
          });

          return tx.tenantInvitation.create({
            data: {
              tenantId: tenant.id,
              email,
              invitedByUserId: request.user!.id,
              invitedUserId: existingMember.user.id,
              temporaryAccount: true,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
          });
        });

        const emailResult = await sendTeamInviteEmail(
          {
            to: email,
            tenantName: tenant.name,
            inviterEmail: request.user!.email,
            temporaryPassword
          },
          request.log
        );

        if (emailResult.sent) {
          await app.prisma.tenantInvitation.update({
            where: {
              id: invitation.id
            },
            data: {
              emailSentAt: new Date()
            }
          });
        }

        const updatedTenant = await findTenantDetails(app, tenant.id);

        return reply.status(201).send({
          invitation: {
            id: invitation.id,
            email,
            temporaryAccount: true,
            emailSent: emailResult.sent
          },
          member: {
            id: existingMember.id,
            userId: existingMember.user.id,
            email: existingMember.user.email,
            role: existingMember.role,
            createdAt: existingMember.createdAt
          },
          tenant: updatedTenant ? serializeTenantForUser(updatedTenant, TenantMemberRole.OWNER) : null,
          ...(env.NODE_ENV !== "production" ? { temporaryPassword } : {})
        });
      }

      return reply.status(409).send({ error: "This email is already on the Studio team" });
    }

    const existingUser = await app.prisma.user.findUnique({
      where: {
        email
      }
    });

    const shouldIssueTemporaryPassword = !existingUser || existingUser.passwordChangeRequired;
    const temporaryPassword = shouldIssueTemporaryPassword ? newTemporaryPassword() : undefined;
    const invitedUser = existingUser
      ? shouldIssueTemporaryPassword
        ? await app.prisma.user.update({
            where: {
              id: existingUser.id
            },
            data: {
              passwordHash: await hashPassword(temporaryPassword!),
              passwordChangeRequired: true
            }
          })
        : existingUser
      : await app.prisma.user.create({
          data: {
            email,
            passwordHash: await hashPassword(temporaryPassword!),
            passwordChangeRequired: true
          }
        });

    const [member, invitation] = await app.prisma.$transaction([
      app.prisma.tenantMember.upsert({
        where: {
          tenantId_userId: {
            tenantId: tenant.id,
            userId: invitedUser.id
          }
        },
        update: {
          role: TenantMemberRole.MEMBER
        },
        create: {
          tenantId: tenant.id,
          userId: invitedUser.id,
          role: TenantMemberRole.MEMBER
        }
      }),
      app.prisma.tenantInvitation.create({
        data: {
          tenantId: tenant.id,
          email,
          invitedByUserId: request.user!.id,
          invitedUserId: invitedUser.id,
          temporaryAccount: Boolean(temporaryPassword),
          expiresAt: temporaryPassword ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null
        }
      })
    ]);

    const emailResult = await sendTeamInviteEmail(
      {
        to: email,
        tenantName: tenant.name,
        inviterEmail: request.user!.email,
        temporaryPassword
      },
      request.log
    );

    if (emailResult.sent) {
      await app.prisma.tenantInvitation.update({
        where: {
          id: invitation.id
        },
        data: {
          emailSentAt: new Date()
        }
      });
    }

    const updatedTenant = await findTenantDetails(app, tenant.id);

    return reply.status(201).send({
      invitation: {
        id: invitation.id,
        email,
        temporaryAccount: Boolean(temporaryPassword),
        emailSent: emailResult.sent
      },
      member: {
        id: member.id,
        userId: invitedUser.id,
        email: invitedUser.email,
        role: member.role,
        createdAt: member.createdAt
      },
      tenant: updatedTenant ? serializeTenantForUser(updatedTenant, TenantMemberRole.OWNER) : null,
      ...(env.NODE_ENV !== "production" && temporaryPassword ? { temporaryPassword } : {})
    });
  });

  app.post("/tenants/:tenantId/unpublish", async (request, reply) => {
    const params = z.object({ tenantId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid tenant id" });
    }

    const tenant = await requireOwnedTenant(request, reply, params.data.tenantId);
    if (!tenant) {
      return;
    }

    const updated = await app.prisma.tenant.update({
      where: {
        id: tenant.id
      },
      data: {
        published: false
      }
    });

    return reply.send({ published: updated.published, publishedUrl: updated.publishedUrl });
  });

  app.post("/tenants/:tenantId/api-keys/rotate", async (request, reply) => {
    const params = z.object({ tenantId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid tenant id" });
    }

    const tenant = await requireOwnedTenant(request, reply, params.data.tenantId);
    if (!tenant) {
      return;
    }

    const generatedApiKey = newApiKey();

    await app.prisma.$transaction(async (tx) => {
      await tx.apiKey.updateMany({
        where: {
          tenantId: tenant.id,
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      });

      await tx.apiKey.create({
        data: {
          tenantId: tenant.id,
          keyHash: generatedApiKey.hash,
          keyPreview: generatedApiKey.preview,
          label: "rotated"
        }
      });
    });

    return reply.send({ apiKey: generatedApiKey.raw });
  });

  app.post("/tenants/:tenantId/billing/checkout-sessions", async (request, reply) => {
    const params = z.object({ tenantId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid tenant id" });
    }

    const tenant = await requireOwnedTenant(request, reply, params.data.tenantId);
    if (!tenant) {
      return;
    }

    const parse = checkoutSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.flatten() });
    }

    const { targetPlanId, successUrl, cancelUrl } = parse.data;

    await ensurePlanCatalog(app.prisma);

    const targetPlan = await app.prisma.plan.findUnique({ where: { id: targetPlanId } });
    if (!targetPlan) {
      return reply.status(404).send({ error: "Target plan not found" });
    }

    if (env.NODE_ENV === "test") {
      const providerRef = `stub_${tenant.id}_${Date.now()}`;

      const checkoutSession = await app.prisma.billingCheckoutSession.create({
        data: {
          tenantId: tenant.id,
          targetPlanId,
          provider: "stripe",
          providerRef,
          checkoutUrl: `https://checkout.stripe.local/session/${providerRef}?success=${encodeURIComponent(successUrl)}&cancel=${encodeURIComponent(cancelUrl)}`
        }
      });

      return reply.status(201).send({ checkoutSession });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return reply.status(503).send({ error: "Stripe is not configured" });
    }

    const priceId = stripePriceIdForPlan(targetPlanId);
    if (!priceId) {
      return reply.status(400).send({ error: "No Stripe price configured for this plan" });
    }

    const billingAccount = await app.prisma.billingAccount.findUnique({
      where: {
        tenantId: tenant.id
      }
    });

    if (billingAccount?.stripeSubscriptionId && billingAccount.status === BillingStatus.ACTIVE) {
      const subscription = await stripe.subscriptions.retrieve(billingAccount.stripeSubscriptionId);
      const subscriptionItemId = subscription.items.data[0]?.id;
      if (!subscriptionItemId) {
        return reply.status(409).send({ error: "Stripe subscription has no editable subscription item" });
      }

      const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
        items: [
          {
            id: subscriptionItemId,
            price: priceId
          }
        ],
        metadata: {
          tenantId: tenant.id,
          targetPlanId
        },
        proration_behavior: "create_prorations"
      });

      await applyStripeSubscriptionState(app.prisma, updatedSubscription);

      const checkoutSession = await app.prisma.billingCheckoutSession.create({
        data: {
          tenantId: tenant.id,
          targetPlanId,
          provider: "stripe",
          providerRef: updatedSubscription.id,
          status: CheckoutStatus.COMPLETED,
          checkoutUrl: successUrl,
          completedAt: new Date()
        }
      });

      return reply.status(201).send({ checkoutSession });
    }

    const providerRef = `stub_${tenant.id}_${Date.now()}`;
    const checkoutSessionRecord = await app.prisma.billingCheckoutSession.create({
      data: {
        tenantId: tenant.id,
        targetPlanId,
        provider: "stripe",
        providerRef,
        checkoutUrl: successUrl
      }
    });

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: billingAccount?.stripeCustomerId ?? undefined,
      customer_email: billingAccount?.stripeCustomerId ? undefined : request.user!.email,
      client_reference_id: tenant.id,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: appendCheckoutSessionPlaceholder(successUrl),
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        tenantId: tenant.id,
        targetPlanId,
        checkoutSessionId: checkoutSessionRecord.id
      },
      subscription_data: {
        metadata: {
          tenantId: tenant.id,
          targetPlanId,
          checkoutSessionId: checkoutSessionRecord.id
        }
      }
    });

    const checkoutSession = await app.prisma.billingCheckoutSession.update({
      where: {
        id: checkoutSessionRecord.id
      },
      data: {
        providerRef: stripeSession.id,
        checkoutUrl: stripeSession.url ?? successUrl
      }
    });

    return reply.status(201).send({ checkoutSession });
  });

  app.post("/tenants/:tenantId/billing/checkout-sessions/:sessionId/complete", async (request, reply) => {
    if (env.NODE_ENV !== "test") {
      return reply.status(404).send({ error: "Not found" });
    }

    const params = z
      .object({
        tenantId: z.string().min(1),
        sessionId: z.string().min(1)
      })
      .safeParse(request.params);

    if (!params.success) {
      return reply.status(400).send({ error: "Invalid params" });
    }

    const tenant = await requireOwnedTenant(request, reply, params.data.tenantId);
    if (!tenant) {
      return;
    }

    const session = await app.prisma.billingCheckoutSession.findFirst({
      where: {
        id: params.data.sessionId,
        tenantId: tenant.id
      }
    });

    if (!session) {
      return reply.status(404).send({ error: "Checkout session not found" });
    }

    if (session.status !== CheckoutStatus.PENDING) {
      return reply.status(409).send({ error: "Checkout session is not pending" });
    }

    const now = new Date();
    const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await app.prisma.$transaction(async (tx) => {
      await tx.billingCheckoutSession.update({
        where: {
          id: session.id
        },
        data: {
          status: CheckoutStatus.COMPLETED,
          completedAt: now
        }
      });

      await tx.billingAccount.upsert({
        where: {
          tenantId: tenant.id
        },
        create: {
          tenantId: tenant.id,
          status: "ACTIVE",
          stripeCustomerId: `cus_stub_${tenant.id}`,
          stripeSubscriptionId: `sub_stub_${session.id}`,
          currentPeriodEnd
        },
        update: {
          status: "ACTIVE",
          stripeCustomerId: `cus_stub_${tenant.id}`,
          stripeSubscriptionId: `sub_stub_${session.id}`,
          currentPeriodEnd
        }
      });
    });

    await applyTenantPlanChange(app.prisma, tenant.id, session.targetPlanId);

    const updatedTenant = await app.prisma.tenant.findUnique({
      where: {
        id: tenant.id
      },
      select: {
        id: true,
        planId: true
      }
    });

    return reply.send({ tenant: updatedTenant, completedAt: now });
  });

  app.post("/tenants/:tenantId/billing/sync", async (request, reply) => {
    const params = z.object({ tenantId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid tenant id" });
    }

    const tenant = await requireOwnedTenant(request, reply, params.data.tenantId);
    if (!tenant) {
      return;
    }

    const parse = billingSyncSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.flatten() });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return reply.status(503).send({ error: "Stripe is not configured" });
    }

    const checkoutSessionId =
      parse.data?.checkoutSessionId ??
      (
        await app.prisma.billingCheckoutSession.findFirst({
          where: {
            tenantId: tenant.id,
            provider: "stripe",
            status: CheckoutStatus.PENDING,
            providerRef: {
              startsWith: "cs_"
            }
          },
          orderBy: {
            createdAt: "desc"
          },
          select: {
            providerRef: true
          }
        })
      )?.providerRef;

    let synced = false;
    if (checkoutSessionId) {
      const stripeSession = await stripe.checkout.sessions.retrieve(checkoutSessionId);
      const result = await applyStripeCheckoutSession(app.prisma, stripe, stripeSession);
      synced = result.applied;
    } else {
      const billingAccount = await app.prisma.billingAccount.findUnique({
        where: {
          tenantId: tenant.id
        },
        select: {
          stripeSubscriptionId: true
        }
      });

      if (billingAccount?.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(billingAccount.stripeSubscriptionId);
        await applyStripeSubscriptionState(app.prisma, subscription);
        synced = true;
      }
    }

    const updatedTenant = await findTenantDetails(app, tenant.id);
    return reply.send({
      synced,
      tenant: updatedTenant ? serializeTenantForUser(updatedTenant, TenantMemberRole.OWNER) : null
    });
  });

  app.post("/tenants/:tenantId/billing/portal-sessions", async (request, reply) => {
    const params = z.object({ tenantId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid tenant id" });
    }

    const tenant = await requireOwnedTenant(request, reply, params.data.tenantId);
    if (!tenant) {
      return;
    }

    const parse = portalSessionSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.flatten() });
    }

    const billingAccount = await app.prisma.billingAccount.findUnique({
      where: {
        tenantId: tenant.id
      }
    });
    if (!billingAccount?.stripeCustomerId) {
      return reply.status(409).send({ error: "No Stripe customer found for this tenant" });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return reply.status(503).send({ error: "Stripe is not configured" });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: billingAccount.stripeCustomerId,
      return_url: parse.data.returnUrl
    });

    return reply.status(201).send({ url: session.url });
  });

  app.post("/tenants/:tenantId/billing/cancel", async (request, reply) => {
    const params = z.object({ tenantId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid tenant id" });
    }

    const tenant = await requireOwnedTenant(request, reply, params.data.tenantId);
    if (!tenant) {
      return;
    }

    const billingAccount = await app.prisma.billingAccount.findUnique({
      where: {
        tenantId: tenant.id
      }
    });

    const stripe = getStripeClient();
    if (stripe && billingAccount?.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(billingAccount.stripeSubscriptionId);
    }

    await app.prisma.billingAccount.upsert({
      where: {
        tenantId: tenant.id
      },
      create: {
        tenantId: tenant.id,
        status: BillingStatus.CANCELED
      },
      update: {
        status: BillingStatus.CANCELED,
        currentPeriodEnd: null
      }
    });
    await applyTenantPlanChange(app.prisma, tenant.id, PLAN_IDS.starterFree);

    const updatedTenant = await findTenantDetails(app, tenant.id);
    return reply.send({ tenant: updatedTenant ? serializeTenantForUser(updatedTenant, TenantMemberRole.OWNER) : null });
  });

  app.put("/tenants/:tenantId/domains/custom", async (request, reply) => {
    const params = z.object({ tenantId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid tenant id" });
    }

    const tenant = await requireOwnedTenant(request, reply, params.data.tenantId);
    if (!tenant) {
      return;
    }

    if (!customDomainEligiblePlanIds.has(tenant.planId)) {
      return reply.status(403).send({ error: "Custom domains require a Personal or Studio plan" });
    }

    const parse = customDomainSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.flatten() });
    }

    const hostname = parse.data.hostname.toLowerCase();

    const existingDomain = await app.prisma.domain.findUnique({ where: { hostname } });
    if (existingDomain && existingDomain.tenantId !== tenant.id) {
      return reply.status(409).send({ error: "Hostname already in use" });
    }

    const domain = await app.prisma.domain.upsert({
      where: {
        hostname
      },
      create: {
        tenantId: tenant.id,
        type: DomainType.CUSTOM,
        hostname,
        verified: false,
        isPrimary: true
      },
      update: {
        tenantId: tenant.id,
        type: DomainType.CUSTOM,
        isPrimary: true
      }
    });

    if (tenant.published) {
      await app.prisma.tenant.update({
        where: {
          id: tenant.id
        },
        data: {
          publishedUrl: buildPublishedUrl(hostname)
        }
      });
    }

    return reply.send({ domain });
  });
};

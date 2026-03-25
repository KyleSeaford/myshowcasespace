import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { CheckoutStatus, DomainType } from "@prisma/client";
import { z } from "zod";
import { requireAuth, requireOwnedTenant } from "../lib/guards.js";
import { newApiKey, newTenantCode } from "../lib/crypto.js";
import { env } from "../config/env.js";
import { parseJson, toJsonString } from "../lib/json.js";

const socialLinksSchema = z.record(z.string().min(1).max(80), z.string().max(1000));

const themeSchema = z.record(z.string().min(1).max(80), z.string().max(2_000_000));

const tenantCreateSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().regex(/^[a-z0-9-]{3,40}$/),
  bio: z.string().max(1000).optional(),
  contactEmail: z.string().email(),
  socialLinks: socialLinksSchema.optional(),
  theme: themeSchema.optional()
});

const tenantUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  bio: z.string().max(1000).nullable().optional(),
  contactEmail: z.string().email().optional(),
  socialLinks: socialLinksSchema.optional(),
  theme: themeSchema.optional()
});

const checkoutSchema = z.object({
  targetPlanId: z.enum(["pro"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url()
});

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

function serializeTenant<T extends { socialLinks: string | null; theme: string | null }>(tenant: T): Omit<T, "socialLinks" | "theme"> & { socialLinks: Record<string, string>; theme: Record<string, string> } {
  return {
    ...tenant,
    socialLinks: parseJson<Record<string, string>>(tenant.socialLinks, {}),
    theme: parseJson<Record<string, string>>(tenant.theme, {})
  };
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

    const { name, slug, bio, contactEmail, socialLinks, theme } = parse.data;

    const existing = await app.prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
    if (existing) {
      return reply.status(409).send({ error: "Tenant slug already exists" });
    }

    const freePlan = await app.prisma.plan.findUnique({ where: { id: "free" } });
    if (!freePlan) {
      return reply.status(500).send({ error: "Default plan is not configured" });
    }

    const tenantCode = await allocateTenantCode(app);
    const generatedApiKey = newApiKey();

    const tenant = await app.prisma.$transaction(async (tx) => {
      const createdTenant = await tx.tenant.create({
        data: {
          ownerUserId: request.user!.id,
          planId: freePlan.id,
          name,
          slug,
          bio,
          contactEmail,
          socialLinks: toJsonString(socialLinks),
          theme: toJsonString(theme),
          tenantCode
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

    const tenant = await requireOwnedTenant(request, reply, params.data.tenantId);
    if (!tenant) {
      return;
    }

    const payload = await app.prisma.tenant.findUnique({
      where: {
        id: tenant.id
      },
      include: {
        plan: true,
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
        }
      }
    });

    return reply.send({ tenant: payload ? serializeTenant(payload) : null });
  });

  app.patch("/tenants/:tenantId", async (request, reply) => {
    const params = z.object({ tenantId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid tenant id" });
    }

    const tenant = await requireOwnedTenant(request, reply, params.data.tenantId);
    if (!tenant) {
      return;
    }

    const parse = tenantUpdateSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.flatten() });
    }

    const updateData: Record<string, unknown> = {};
    if (parse.data.name !== undefined) updateData.name = parse.data.name;
    if (parse.data.bio !== undefined) updateData.bio = parse.data.bio;
    if (parse.data.contactEmail !== undefined) updateData.contactEmail = parse.data.contactEmail;
    if (parse.data.socialLinks !== undefined) updateData.socialLinks = toJsonString(parse.data.socialLinks);
    if (parse.data.theme !== undefined) updateData.theme = toJsonString(parse.data.theme);

    const updated = await app.prisma.tenant.update({
      where: {
        id: tenant.id
      },
      data: updateData
    });

    return reply.send({ tenant: serializeTenant(updated) });
  });

  app.post("/tenants/:tenantId/publish", async (request, reply) => {
    const params = z.object({ tenantId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid tenant id" });
    }

    const tenant = await requireOwnedTenant(request, reply, params.data.tenantId);
    if (!tenant) {
      return;
    }

    const hostname = `${tenant.slug}.${env.PLATFORM_DOMAIN}`;
    const publishedUrl = `https://${hostname}`;

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

    const targetPlan = await app.prisma.plan.findUnique({ where: { id: targetPlanId } });
    if (!targetPlan) {
      return reply.status(404).send({ error: "Target plan not found" });
    }

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
  });

  app.post("/tenants/:tenantId/billing/checkout-sessions/:sessionId/complete", async (request, reply) => {
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

      await tx.tenant.update({
        where: {
          id: tenant.id
        },
        data: {
          planId: session.targetPlanId
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

  app.put("/tenants/:tenantId/domains/custom", async (request, reply) => {
    const params = z.object({ tenantId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid tenant id" });
    }

    const tenant = await requireOwnedTenant(request, reply, params.data.tenantId);
    if (!tenant) {
      return;
    }

    if (tenant.planId !== "pro") {
      return reply.status(403).send({ error: "Custom domains require pro plan" });
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
          publishedUrl: `https://${hostname}`
        }
      });
    }

    return reply.send({ domain });
  });
};

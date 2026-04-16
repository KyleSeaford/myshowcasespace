import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  clearSessionCookie,
  createSession,
  destroySession,
  hashPassword,
  sessionTokenFromRequest,
  setSessionCookie,
  verifyPassword
} from "../lib/auth.js";
import { requireAuth } from "../lib/guards.js";
import { CURRENT_LEGAL_VERSION, LEGAL_ACCEPTANCE_ERROR } from "../lib/legal.js";
import { getStripeClient } from "../lib/stripe.js";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

const authRequestSchema = credentialsSchema.extend({
  acceptedLegal: z.boolean()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z.string().min(8).max(128)
});

const changeEmailSchema = z.object({
  email: z.string().email(),
  currentPassword: z.string().min(8).max(128)
});

const deleteAccountSchema = z.object({
  currentPassword: z.string().min(8).max(128)
});

async function recordLegalAcceptance(app: FastifyInstance, userId: string): Promise<void> {
  await app.prisma.user.update({
    where: { id: userId },
    data: {
      legalAcceptedAt: new Date(),
      legalAcceptedVersion: CURRENT_LEGAL_VERSION
    }
  });
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/signup", async (request, reply) => {
    const parse = authRequestSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.flatten() });
    }

    const { email, password, acceptedLegal } = parse.data;
    if (!acceptedLegal) {
      return reply.status(400).send({ error: LEGAL_ACCEPTANCE_ERROR });
    }

    const existing = await app.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ error: "Email is already in use" });
    }

    const passwordHash = await hashPassword(password);
    const user = await app.prisma.user.create({
      data: {
        email,
        passwordHash,
        legalAcceptedAt: new Date(),
        legalAcceptedVersion: CURRENT_LEGAL_VERSION
      }
    });

    const sessionToken = await createSession(app.prisma, user.id);
    setSessionCookie(reply, sessionToken);

    return reply.status(201).send({
      user: {
        id: user.id,
        email: user.email,
        passwordChangeRequired: user.passwordChangeRequired,
        createdAt: user.createdAt
      }
    });
  });

  app.post("/auth/login", async (request, reply) => {
    const parse = authRequestSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.flatten() });
    }

    const { email, password, acceptedLegal } = parse.data;
    if (!acceptedLegal) {
      return reply.status(400).send({ error: LEGAL_ACCEPTANCE_ERROR });
    }

    const user = await app.prisma.user.findUnique({ where: { email } });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    if (!user.legalAcceptedAt || user.legalAcceptedVersion !== CURRENT_LEGAL_VERSION) {
      await recordLegalAcceptance(app, user.id);
    }

    const sessionToken = await createSession(app.prisma, user.id);
    setSessionCookie(reply, sessionToken);

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        passwordChangeRequired: user.passwordChangeRequired,
        createdAt: user.createdAt
      }
    });
  });

  app.post("/auth/change-password", async (request, reply) => {
    if (!(await requireAuth(request, reply))) {
      return;
    }

    const parse = changePasswordSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.flatten() });
    }

    const user = await app.prisma.user.findUnique({
      where: {
        id: request.user!.id
      }
    });

    if (!user || !(await verifyPassword(parse.data.currentPassword, user.passwordHash))) {
      return reply.status(401).send({ error: "Current password is incorrect" });
    }

    const passwordHash = await hashPassword(parse.data.newPassword);
    const updated = await app.prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        passwordHash,
        passwordChangeRequired: false
      }
    });

    await app.prisma.tenantInvitation.updateMany({
      where: {
        invitedUserId: user.id,
        acceptedAt: null
      },
      data: {
        acceptedAt: new Date()
      }
    });

    return reply.send({
      user: {
        id: updated.id,
        email: updated.email,
        passwordChangeRequired: updated.passwordChangeRequired,
        createdAt: updated.createdAt
      }
    });
  });

  app.patch("/auth/email", async (request, reply) => {
    if (!(await requireAuth(request, reply))) {
      return;
    }

    const parse = changeEmailSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.flatten() });
    }

    const nextEmail = parse.data.email.trim().toLowerCase();
    const user = await app.prisma.user.findUnique({
      where: {
        id: request.user!.id
      }
    });

    if (!user || !(await verifyPassword(parse.data.currentPassword, user.passwordHash))) {
      return reply.status(401).send({ error: "Current password is incorrect" });
    }

    const existing = await app.prisma.user.findUnique({
      where: {
        email: nextEmail
      },
      select: {
        id: true
      }
    });
    if (existing && existing.id !== user.id) {
      return reply.status(409).send({ error: "Email is already in use" });
    }

    const updated = await app.prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        email: nextEmail
      }
    });

    const stripe = getStripeClient();
    if (stripe) {
      const billingAccounts = await app.prisma.billingAccount.findMany({
        where: {
          tenant: {
            ownerUserId: user.id
          },
          stripeCustomerId: {
            not: null
          }
        },
        select: {
          stripeCustomerId: true
        }
      });

      await Promise.all(
        billingAccounts.map((account) =>
          account.stripeCustomerId ? stripe.customers.update(account.stripeCustomerId, { email: nextEmail }) : undefined
        )
      );
    }

    return reply.send({
      user: {
        id: updated.id,
        email: updated.email,
        passwordChangeRequired: updated.passwordChangeRequired,
        createdAt: updated.createdAt
      }
    });
  });

  app.post("/auth/logout", async (request, reply) => {
    const sessionToken = sessionTokenFromRequest(request);
    try {
      await destroySession(app.prisma, sessionToken);
    } catch (error) {
      request.log.warn({ err: error }, "Failed to destroy session during logout; clearing cookie anyway.");
    }
    clearSessionCookie(reply);

    return reply.status(204).send();
  });

  app.delete("/auth/me", async (request, reply) => {
    if (!(await requireAuth(request, reply))) {
      return;
    }

    const parse = deleteAccountSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.flatten() });
    }

    const user = await app.prisma.user.findUnique({
      where: {
        id: request.user!.id
      }
    });

    if (!user || !(await verifyPassword(parse.data.currentPassword, user.passwordHash))) {
      return reply.status(401).send({ error: "Current password is incorrect" });
    }

    const billingAccounts = await app.prisma.billingAccount.findMany({
      where: {
        tenant: {
          ownerUserId: user.id
        },
        stripeSubscriptionId: {
          not: null
        }
      },
      select: {
        stripeSubscriptionId: true
      }
    });

    const stripe = getStripeClient();
    if (stripe) {
      await Promise.all(
        billingAccounts.map((account) =>
          account.stripeSubscriptionId ? stripe.subscriptions.cancel(account.stripeSubscriptionId) : undefined
        )
      );
    }

    await app.prisma.user.delete({
      where: {
        id: user.id
      }
    });

    clearSessionCookie(reply);
    return reply.status(204).send();
  });

  app.get("/auth/me", async (request, reply) => {
    if (!(await requireAuth(request, reply))) {
      return;
    }

    const user = request.user!;
    const ownedTenants = await app.prisma.tenant.findMany({
      where: {
        ownerUserId: user.id
      },
      orderBy: {
        createdAt: "asc"
      },
      select: {
        id: true,
        name: true,
        slug: true,
        planId: true,
        themeId: true,
        themeLocked: true,
        published: true,
        publishedUrl: true,
        createdAt: true
      }
    });

    const tenantMemberships = await app.prisma.tenantMember.findMany({
      where: {
        userId: user.id,
        tenant: {
          planId: "studio"
        }
      },
      orderBy: {
        createdAt: "asc"
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            planId: true,
            themeId: true,
            themeLocked: true,
            published: true,
            publishedUrl: true,
            createdAt: true
          }
        }
      }
    });

    const tenantsById = new Map<string, Record<string, unknown>>();
    for (const tenant of ownedTenants) {
      tenantsById.set(tenant.id, {
        ...tenant,
        userRole: "OWNER"
      });
    }
    for (const membership of tenantMemberships) {
      if (!tenantsById.has(membership.tenant.id)) {
        tenantsById.set(membership.tenant.id, {
          ...membership.tenant,
          userRole: membership.role
        });
      }
    }

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        passwordChangeRequired: user.passwordChangeRequired,
        createdAt: user.createdAt
      },
      tenants: Array.from(tenantsById.values()).sort((first, second) => {
        const firstTime = new Date(String(first.createdAt)).getTime();
        const secondTime = new Date(String(second.createdAt)).getTime();
        return firstTime - secondTime;
      })
    });
  });
};

import type { FastifyPluginAsync } from "fastify";
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

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/signup", async (request, reply) => {
    const parse = credentialsSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.flatten() });
    }

    const { email, password } = parse.data;
    const existing = await app.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ error: "Email is already in use" });
    }

    const passwordHash = await hashPassword(password);
    const user = await app.prisma.user.create({
      data: {
        email,
        passwordHash
      }
    });

    const sessionToken = await createSession(app.prisma, user.id);
    setSessionCookie(reply, sessionToken);

    return reply.status(201).send({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  });

  app.post("/auth/login", async (request, reply) => {
    const parse = credentialsSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.flatten() });
    }

    const { email, password } = parse.data;
    const user = await app.prisma.user.findUnique({ where: { email } });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    const sessionToken = await createSession(app.prisma, user.id);
    setSessionCookie(reply, sessionToken);

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt
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

  app.get("/auth/me", async (request, reply) => {
    if (!(await requireAuth(request, reply))) {
      return;
    }

    const user = request.user!;
    const tenants = await app.prisma.tenant.findMany({
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
        published: true,
        publishedUrl: true
      }
    });

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt
      },
      tenants
    });
  });
};

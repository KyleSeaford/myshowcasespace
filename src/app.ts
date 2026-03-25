import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "./db/client.js";
import { authContext } from "./plugins/auth-context.js";
import { authRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";
import { pieceRoutes } from "./routes/pieces.js";
import { tenantApiRoutes } from "./routes/tenant-api.js";
import { tenantRoutes } from "./routes/tenants.js";

export interface AppOptions {
  prisma?: PrismaClient;
  logger?: boolean;
}

export function buildApp(options: AppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? true
  });

  const prisma = options.prisma ?? defaultPrisma;
  app.decorate("prisma", prisma);

  app.register(cookie);
  app.register(authContext);

  app.register(healthRoutes);
  app.register(authRoutes);
  app.register(tenantRoutes);
  app.register(pieceRoutes);
  app.register(tenantApiRoutes);

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    if (reply.statusCode < 400) {
      reply.status(500);
    }

    if (process.env.NODE_ENV === "production") {
      reply.send({
        error: "Internal server error"
      });
      return;
    }

    reply.send({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  });

  return app;
}

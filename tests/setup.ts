import "dotenv/config";
import { execSync } from "node:child_process";
import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";

function getBaseDatabaseUrl(): string {
  const value = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!value) {
    throw new Error("DATABASE_URL or TEST_DATABASE_URL is required for tests");
  }

  return value;
}

function buildIsolatedSchemaUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  const schemaName = `vitest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  url.searchParams.set("schema", schemaName);
  return url.toString();
}

export async function createTestApp(): Promise<{ app: FastifyInstance; prisma: PrismaClient }> {
  process.env.NODE_ENV = "test";
  const isolatedDbUrl = buildIsolatedSchemaUrl(getBaseDatabaseUrl());
  process.env.DATABASE_URL = isolatedDbUrl;
  process.env.PORT = "3001";
  process.env.SESSION_TTL_HOURS = "168";
  process.env.PLATFORM_DOMAIN = "myshowcase.space";
  process.env.COOKIE_NAME = "ms_session";

  execSync("npx prisma db push --force-reset --skip-generate", {
    stdio: "pipe",
    env: {
      ...process.env,
      DATABASE_URL: isolatedDbUrl
    }
  });

  const [{ PrismaClient }, { buildApp }] = await Promise.all([
    import("@prisma/client"),
    import("../src/app.js")
  ]);

  const prisma = new PrismaClient();

  await prisma.plan.createMany({
    data: [
      { id: "free", name: "Free", pieceLimit: 3, monthlyPrice: 0 },
      { id: "pro", name: "Pro", pieceLimit: null, monthlyPrice: 1900 }
    ]
  });

  const app = buildApp({ prisma, logger: false });
  await app.ready();

  return { app, prisma };
}

export async function closeTestApp(app: FastifyInstance, prisma: PrismaClient): Promise<void> {
  await app.close();
  await prisma.$disconnect();
}

export function extractSessionCookie(setCookie: string | string[] | undefined): string {
  if (!setCookie) {
    throw new Error("Session cookie missing from response");
  }

  const values = Array.isArray(setCookie) ? setCookie : [setCookie];
  const cookie = values[0];
  const parts = cookie.split(";");
  return parts[0];
}

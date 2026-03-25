import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from "fastify";
import { z } from "zod";
import { sha256 } from "../lib/crypto.js";
import { parseJson } from "../lib/json.js";

const tenantCodeSchema = z.object({
  tenantCode: z.string().min(6).max(32)
});

async function authorizeTenantApi(
  request: FastifyRequest,
  app: FastifyInstance
): Promise<{ tenantId: string } | null> {
  const params = tenantCodeSchema.safeParse(request.params);
  if (!params.success) {
    return null;
  }

  const rawKey = request.headers["x-tenant-api-key"];
  const apiKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;
  if (!apiKey) {
    return null;
  }

  const tenant = await app.prisma.tenant.findUnique({
    where: {
      tenantCode: params.data.tenantCode
    },
    select: {
      id: true
    }
  });

  if (!tenant) {
    return null;
  }

  const keyHash = sha256(apiKey);

  const activeKey = await app.prisma.apiKey.findFirst({
    where: {
      tenantId: tenant.id,
      keyHash,
      revokedAt: null
    },
    select: {
      id: true
    }
  });

  if (!activeKey) {
    return null;
  }

  return { tenantId: tenant.id };
}

export const tenantApiRoutes: FastifyPluginAsync = async (app) => {
  app.get("/tenant-api/v1/:tenantCode/site", async (request, reply) => {
    const authorized = await authorizeTenantApi(request, app);
    if (!authorized) {
      return reply.status(401).send({ error: "Invalid tenant API credentials" });
    }

    const tenant = await app.prisma.tenant.findUnique({
      where: {
        id: authorized.tenantId
      },
      select: {
        id: true,
        tenantCode: true,
        name: true,
        slug: true,
        bio: true,
        contactEmail: true,
        socialLinks: true,
        theme: true,
        published: true,
        publishedUrl: true
      }
    });

    if (!tenant) {
      return reply.status(404).send({ error: "Tenant not found" });
    }

    if (!tenant.published) {
      return reply.status(403).send({ error: "Tenant site is not published" });
    }

    const pieces = await app.prisma.piece.findMany({
      where: {
        tenantId: tenant.id,
        published: true
      },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        year: true,
        category: true,
        images: true
      }
    });

    return reply.send({
      tenant: {
        ...tenant,
        socialLinks: parseJson<Record<string, string>>(tenant.socialLinks, {}),
        theme: parseJson<Record<string, string>>(tenant.theme, {})
      },
      pieces: pieces.map((piece) => ({
        ...piece,
        images: parseJson<string[]>(piece.images, [])
      }))
    });
  });

  app.get("/public/sites/:slug", async (request, reply) => {
    const params = z.object({ slug: z.string().min(3).max(40) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid slug" });
    }

    const tenant = await app.prisma.tenant.findUnique({
      where: {
        slug: params.data.slug
      },
      select: {
        id: true,
        slug: true,
        name: true,
        bio: true,
        theme: true,
        socialLinks: true,
        published: true,
        publishedUrl: true
      }
    });

    if (!tenant || !tenant.published) {
      return reply.status(404).send({ error: "Published site not found" });
    }

    const pieces = await app.prisma.piece.findMany({
      where: {
        tenantId: tenant.id,
        published: true
      },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      select: {
        title: true,
        slug: true,
        description: true,
        year: true,
        category: true,
        images: true
      }
    });

    return reply.send({
      tenant: {
        ...tenant,
        socialLinks: parseJson<Record<string, string>>(tenant.socialLinks, {}),
        theme: parseJson<Record<string, string>>(tenant.theme, {})
      },
      pieces: pieces.map((piece) => ({
        ...piece,
        images: parseJson<string[]>(piece.images, [])
      }))
    });
  });
};

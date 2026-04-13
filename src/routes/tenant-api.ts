import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from "fastify";
import { z } from "zod";
import { sha256 } from "../lib/crypto.js";
import { parseJson } from "../lib/json.js";
import { isPaidPlanId } from "../lib/plans.js";
import { parseTenantTheme, THEME_IDS } from "../lib/theme.js";

const tenantCodeSchema = z.object({
  tenantCode: z.string().min(6).max(32)
});

const themeSelectionSchema = z.object({
  themeId: z.enum(THEME_IDS)
});

const hostnameQuerySchema = z.object({
  hostname: z.string().min(3).max(253).optional()
});

function normalizeHostname(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    return parsed.hostname;
  } catch {
    return trimmed.split(":")[0] ?? "";
  }
}

function firstHeader(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function serializeTenantSite<T extends { socialLinks: string | null; theme: string | null; name: string }>(tenant: T) {
  return {
    ...tenant,
    socialLinks: parseJson<Record<string, string>>(tenant.socialLinks, {}),
    theme: parseTenantTheme(tenant.theme, tenant.name)
  };
}

async function authorizeTenantApiForTenantId(
  request: FastifyRequest,
  app: FastifyInstance,
  tenantId: string
): Promise<{ tenantId: string } | null> {
  const rawKey = request.headers["x-tenant-api-key"];
  const apiKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;
  if (!apiKey) {
    return null;
  }

  const keyHash = sha256(apiKey);

  const activeKey = await app.prisma.apiKey.findFirst({
    where: {
      tenantId,
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

  return { tenantId };
}

async function authorizeTenantApi(
  request: FastifyRequest,
  app: FastifyInstance
): Promise<{ tenantId: string } | null> {
  const params = tenantCodeSchema.safeParse(request.params);
  if (!params.success) {
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

  return authorizeTenantApiForTenantId(request, app, tenant.id);
}

async function authorizeTenantApiByHostname(
  request: FastifyRequest,
  app: FastifyInstance
): Promise<{ tenantId: string } | null> {
  const hostname = normalizeHostname(
    firstHeader(request.headers["x-tenant-hostname"]) ||
      firstHeader(request.headers["x-forwarded-host"]) ||
      firstHeader(request.headers.host)
  );

  if (!hostname) {
    return null;
  }

  const domain = await app.prisma.domain.findUnique({
    where: {
      hostname
    },
    select: {
      tenantId: true
    }
  });

  if (!domain) {
    return null;
  }

  return authorizeTenantApiForTenantId(request, app, domain.tenantId);
}

async function setTenantTheme(
  app: FastifyInstance,
  tenantId: string,
  themeId: (typeof THEME_IDS)[number]
) {
  const tenant = await app.prisma.tenant.findUnique({
    where: {
      id: tenantId
    },
    select: {
      id: true,
      planId: true,
      themeId: true,
      themeLocked: true
    }
  });

  if (!tenant) {
    return { status: 404 as const, payload: { error: "Tenant not found" } };
  }

  if (!isPaidPlanId(tenant.planId)) {
    return { status: 403 as const, payload: { error: "Theme selection requires a Personal or Studio plan" } };
  }

  if (tenant.themeLocked) {
    return { status: 409 as const, payload: { error: "Theme has already been set" } };
  }

  const updated = await app.prisma.tenant.update({
    where: {
      id: tenant.id
    },
    data: {
      themeId,
      themeLocked: true
    },
    select: {
      id: true,
      planId: true,
      themeId: true,
      themeLocked: true
    }
  });

  return { status: 200 as const, payload: { tenant: updated } };
}

export const tenantApiRoutes: FastifyPluginAsync = async (app) => {
  app.patch("/admin/theme", async (request, reply) => {
    const authorized = await authorizeTenantApiByHostname(request, app);
    if (!authorized) {
      return reply.status(401).send({ error: "Invalid tenant API credentials" });
    }

    const parse = themeSelectionSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.flatten() });
    }

    const result = await setTenantTheme(app, authorized.tenantId, parse.data.themeId);
    return reply.status(result.status).send(result.payload);
  });

  app.patch("/tenant-api/v1/:tenantCode/theme", async (request, reply) => {
    const authorized = await authorizeTenantApi(request, app);
    if (!authorized) {
      return reply.status(401).send({ error: "Invalid tenant API credentials" });
    }

    const parse = themeSelectionSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.flatten() });
    }

    const result = await setTenantTheme(app, authorized.tenantId, parse.data.themeId);
    return reply.status(result.status).send(result.payload);
  });

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
        planId: true,
        name: true,
        slug: true,
        bio: true,
        contactEmail: true,
        socialLinks: true,
        theme: true,
        themeId: true,
        themeLocked: true,
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
      tenant: serializeTenantSite(tenant),
      pieces: pieces.map((piece) => ({
        ...piece,
        images: parseJson<string[]>(piece.images, [])
      }))
    });
  });

  app.get("/public/site", async (request, reply) => {
    const parse = hostnameQuerySchema.safeParse(request.query);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid hostname", details: parse.error.flatten() });
    }

    const hostname = normalizeHostname(
      parse.data.hostname ||
        firstHeader(request.headers["x-tenant-hostname"]) ||
        firstHeader(request.headers["x-forwarded-host"]) ||
        firstHeader(request.headers.host)
    );
    if (!hostname) {
      return reply.status(400).send({ error: "Invalid hostname" });
    }

    const domain = await app.prisma.domain.findUnique({
      where: {
        hostname
      },
      include: {
        tenant: {
          select: {
            id: true,
            slug: true,
            planId: true,
            name: true,
            bio: true,
            theme: true,
            themeId: true,
            themeLocked: true,
            socialLinks: true,
            published: true,
            publishedUrl: true
          }
        }
      }
    });

    if (!domain?.tenant || !domain.tenant.published) {
      return reply.status(404).send({ error: "Published site not found" });
    }

    const pieces = await app.prisma.piece.findMany({
      where: {
        tenantId: domain.tenant.id,
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
      tenant: serializeTenantSite(domain.tenant),
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
        planId: true,
        name: true,
        bio: true,
        theme: true,
        themeId: true,
        themeLocked: true,
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
      tenant: serializeTenantSite(tenant),
      pieces: pieces.map((piece) => ({
        ...piece,
        images: parseJson<string[]>(piece.images, [])
      }))
    });
  });
};

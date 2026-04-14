import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { requireTenantAccess } from "../lib/guards.js";
import { parseJson, toJsonString } from "../lib/json.js";

const paramsSchema = z.object({
  tenantId: z.string().min(1)
});

const pieceCreateSchema = z.object({
  title: z.string().min(1).max(160),
  slug: z.string().regex(/^[a-z0-9-]{3,80}$/),
  description: z.string().max(4000).optional(),
  year: z.number().int().min(1000).max(3000).optional(),
  category: z.string().min(1).max(120).optional(),
  images: z.array(z.string().url()).max(20).default([]),
  published: z.boolean().optional()
});

const pieceUpdateSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  slug: z.string().regex(/^[a-z0-9-]{3,80}$/).optional(),
  description: z.string().max(4000).nullable().optional(),
  year: z.number().int().min(1000).max(3000).nullable().optional(),
  category: z.string().min(1).max(120).nullable().optional(),
  images: z.array(z.string().url()).max(20).optional(),
  published: z.boolean().optional()
});

async function assertPieceLimit(
  tenantId: string,
  server: FastifyInstance
): Promise<{ allowed: true } | { allowed: false; limit: number }> {
  const tenant = await server.prisma.tenant.findUnique({
    where: {
      id: tenantId
    },
    include: {
      plan: true,
      _count: {
        select: {
          pieces: true
        }
      }
    }
  });

  if (!tenant) {
    return { allowed: false, limit: 0 };
  }

  const limit = tenant.plan.pieceLimit;
  if (limit !== null && tenant._count.pieces >= limit) {
    return { allowed: false, limit };
  }

  return { allowed: true };
}

export const pieceRoutes: FastifyPluginAsync = async (app) => {
  const serializePiece = <T extends { images: string | null }>(piece: T) => ({
    ...piece,
    images: parseJson<string[]>(piece.images, [])
  });

  app.get("/tenants/:tenantId/pieces", async (request, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid tenant id" });
    }

    const access = await requireTenantAccess(request, reply, params.data.tenantId);
    if (!access) {
      return;
    }
    const tenant = access.tenant;

    const pieces = await app.prisma.piece.findMany({
      where: {
        tenantId: tenant.id
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return reply.send({ pieces: pieces.map((piece) => serializePiece(piece)) });
  });

  app.post("/tenants/:tenantId/pieces", async (request, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid tenant id" });
    }

    const access = await requireTenantAccess(request, reply, params.data.tenantId);
    if (!access) {
      return;
    }
    const tenant = access.tenant;

    const parse = pieceCreateSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.flatten() });
    }

    const limitResult = await assertPieceLimit(tenant.id, app);
    if (!limitResult.allowed) {
      return reply.status(403).send({
        error: `Piece limit reached for current plan (${limitResult.limit})`
      });
    }

    const existing = await app.prisma.piece.findFirst({
      where: {
        tenantId: tenant.id,
        slug: parse.data.slug
      },
      select: {
        id: true
      }
    });

    if (existing) {
      return reply.status(409).send({ error: "Piece slug already exists" });
    }

    const piece = await app.prisma.piece.create({
      data: {
        tenantId: tenant.id,
        ...parse.data,
        images: toJsonString(parse.data.images)
      }
    });

    return reply.status(201).send({ piece: serializePiece(piece) });
  });

  app.get("/tenants/:tenantId/pieces/:pieceId", async (request, reply) => {
    const params = z
      .object({
        tenantId: z.string().min(1),
        pieceId: z.string().min(1)
      })
      .safeParse(request.params);

    if (!params.success) {
      return reply.status(400).send({ error: "Invalid params" });
    }

    const access = await requireTenantAccess(request, reply, params.data.tenantId);
    if (!access) {
      return;
    }
    const tenant = access.tenant;

    const piece = await app.prisma.piece.findFirst({
      where: {
        id: params.data.pieceId,
        tenantId: tenant.id
      }
    });

    if (!piece) {
      return reply.status(404).send({ error: "Piece not found" });
    }

    return reply.send({ piece: serializePiece(piece) });
  });

  app.patch("/tenants/:tenantId/pieces/:pieceId", async (request, reply) => {
    const params = z
      .object({
        tenantId: z.string().min(1),
        pieceId: z.string().min(1)
      })
      .safeParse(request.params);

    if (!params.success) {
      return reply.status(400).send({ error: "Invalid params" });
    }

    const access = await requireTenantAccess(request, reply, params.data.tenantId);
    if (!access) {
      return;
    }
    const tenant = access.tenant;

    const parse = pieceUpdateSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.flatten() });
    }

    const existingPiece = await app.prisma.piece.findFirst({
      where: {
        id: params.data.pieceId,
        tenantId: tenant.id
      }
    });

    if (!existingPiece) {
      return reply.status(404).send({ error: "Piece not found" });
    }

    if (parse.data.slug && parse.data.slug !== existingPiece.slug) {
      const conflictingSlug = await app.prisma.piece.findFirst({
        where: {
          tenantId: tenant.id,
          slug: parse.data.slug,
          NOT: {
            id: existingPiece.id
          }
        },
        select: {
          id: true
        }
      });

      if (conflictingSlug) {
        return reply.status(409).send({ error: "Piece slug already exists" });
      }
    }

    const updateData: Record<string, unknown> = { ...parse.data };
    if (parse.data.images !== undefined) {
      updateData.images = toJsonString(parse.data.images);
    }

    const piece = await app.prisma.piece.update({
      where: {
        id: existingPiece.id
      },
      data: updateData
    });

    return reply.send({ piece: serializePiece(piece) });
  });

  app.delete("/tenants/:tenantId/pieces/:pieceId", async (request, reply) => {
    const params = z
      .object({
        tenantId: z.string().min(1),
        pieceId: z.string().min(1)
      })
      .safeParse(request.params);

    if (!params.success) {
      return reply.status(400).send({ error: "Invalid params" });
    }

    const access = await requireTenantAccess(request, reply, params.data.tenantId);
    if (!access) {
      return;
    }
    const tenant = access.tenant;

    const deleted = await app.prisma.piece.deleteMany({
      where: {
        id: params.data.pieceId,
        tenantId: tenant.id
      }
    });

    if (deleted.count === 0) {
      return reply.status(404).send({ error: "Piece not found" });
    }

    return reply.status(204).send();
  });

  app.post("/tenants/:tenantId/pieces/:pieceId/publish", async (request, reply) => {
    const params = z
      .object({
        tenantId: z.string().min(1),
        pieceId: z.string().min(1)
      })
      .safeParse(request.params);

    if (!params.success) {
      return reply.status(400).send({ error: "Invalid params" });
    }

    const access = await requireTenantAccess(request, reply, params.data.tenantId);
    if (!access) {
      return;
    }
    const tenant = access.tenant;

    const piece = await app.prisma.piece.findFirst({
      where: {
        id: params.data.pieceId,
        tenantId: tenant.id
      }
    });

    if (!piece) {
      return reply.status(404).send({ error: "Piece not found" });
    }

    const updated = await app.prisma.piece.update({
      where: {
        id: piece.id
      },
      data: {
        published: true
      }
    });

    return reply.send({ piece: serializePiece(updated) });
  });

  app.post("/tenants/:tenantId/pieces/:pieceId/unpublish", async (request, reply) => {
    const params = z
      .object({
        tenantId: z.string().min(1),
        pieceId: z.string().min(1)
      })
      .safeParse(request.params);

    if (!params.success) {
      return reply.status(400).send({ error: "Invalid params" });
    }

    const access = await requireTenantAccess(request, reply, params.data.tenantId);
    if (!access) {
      return;
    }
    const tenant = access.tenant;

    const piece = await app.prisma.piece.findFirst({
      where: {
        id: params.data.pieceId,
        tenantId: tenant.id
      }
    });

    if (!piece) {
      return reply.status(404).send({ error: "Piece not found" });
    }

    const updated = await app.prisma.piece.update({
      where: {
        id: piece.id
      },
      data: {
        published: false
      }
    });

    return reply.send({ piece: serializePiece(updated) });
  });
};

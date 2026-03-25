import type { FastifyReply, FastifyRequest } from "fastify";
import type { Tenant } from "@prisma/client";

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  if (!request.user) {
    reply.status(401).send({ error: "Authentication required" });
    return false;
  }

  return true;
}

export async function requireOwnedTenant(
  request: FastifyRequest,
  reply: FastifyReply,
  tenantId: string
): Promise<Tenant | null> {
  if (!request.user) {
    reply.status(401).send({ error: "Authentication required" });
    return null;
  }

  const tenant = await request.server.prisma.tenant.findUnique({
    where: {
      id: tenantId
    }
  });

  if (!tenant || tenant.ownerUserId !== request.user.id) {
    reply.status(404).send({ error: "Tenant not found" });
    return null;
  }

  return tenant;
}
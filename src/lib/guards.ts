import type { FastifyReply, FastifyRequest } from "fastify";
import { TenantMemberRole, type Tenant } from "@prisma/client";

export type TenantAccess = {
  tenant: Tenant;
  role: TenantMemberRole;
};

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

  if (request.user.passwordChangeRequired) {
    reply.status(403).send({ error: "Password change required" });
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

export async function requireTenantAccess(
  request: FastifyRequest,
  reply: FastifyReply,
  tenantId: string
): Promise<TenantAccess | null> {
  if (!request.user) {
    reply.status(401).send({ error: "Authentication required" });
    return null;
  }

  if (request.user.passwordChangeRequired) {
    reply.status(403).send({ error: "Password change required" });
    return null;
  }

  const tenant = await request.server.prisma.tenant.findUnique({
    where: {
      id: tenantId
    }
  });

  if (!tenant) {
    reply.status(404).send({ error: "Tenant not found" });
    return null;
  }

  if (tenant.ownerUserId === request.user.id) {
    return {
      tenant,
      role: TenantMemberRole.OWNER
    };
  }

  const member = await request.server.prisma.tenantMember.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId: request.user.id
      }
    },
    select: {
      role: true
    }
  });

  if (!member) {
    reply.status(404).send({ error: "Tenant not found" });
    return null;
  }

  return {
    tenant,
    role: member.role
  };
}

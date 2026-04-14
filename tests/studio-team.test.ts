import { afterEach, describe, expect, it } from "vitest";
import { closeTestApp, createTestApp, extractSessionCookie } from "./setup.js";

async function createOwnerWithTenant() {
  const { app, prisma } = await createTestApp();

  const signup = await app.inject({
    method: "POST",
    url: "/auth/signup",
    payload: {
      email: "owner@example.com",
      password: "StrongPass123!",
      acceptedLegal: true
    }
  });
  expect(signup.statusCode).toBe(201);
  const ownerCookie = extractSessionCookie(signup.headers["set-cookie"]);

  const tenantCreate = await app.inject({
    method: "POST",
    url: "/tenants",
    headers: {
      cookie: ownerCookie
    },
    payload: {
      name: "North Studio",
      slug: "north-studio",
      bio: "testing",
      contactEmail: "owner@example.com",
      adminPassword: "adminpass",
      socialLinks: {},
      theme: {
        layout: "grid"
      }
    }
  });
  expect(tenantCreate.statusCode).toBe(201);
  const tenantId = tenantCreate.json().tenant.id as string;

  return { app, prisma, ownerCookie, tenantId };
}

describe("studio team invitations", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    if (cleanup) {
      await cleanup();
      cleanup = undefined;
    }
  });

  it("requires the Studio plan before inviting a team member", async () => {
    const context = await createOwnerWithTenant();
    cleanup = async () => closeTestApp(context.app, context.prisma);

    const invite = await context.app.inject({
      method: "POST",
      url: `/tenants/${context.tenantId}/team-invitations`,
      headers: {
        cookie: context.ownerCookie
      },
      payload: {
        email: "member@example.com"
      }
    });

    expect(invite.statusCode).toBe(403);
    expect(invite.json().error).toBe("Team invitations require the Studio plan");
  }, 120_000);

  it("creates a temporary account that must change password before editing the Studio tenant", async () => {
    const context = await createOwnerWithTenant();
    cleanup = async () => closeTestApp(context.app, context.prisma);

    const checkout = await context.app.inject({
      method: "POST",
      url: `/tenants/${context.tenantId}/billing/checkout-sessions`,
      headers: {
        cookie: context.ownerCookie
      },
      payload: {
        targetPlanId: "studio",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel"
      }
    });
    expect(checkout.statusCode).toBe(201);

    const complete = await context.app.inject({
      method: "POST",
      url: `/tenants/${context.tenantId}/billing/checkout-sessions/${checkout.json().checkoutSession.id}/complete`,
      headers: {
        cookie: context.ownerCookie
      }
    });
    expect(complete.statusCode).toBe(200);

    const invite = await context.app.inject({
      method: "POST",
      url: `/tenants/${context.tenantId}/team-invitations`,
      headers: {
        cookie: context.ownerCookie
      },
      payload: {
        email: "member@example.com"
      }
    });
    expect(invite.statusCode).toBe(201);
    const inviteBody = invite.json();
    expect(inviteBody.invitation.temporaryAccount).toBe(true);
    expect(inviteBody.temporaryPassword).toEqual(expect.any(String));

    const login = await context.app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "member@example.com",
        password: inviteBody.temporaryPassword,
        acceptedLegal: true
      }
    });
    expect(login.statusCode).toBe(200);
    expect(login.json().user.passwordChangeRequired).toBe(true);
    const memberCookie = extractSessionCookie(login.headers["set-cookie"]);

    const blockedTenantAccess = await context.app.inject({
      method: "GET",
      url: `/tenants/${context.tenantId}`,
      headers: {
        cookie: memberCookie
      }
    });
    expect(blockedTenantAccess.statusCode).toBe(403);

    const changePassword = await context.app.inject({
      method: "POST",
      url: "/auth/change-password",
      headers: {
        cookie: memberCookie
      },
      payload: {
        currentPassword: inviteBody.temporaryPassword,
        newPassword: "MemberPass123!"
      }
    });
    expect(changePassword.statusCode).toBe(200);
    expect(changePassword.json().user.passwordChangeRequired).toBe(false);

    const memberProfile = await context.app.inject({
      method: "GET",
      url: "/auth/me",
      headers: {
        cookie: memberCookie
      }
    });
    expect(memberProfile.statusCode).toBe(200);
    expect(memberProfile.json().tenants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: context.tenantId,
          userRole: "MEMBER"
        })
      ])
    );

    const tenantAccess = await context.app.inject({
      method: "GET",
      url: `/tenants/${context.tenantId}`,
      headers: {
        cookie: memberCookie
      }
    });
    expect(tenantAccess.statusCode).toBe(200);
    expect(tenantAccess.json().tenant.userRole).toBe("MEMBER");

    const pieceCreate = await context.app.inject({
      method: "POST",
      url: `/tenants/${context.tenantId}/pieces`,
      headers: {
        cookie: memberCookie
      },
      payload: {
        title: "Member Piece",
        slug: "member-piece",
        description: "Added by a Studio member",
        images: ["https://example.com/member-piece.jpg"]
      }
    });
    expect(pieceCreate.statusCode).toBe(201);
  }, 120_000);

  it("sends a fresh temporary password for existing pending invite accounts", async () => {
    const context = await createOwnerWithTenant();
    cleanup = async () => closeTestApp(context.app, context.prisma);

    await context.prisma.tenant.update({
      where: {
        id: context.tenantId
      },
      data: {
        planId: "studio"
      }
    });

    await context.prisma.user.create({
      data: {
        email: "pending@example.com",
        passwordHash: "old-temporary-password-hash",
        passwordChangeRequired: true
      }
    });

    const invite = await context.app.inject({
      method: "POST",
      url: `/tenants/${context.tenantId}/team-invitations`,
      headers: {
        cookie: context.ownerCookie
      },
      payload: {
        email: "pending@example.com"
      }
    });

    expect(invite.statusCode).toBe(201);
    const body = invite.json();
    expect(body.invitation.temporaryAccount).toBe(true);
    expect(body.temporaryPassword).toEqual(expect.any(String));

    const login = await context.app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "pending@example.com",
        password: body.temporaryPassword,
        acceptedLegal: true
      }
    });

    expect(login.statusCode).toBe(200);
    expect(login.json().user.passwordChangeRequired).toBe(true);
  }, 120_000);
});

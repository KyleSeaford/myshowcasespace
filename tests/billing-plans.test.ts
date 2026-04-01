import { afterEach, describe, expect, it } from "vitest";
import { closeTestApp, createTestApp, extractSessionCookie } from "./setup.js";

describe("billing plans", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    if (cleanup) {
      await cleanup();
      cleanup = undefined;
    }
  });

  it("allows upgrading to studio and connecting a custom domain", async () => {
    const { app, prisma } = await createTestApp();
    cleanup = async () => closeTestApp(app, prisma);

    const signup = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: {
        email: "studio@example.com",
        password: "StrongPass123!",
        acceptedLegal: true
      }
    });

    expect(signup.statusCode).toBe(201);
    const sessionCookie = extractSessionCookie(signup.headers["set-cookie"]);

    const tenantCreate = await app.inject({
      method: "POST",
      url: "/tenants",
      headers: {
        cookie: sessionCookie
      },
      payload: {
        name: "Studio Collective",
        slug: "studio-collective",
        bio: "testing",
        contactEmail: "studio@example.com",
        adminPassword: "adminpass",
        socialLinks: {},
        theme: {
          layout: "grid"
        }
      }
    });

    expect(tenantCreate.statusCode).toBe(201);
    const tenantId: string = tenantCreate.json().tenant.id;

    const checkout = await app.inject({
      method: "POST",
      url: `/tenants/${tenantId}/billing/checkout-sessions`,
      headers: {
        cookie: sessionCookie
      },
      payload: {
        targetPlanId: "studio",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel"
      }
    });

    expect(checkout.statusCode).toBe(201);
    const sessionId: string = checkout.json().checkoutSession.id;

    const complete = await app.inject({
      method: "POST",
      url: `/tenants/${tenantId}/billing/checkout-sessions/${sessionId}/complete`,
      headers: {
        cookie: sessionCookie
      }
    });

    expect(complete.statusCode).toBe(200);
    expect(complete.json().tenant.planId).toBe("studio");

    const domainUpdate = await app.inject({
      method: "PUT",
      url: `/tenants/${tenantId}/domains/custom`,
      headers: {
        cookie: sessionCookie
      },
      payload: {
        hostname: "studio.example.com"
      }
    });

    expect(domainUpdate.statusCode).toBe(200);
    expect(domainUpdate.json().domain.hostname).toBe("studio.example.com");
  });
});

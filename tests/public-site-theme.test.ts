import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeTestApp, createTestApp, extractSessionCookie } from "./setup.js";
import { PLAN_IDS } from "../src/lib/plans.js";

describe.sequential("public site theme", () => {
  let app: FastifyInstance | undefined;
  let prisma: PrismaClient | undefined;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  }, 120_000);

  afterAll(async () => {
    if (app && prisma) {
      await closeTestApp(app, prisma);
    }
  });

  it("returns a sanitized theme with a hero title fallback", async () => {
    expect(app).toBeDefined();

    const signup = await app!.inject({
      method: "POST",
      url: "/auth/signup",
      payload: {
        email: "public@example.com",
        password: "StrongPass123!",
        acceptedLegal: true
      }
    });

    expect(signup.statusCode).toBe(201);
    const sessionCookie = extractSessionCookie(signup.headers["set-cookie"]);

    const tenantCreate = await app!.inject({
      method: "POST",
      url: "/tenants",
      headers: {
        cookie: sessionCookie
      },
      payload: {
        name: "Bob Smith",
        slug: "bob-smith",
        bio: "testing",
        contactEmail: "public@example.com",
        adminPassword: "adminpass",
        socialLinks: {},
        theme: {
          creatorName: "Bob Smith",
          discipline: "Artist",
          workTogether: "Commissions"
        }
      }
    });

    expect(tenantCreate.statusCode).toBe(201);

    const publicSite = await app!.inject({
      method: "GET",
      url: "/public/sites/bob-smith"
    });

    expect(publicSite.statusCode).toBe(200);
    expect(publicSite.json().tenant.planId).toBe(PLAN_IDS.starterFree);
    expect(publicSite.json().tenant.themeId).toBe("default");
    expect(publicSite.json().tenant.themeLocked).toBe(false);
    expect(publicSite.json().tenant.theme.heroTitle).toBe("Bob Smith");
    expect(publicSite.json().tenant.theme.adminPasswordHash).toBeUndefined();

    const publicSiteByHost = await app!.inject({
      method: "GET",
      url: "/public/site?hostname=bob-smith.myshowcase.space"
    });

    expect(publicSiteByHost.statusCode).toBe(200);
    expect(publicSiteByHost.json().tenant.id).toBe(publicSite.json().tenant.id);
  }, 60_000);

  it("lets paid tenants choose a supported theme once through the admin API", async () => {
    expect(app).toBeDefined();

    const signup = await app!.inject({
      method: "POST",
      url: "/auth/signup",
      payload: {
        email: "theme-picker@example.com",
        password: "StrongPass123!",
        acceptedLegal: true
      }
    });

    expect(signup.statusCode).toBe(201);
    const sessionCookie = extractSessionCookie(signup.headers["set-cookie"]);

    const tenantCreate = await app!.inject({
      method: "POST",
      url: "/tenants",
      headers: {
        cookie: sessionCookie
      },
      payload: {
        name: "Theme Picker",
        slug: "theme-picker",
        bio: "testing",
        contactEmail: "theme-picker@example.com",
        adminPassword: "adminpass",
        socialLinks: {},
        theme: {
          layout: "grid"
        }
      }
    });

    expect(tenantCreate.statusCode).toBe(201);
    const tenantId: string = tenantCreate.json().tenant.id;
    const tenantCode: string = tenantCreate.json().tenant.tenantCode;
    const apiKey: string = tenantCreate.json().apiKey;

    const blockedSettingsTheme = await app!.inject({
      method: "PATCH",
      url: `/tenants/${tenantId}/theme`,
      headers: {
        cookie: sessionCookie
      },
      payload: {
        themeId: "sunny"
      }
    });

    expect(blockedSettingsTheme.statusCode).toBe(403);

    const blockedFreeTheme = await app!.inject({
      method: "PATCH",
      url: "/admin/theme",
      headers: {
        "x-tenant-hostname": "theme-picker.myshowcase.space",
        "x-tenant-api-key": apiKey
      },
      payload: {
        themeId: "sunny"
      }
    });

    expect(blockedFreeTheme.statusCode).toBe(403);

    const checkout = await app!.inject({
      method: "POST",
      url: `/tenants/${tenantId}/billing/checkout-sessions`,
      headers: {
        cookie: sessionCookie
      },
      payload: {
        targetPlanId: PLAN_IDS.personal,
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel"
      }
    });

    expect(checkout.statusCode).toBe(201);
    const sessionId: string = checkout.json().checkoutSession.id;

    const complete = await app!.inject({
      method: "POST",
      url: `/tenants/${tenantId}/billing/checkout-sessions/${sessionId}/complete`,
      headers: {
        cookie: sessionCookie
      }
    });

    expect(complete.statusCode).toBe(200);

    const setTheme = await app!.inject({
      method: "PATCH",
      url: `/tenants/${tenantId}/theme`,
      headers: {
        cookie: sessionCookie
      },
      payload: {
        themeId: "sunny"
      }
    });

    expect(setTheme.statusCode).toBe(200);
    expect(setTheme.json().tenant.themeId).toBe("sunny");
    expect(setTheme.json().tenant.themeLocked).toBe(true);

    const tenantApiSite = await app!.inject({
      method: "GET",
      url: `/tenant-api/v1/${tenantCode}/site`,
      headers: {
        "x-tenant-api-key": apiKey
      }
    });

    expect(tenantApiSite.statusCode).toBe(200);
    expect(tenantApiSite.json().tenant.planId).toBe(PLAN_IDS.personal);
    expect(tenantApiSite.json().tenant.themeId).toBe("sunny");
    expect(tenantApiSite.json().tenant.themeLocked).toBe(true);

    const blockedSecondTheme = await app!.inject({
      method: "PATCH",
      url: "/admin/theme",
      headers: {
        "x-tenant-hostname": "theme-picker.myshowcase.space",
        "x-tenant-api-key": apiKey
      },
      payload: {
        themeId: "dark"
      }
    });

    expect(blockedSecondTheme.statusCode).toBe(409);
  }, 90_000);
});

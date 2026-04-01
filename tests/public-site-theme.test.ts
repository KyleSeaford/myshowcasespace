import { afterEach, describe, expect, it } from "vitest";
import { closeTestApp, createTestApp, extractSessionCookie } from "./setup.js";

describe("public site theme", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    if (cleanup) {
      await cleanup();
      cleanup = undefined;
    }
  });

  it("returns a sanitized theme with a hero title fallback", async () => {
    const { app, prisma } = await createTestApp();
    cleanup = async () => closeTestApp(app, prisma);

    const signup = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: {
        email: "public@example.com",
        password: "StrongPass123!"
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

    const publicSite = await app.inject({
      method: "GET",
      url: "/public/sites/bob-smith"
    });

    expect(publicSite.statusCode).toBe(200);
    expect(publicSite.json().tenant.theme.heroTitle).toBe("Bob Smith");
    expect(publicSite.json().tenant.theme.adminPasswordHash).toBeUndefined();
  }, 60_000);
});

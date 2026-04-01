import { afterEach, describe, expect, it } from "vitest";
import { closeTestApp, createTestApp, extractSessionCookie } from "./setup.js";

describe("piece limits", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    if (cleanup) {
      await cleanup();
      cleanup = undefined;
    }
  });

  it("enforces free plan limit of 3 pieces", async () => {
    const { app, prisma } = await createTestApp();
    cleanup = async () => closeTestApp(app, prisma);

    const signup = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: {
        email: "pieces@example.com",
        password: "StrongPass123!",
        acceptedLegal: true
      }
    });

    const sessionCookie = extractSessionCookie(signup.headers["set-cookie"]);

    const tenantCreate = await app.inject({
      method: "POST",
      url: "/tenants",
      headers: {
        cookie: sessionCookie
      },
      payload: {
        name: "Piece Studio",
        slug: "piece-studio",
        bio: "testing",
        contactEmail: "pieces@example.com",
        adminPassword: "adminpass",
        socialLinks: {},
        theme: {
          layout: "grid"
        }
      }
    });

    expect(tenantCreate.statusCode).toBe(201);
    const tenantId: string = tenantCreate.json().tenant.id;

    for (let index = 1; index <= 3; index += 1) {
      const created = await app.inject({
        method: "POST",
        url: `/tenants/${tenantId}/pieces`,
        headers: {
          cookie: sessionCookie
        },
        payload: {
          title: `Piece ${index}`,
          slug: `piece-${index}`,
          description: "desc",
          year: 2025,
          category: "Painting",
          images: [`https://example.com/piece-${index}.jpg`]
        }
      });

      expect(created.statusCode).toBe(201);
    }

    const blocked = await app.inject({
      method: "POST",
      url: `/tenants/${tenantId}/pieces`,
      headers: {
        cookie: sessionCookie
      },
      payload: {
        title: "Piece 4",
        slug: "piece-4",
        description: "desc",
        year: 2025,
        category: "Painting",
        images: ["https://example.com/piece-4.jpg"]
      }
    });

    expect(blocked.statusCode).toBe(403);
  });
});

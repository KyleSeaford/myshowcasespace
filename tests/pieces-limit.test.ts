import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeTestApp, createTestApp, extractSessionCookie } from "./setup.js";
import { PLAN_IDS } from "../src/lib/plans.js";

describe("piece limits", () => {
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

  async function createTenant(sessionCookie: string, slug: string, email: string) {
    expect(app).toBeDefined();
    const tenantCreate = await app!.inject({
      method: "POST",
      url: "/tenants",
      headers: {
        cookie: sessionCookie
      },
      payload: {
        name: "Piece Studio",
        slug,
        bio: "testing",
        contactEmail: email,
        adminPassword: "adminpass",
        socialLinks: {},
        theme: {
          layout: "grid"
        }
      }
    });

    expect(tenantCreate.statusCode).toBe(201);
    return tenantCreate.json().tenant.id as string;
  }

  type PaidPlanId = typeof PLAN_IDS.personal | typeof PLAN_IDS.studio;

  function isPaidPlanId(planId: string): planId is PaidPlanId {
    return planId === PLAN_IDS.personal || planId === PLAN_IDS.studio;
  }

  async function upgradeTenant(tenantId: string, sessionCookie: string, targetPlanId: PaidPlanId) {
    expect(app).toBeDefined();
    const checkout = await app!.inject({
      method: "POST",
      url: `/tenants/${tenantId}/billing/checkout-sessions`,
      headers: {
        cookie: sessionCookie
      },
      payload: {
        targetPlanId,
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
    expect(complete.json().tenant.planId).toBe(targetPlanId);
  }

  function piecePayload(index: number) {
    return {
      title: `Piece ${index}`,
      slug: `piece-${index}`,
      description: "desc",
      year: 2025,
      category: "Painting",
      images: [`https://example.com/piece-${index}.jpg`]
    };
  }

  it.each([
    { label: "Starter Free", planId: PLAN_IDS.starterFree, limit: 3 },
    { label: "Personal", planId: PLAN_IDS.personal, limit: 50 },
    { label: "Studio", planId: PLAN_IDS.studio, limit: 200 }
  ])("enforces the $label plan limit of $limit pieces", async ({ planId, limit }) => {
    const email = `pieces-${planId}@example.com`;

    expect(app).toBeDefined();
    expect(prisma).toBeDefined();

    const signup = await app!.inject({
      method: "POST",
      url: "/auth/signup",
      payload: {
        email,
        password: "StrongPass123!",
        acceptedLegal: true
      }
    });

    const sessionCookie = extractSessionCookie(signup.headers["set-cookie"]);

    const tenantId = await createTenant(sessionCookie, `piece-${planId}`, email);

    if (isPaidPlanId(planId)) {
      await upgradeTenant(tenantId, sessionCookie, planId);
    }

    if (limit > 1) {
      await prisma!.piece.createMany({
        data: Array.from({ length: limit - 1 }, (_, index) => ({
          tenantId,
          ...piecePayload(index + 1),
          images: JSON.stringify([`https://example.com/piece-${index + 1}.jpg`])
        }))
      });
    }

    const allowed = await app!.inject({
      method: "POST",
      url: `/tenants/${tenantId}/pieces`,
      headers: {
        cookie: sessionCookie
      },
      payload: piecePayload(limit)
    });

    expect(allowed.statusCode).toBe(201);

    const blocked = await app!.inject({
      method: "POST",
      url: `/tenants/${tenantId}/pieces`,
      headers: {
        cookie: sessionCookie
      },
      payload: piecePayload(limit + 1)
    });

    expect(blocked.statusCode).toBe(403);
  }, 120_000);
});

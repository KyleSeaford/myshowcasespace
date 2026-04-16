import { BillingStatus, DomainType, type PrismaClient } from "@prisma/client";
import { CheckoutStatus } from "@prisma/client";
import type Stripe from "stripe";
import { env } from "../config/env.js";
import { ensurePlanCatalog, PLAN_IDS } from "./plans.js";

export const STRIPE_PRICE_BY_PLAN_ID = {
  [PLAN_IDS.personal]: env.STRIPE_PERSONAL_PRICE_ID,
  [PLAN_IDS.studio]: env.STRIPE_STUDIO_PRICE_ID
} as const;

export function stripePriceIdForPlan(planId: string): string | null {
  if (planId === PLAN_IDS.personal || planId === PLAN_IDS.studio) {
    return STRIPE_PRICE_BY_PLAN_ID[planId];
  }

  return null;
}

export function planIdForStripePrice(priceId: string | undefined | null): string | null {
  if (!priceId) {
    return null;
  }

  for (const [planId, configuredPriceId] of Object.entries(STRIPE_PRICE_BY_PLAN_ID)) {
    if (configuredPriceId === priceId) {
      return planId;
    }
  }

  return null;
}

export function billingStatusForStripeSubscription(status: Stripe.Subscription.Status): BillingStatus {
  if (status === "active" || status === "trialing") {
    return BillingStatus.ACTIVE;
  }

  if (status === "canceled") {
    return BillingStatus.CANCELED;
  }

  return BillingStatus.PAST_DUE;
}

function withPublicPort(url: string): string {
  if (!env.PLATFORM_PUBLIC_PORT) {
    return url;
  }

  return `${url}:${env.PLATFORM_PUBLIC_PORT}`;
}

export function buildTenantSubdomainUrl(slug: string): string {
  return withPublicPort(`${env.PLATFORM_PROTOCOL}://${slug}.${env.PLATFORM_DOMAIN}`);
}

function getSubscriptionCustomerId(subscription: Stripe.Subscription): string | null {
  return typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null;
}

function getSubscriptionCurrentPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const itemPeriodEnd = subscription.items.data[0]?.current_period_end;
  if (typeof itemPeriodEnd === "number") {
    return new Date(itemPeriodEnd * 1000);
  }

  const legacyPeriodEnd = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;
  return typeof legacyPeriodEnd === "number" ? new Date(legacyPeriodEnd * 1000) : null;
}

async function resetFreeOnlyBenefits(prisma: PrismaClient, tenantId: string, slug: string): Promise<void> {
  await prisma.$transaction([
    prisma.tenant.update({
      where: {
        id: tenantId
      },
      data: {
        themeId: "default",
        themeLocked: false,
        publishedUrl: buildTenantSubdomainUrl(slug)
      }
    }),
    prisma.domain.updateMany({
      where: {
        tenantId,
        type: DomainType.CUSTOM
      },
      data: {
        isPrimary: false
      }
    }),
    prisma.domain.updateMany({
      where: {
        tenantId,
        type: DomainType.SUBDOMAIN
      },
      data: {
        isPrimary: true
      }
    })
  ]);
}

export async function applyTenantPlanChange(
  prisma: PrismaClient,
  tenantId: string,
  planId: string
): Promise<void> {
  await ensurePlanCatalog(prisma);

  const tenant = await prisma.tenant.findUnique({
    where: {
      id: tenantId
    },
    select: {
      id: true,
      slug: true
    }
  });

  if (!tenant) {
    return;
  }

  await prisma.tenant.update({
    where: {
      id: tenant.id
    },
    data: {
      planId
    }
  });

  if (planId === PLAN_IDS.starterFree) {
    await resetFreeOnlyBenefits(prisma, tenant.id, tenant.slug);
  }
}

export async function applyStripeSubscriptionState(
  prisma: PrismaClient,
  subscription: Stripe.Subscription
): Promise<void> {
  const tenantIdFromMetadata = subscription.metadata.tenantId;
  const subscriptionId = subscription.id;
  const firstPriceId = subscription.items.data[0]?.price.id;
  const planIdFromPrice = planIdForStripePrice(firstPriceId);
  const billingAccount = tenantIdFromMetadata
    ? null
    : await prisma.billingAccount.findFirst({
        where: {
          stripeSubscriptionId: subscriptionId
        },
        select: {
          tenantId: true
        }
      });
  const tenantId = tenantIdFromMetadata || billingAccount?.tenantId;

  if (!tenantId) {
    return;
  }

  const billingStatus = billingStatusForStripeSubscription(subscription.status);
  const nextPlanId =
    billingStatus === BillingStatus.CANCELED || !planIdFromPrice ? PLAN_IDS.starterFree : planIdFromPrice;
  const customerId = getSubscriptionCustomerId(subscription);

  await prisma.$transaction(async (tx) => {
    await tx.billingAccount.upsert({
      where: {
        tenantId
      },
      create: {
        tenantId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status: billingStatus,
        currentPeriodEnd: getSubscriptionCurrentPeriodEnd(subscription)
      },
      update: {
        stripeCustomerId: customerId ?? undefined,
        stripeSubscriptionId: subscriptionId,
        status: billingStatus,
        currentPeriodEnd: getSubscriptionCurrentPeriodEnd(subscription)
      }
    });
  });

  await applyTenantPlanChange(prisma, tenantId, nextPlanId);
}

function getCheckoutSubscriptionId(session: Stripe.Checkout.Session): string | null {
  return typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
}

function getCheckoutCustomerId(session: Stripe.Checkout.Session): string | null {
  return typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
}

export async function applyStripeCheckoutSession(
  prisma: PrismaClient,
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<{ tenantId: string | null; applied: boolean }> {
  if (session.status !== "complete") {
    return { tenantId: session.metadata?.tenantId ?? session.client_reference_id ?? null, applied: false };
  }

  const checkoutSessionRecord = await prisma.billingCheckoutSession.findFirst({
    where: {
      OR: [
        ...(session.metadata?.checkoutSessionId ? [{ id: session.metadata.checkoutSessionId }] : []),
        { providerRef: session.id }
      ]
    },
    select: {
      id: true,
      tenantId: true,
      targetPlanId: true
    }
  });

  const tenantId = session.metadata?.tenantId ?? session.client_reference_id ?? checkoutSessionRecord?.tenantId ?? null;
  const targetPlanId = session.metadata?.targetPlanId ?? checkoutSessionRecord?.targetPlanId ?? null;
  const stripeSubscriptionId = getCheckoutSubscriptionId(session);
  const stripeCustomerId = getCheckoutCustomerId(session);

  if (checkoutSessionRecord) {
    await prisma.billingCheckoutSession.update({
      where: {
        id: checkoutSessionRecord.id
      },
      data: {
        status: CheckoutStatus.COMPLETED,
        completedAt: new Date()
      }
    });
  }

  if (tenantId && stripeSubscriptionId) {
    await prisma.billingAccount.upsert({
      where: {
        tenantId
      },
      create: {
        tenantId,
        stripeCustomerId,
        stripeSubscriptionId,
        status: BillingStatus.ACTIVE
      },
      update: {
        stripeCustomerId: stripeCustomerId ?? undefined,
        stripeSubscriptionId,
        status: BillingStatus.ACTIVE
      }
    });

    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    await applyStripeSubscriptionState(prisma, subscription);
    return { tenantId, applied: true };
  }

  if (tenantId && targetPlanId) {
    await applyTenantPlanChange(prisma, tenantId, targetPlanId);
    return { tenantId, applied: true };
  }

  return { tenantId, applied: false };
}

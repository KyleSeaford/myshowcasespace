import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import type Stripe from "stripe";
import { z } from "zod";
import { env } from "../config/env.js";
import { applyStripeCheckoutSession, applyStripeSubscriptionState } from "../lib/billing.js";
import { getStripeClient } from "../lib/stripe.js";

const webhookBodySchema = z.string().min(1);

async function handleCheckoutCompleted(app: FastifyInstance, session: Stripe.Checkout.Session) {
  const stripe = getStripeClient();
  if (stripe) {
    await applyStripeCheckoutSession(app.prisma, stripe, session);
  }
}

export const billingRoutes: FastifyPluginAsync = async (app) => {
  app.addContentTypeParser("application/json", { parseAs: "string" }, (_request, body, done) => {
    done(null, body);
  });

  app.post("/billing/stripe/webhook", async (request, reply) => {
    const stripe = getStripeClient();
    if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
      return reply.status(503).send({ error: "Stripe webhook is not configured" });
    }

    const parse = webhookBodySchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid webhook payload" });
    }

    const signature = request.headers["stripe-signature"];
    const stripeSignature = Array.isArray(signature) ? signature[0] : signature;
    if (!stripeSignature) {
      return reply.status(400).send({ error: "Missing Stripe signature" });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(parse.data, stripeSignature, env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
      request.log.warn({ err: error }, "Invalid Stripe webhook signature");
      return reply.status(400).send({ error: "Invalid Stripe signature" });
    }

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(app, event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await applyStripeSubscriptionState(app.prisma, event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceWithSubscription = invoice as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        const subscriptionId =
          typeof invoiceWithSubscription.subscription === "string"
            ? invoiceWithSubscription.subscription
            : invoiceWithSubscription.subscription?.id;
        if (subscriptionId) {
          await app.prisma.billingAccount.updateMany({
            where: {
              stripeSubscriptionId: subscriptionId
            },
            data: {
              status: "PAST_DUE"
            }
          });
        }
        break;
      }
      default:
        break;
    }

    return reply.send({ received: true });
  });
};

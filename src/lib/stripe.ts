import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient: Stripe | null | undefined;

export function getStripeClient(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) {
    return null;
  }

  if (stripeClient === undefined) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
      typescript: true,
      maxNetworkRetries: 2
    });
  }

  return stripeClient;
}

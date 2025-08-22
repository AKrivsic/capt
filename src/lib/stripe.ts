import "server-only";
import Stripe from "stripe";

let stripeClient: Stripe | null = null;
export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  stripeClient = new Stripe(key, { apiVersion: "2024-06-20" });
  return stripeClient;
}

export function requiredEnv(name: string, val: string | undefined | null): string {
  if (!val) throw new Error(`Missing env ${name}`);
  return val;
}



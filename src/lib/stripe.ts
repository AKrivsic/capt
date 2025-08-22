import "server-only";
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

export const stripe = new Stripe(key, {
  apiVersion: "2024-06-20",
});

export function requiredEnv(name: string, val: string | undefined | null): string {
  if (!val) throw new Error(`Missing env ${name}`);
  return val;
}



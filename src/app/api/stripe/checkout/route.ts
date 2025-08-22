export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { stripe, requiredEnv } from "@/lib/stripe";
import type Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Plan = "STARTER" | "PRO" | "PREMIUM";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const plan: Plan = body?.plan;
    if (!plan || !["STARTER", "PRO", "PREMIUM"].includes(plan)) {
      return NextResponse.json({ ok: false, error: "BAD_PLAN" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;
    if (!email) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

    const successUrl = process.env.STRIPE_SUCCESS_URL || "https://captioni.com/dashboard?plan=success";
    const cancelUrl = process.env.STRIPE_CANCEL_URL || "https://captioni.com/pricing?cancel=1";

    const priceId = {
      STARTER: requiredEnv("PRICE_STARTER", process.env.PRICE_STARTER),
      PRO: requiredEnv("PRICE_PRO", process.env.PRICE_PRO),
      PREMIUM: requiredEnv("PRICE_PREMIUM", process.env.PRICE_PREMIUM),
    }[plan];

    // PRO and PREMIUM are recurring subscriptions; STARTER is one-time
    const mode: "payment" | "subscription" = plan === "STARTER" ? "payment" : "subscription";

    const params: Stripe.Checkout.SessionCreateParams = {
      mode,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      automatic_tax: { enabled: true },
      allow_promotion_codes: true,
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      customer_creation: "always",
      customer_update: { address: "auto", name: "auto" },
      metadata: { plan },
      ...(mode === "subscription"
        ? { subscription_data: { metadata: { plan } } }
        : { invoice_creation: { enabled: true, invoice_data: { metadata: { plan } } } }),
    };

    const s = await stripe.checkout.sessions.create(params);

    return NextResponse.json({ ok: true, id: s.id, url: s.url }, { status: 200 });
  } catch (e) {
    console.error("[stripe/checkout]", e);
    return NextResponse.json({ ok: false, error: "INTERNAL" }, { status: 500 });
  }
}



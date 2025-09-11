export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { STRIPE_SUBSCRIPTION_PRICE_IDS, STRIPE_ONE_TIME_PRICE_IDS, EXTRA_CREDITS } from "@/constants/plans";
import { Plan } from "@prisma/client";

// Types for validation
// type SubscriptionPlan = "TEXT_STARTER" | "TEXT_PRO" | "VIDEO_LITE" | "VIDEO_PRO" | "VIDEO_UNLIMITED";
// type ExtraCreditsSku = "EXTRA_10_VIDEOS" | "EXTRA_25_VIDEOS" | "EXTRA_50_VIDEOS";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { plan, sku } = body;
    
    // Validace - buď plán nebo SKU pro extra kredity
    if (!plan && !sku) {
      return NextResponse.json({ 
        ok: false, 
        error: "BAD_REQUEST", 
        message: "You must specify either a plan or SKU" 
      }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;
    if (!email) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

    const successUrl = process.env.STRIPE_SUCCESS_URL || "https://captioni.com/dashboard?plan=success";
    const cancelUrl = process.env.STRIPE_CANCEL_URL || "https://captioni.com/pricing?cancel=1";

    let priceId: string;
    let mode: "payment" | "subscription";
    let metadata: Record<string, string>;

    if (plan) {
      // Subscription plán
      if (!["TEXT_STARTER", "TEXT_PRO", "VIDEO_LITE", "VIDEO_PRO", "VIDEO_UNLIMITED"].includes(plan)) {
        return NextResponse.json({ ok: false, error: "BAD_PLAN" }, { status: 400 });
      }

      const planPriceId = STRIPE_SUBSCRIPTION_PRICE_IDS[plan as Plan];
      if (!planPriceId) {
        return NextResponse.json({ 
          ok: false, 
          error: "PRICE_NOT_FOUND", 
          message: "Price for this plan was not found" 
        }, { status: 400 });
      }
      priceId = planPriceId;

      // Všechny nové plány jsou subscriptions
      mode = "subscription";
      metadata = { plan, type: "subscription" };
    } else if (sku) {
      // Extra kredity - jednorázová platba
      if (!["EXTRA_10_VIDEOS", "EXTRA_25_VIDEOS", "EXTRA_50_VIDEOS"].includes(sku)) {
        return NextResponse.json({ ok: false, error: "BAD_SKU" }, { status: 400 });
      }

      const skuPriceId = STRIPE_ONE_TIME_PRICE_IDS[sku];
      if (!skuPriceId) {
        return NextResponse.json({ 
          ok: false, 
          error: "PRICE_NOT_FOUND", 
          message: "Price for these credits was not found" 
        }, { status: 400 });
      }
      priceId = skuPriceId;

      mode = "payment";
      const extraCreditsInfo = EXTRA_CREDITS.find(ec => ec.sku === sku);
      metadata = { 
        sku, 
        type: "extra_credits",
        credits: extraCreditsInfo?.credits.toString() || "0"
      };
    } else {
      return NextResponse.json({ ok: false, error: "INVALID_REQUEST" }, { status: 400 });
    }

    const paramsBase: Omit<Stripe.Checkout.SessionCreateParams,
      "subscription_data" | "invoice_creation" | "customer_creation"
    > = {
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
      metadata,
    };

    const params: Stripe.Checkout.SessionCreateParams =
      mode === "subscription"
        ? {
            ...paramsBase,
            subscription_data: { metadata },
          }
        : {
            ...paramsBase,
            customer_creation: "always",
            invoice_creation: { enabled: true, invoice_data: { metadata } },
          };

    const s = await getStripe().checkout.sessions.create(params);

    return NextResponse.json({ ok: true, id: s.id, url: s.url }, { status: 200 });
  } catch (e) {
    console.error("[stripe/checkout]", e);
    return NextResponse.json({ ok: false, error: "INTERNAL" }, { status: 500 });
  }
}
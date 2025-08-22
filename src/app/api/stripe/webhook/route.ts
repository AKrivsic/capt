export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { mlSetPlanGroup } from "@/lib/mailerlite";

function planFromMeta(p?: string | null): "FREE" | "STARTER" | "PRO" | "PREMIUM" | null {
  if (!p) return null;
  if (p === "STARTER" || p === "PRO" || p === "PREMIUM") return p;
  return null;
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !whSecret) return NextResponse.json({ ok: false }, { status: 400 });

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, whSecret);
  } catch (err) {
    console.error("[stripe/webhook] signature error", err);
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const customerEmail = s.customer_details?.email || s.customer_email || null;
        const md = (s.metadata || {}) as Record<string, string>;
        const metaPlan = planFromMeta(md.plan);
        if (!customerEmail || !metaPlan) break;

        // set plan in DB (simplified: map PRO subscription, others payment)
        const user = await prisma.user.findFirst({ where: { email: { equals: customerEmail as string, mode: "insensitive" } } });
        if (user) {
          await prisma.user.update({ where: { id: user.id }, data: { plan: metaPlan } });
          try {
            const slug = metaPlan === "STARTER" ? "starter" : metaPlan === "PRO" ? "pro" : "premium";
            await mlSetPlanGroup(customerEmail, slug);
          } catch (e) {
            console.error("[ML set plan]", e);
          }
        }
        break;
      }
      case "invoice.paid": {
        // successful payment for subscription or invoice; keep plan as-is
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = (sub.customer as string) ?? undefined;
        if (!customerId) break;
        const customer = await stripe.customers.retrieve(customerId).catch(() => null);
        const email = (customer && "email" in customer ? (customer as Stripe.Customer).email : null) || undefined;
        if (!email) break;
        // Determine status and keep plan PRO when active, else downgrade FREE
        const status: Stripe.Subscription.Status | undefined = sub?.status;
        const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
        if (!user) break;
        if (status && ["active", "trialing", "past_due"].includes(status)) {
          await prisma.user.update({ where: { id: user.id }, data: { plan: "PRO" } });
          try { await mlSetPlanGroup(email, "pro"); } catch {}
        } else {
          await prisma.user.update({ where: { id: user.id }, data: { plan: "FREE" } });
          try { await mlSetPlanGroup(email, "free"); } catch {}
        }
        break;
      }
      case "customer.subscription.deleted": {
        // downgrade to FREE
        const sub = event.data.object as Stripe.Subscription;
        const customerId = (sub.customer as string) ?? undefined;
        if (!customerId) break;
        const customer = await stripe.customers.retrieve(customerId).catch(() => null);
        const email = (customer && "email" in customer ? (customer as Stripe.Customer).email : null) || undefined;
        if (!email) break;
        const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
        if (user) {
          await prisma.user.update({ where: { id: user.id }, data: { plan: "FREE" } });
          try {
            await mlSetPlanGroup(email, "free");
          } catch (e) {
            console.error("[ML downgrade free]", e);
          }
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("[stripe/webhook] handler error", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}



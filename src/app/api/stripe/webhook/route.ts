export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
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
    event = getStripe().webhooks.constructEvent(rawBody, sig, whSecret);
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

        // set plan in DB
        const user = await prisma.user.findFirst({ where: { email: { equals: customerEmail as string, mode: "insensitive" } } });
        if (user) {
          await prisma.user.update({ where: { id: user.id }, data: { plan: metaPlan } });
          try {
            const slug = metaPlan === "STARTER" ? "starter" : metaPlan === "PRO" ? "pro" : "premium";
            await mlSetPlanGroup(customerEmail, slug);
          } catch (e) {
            console.error("[ML set plan]", e);
          }
          
          // Reset usage při změně plánu
          try {
            await fetch(`${process.env.NEXTAUTH_URL}/api/user/reset-usage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            });
          } catch (e) {
            console.error("[reset usage]", e);
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
        const customer = await getStripe().customers.retrieve(customerId).catch(() => null);
        const email = (customer && "email" in customer ? (customer as Stripe.Customer).email : null) || undefined;
        if (!email) break;
        
        // Determine status and plan
        const status: Stripe.Subscription.Status | undefined = sub?.status;
        const cancelAtPeriodEnd = sub?.cancel_at_period_end;
        const metaPlan = planFromMeta(sub.metadata?.plan);
        const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
        if (!user) break;
        
        if (status && ["active", "trialing", "past_due"].includes(status)) {
          // Pokud se předplatné ruší, ale je stále aktivní, ponech aktuální plán
          // Plán se změní na FREE až když předplatné skutečně skončí
          if (!cancelAtPeriodEnd && metaPlan) {
            await prisma.user.update({ where: { id: user.id }, data: { plan: metaPlan } });
            try { 
              const slug = metaPlan === "STARTER" ? "starter" : metaPlan === "PRO" ? "pro" : "premium";
              await mlSetPlanGroup(email, slug); 
            } catch {}
          }
        } else {
          await prisma.user.update({ where: { id: user.id }, data: { plan: "FREE" } });
          try { await mlSetPlanGroup(email, "free"); } catch {}
        }
        
        // Reset usage při změně plánu
        try {
          await fetch(`${process.env.NEXTAUTH_URL}/api/user/reset-usage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.error("[reset usage]", e);
        }
        break;
      }
      case "customer.subscription.deleted": {
        // downgrade to FREE
        const sub = event.data.object as Stripe.Subscription;
        const customerId = (sub.customer as string) ?? undefined;
        if (!customerId) break;
        const customer = await getStripe().customers.retrieve(customerId).catch(() => null);
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
          
          // Reset usage při změně plánu
          try {
            await fetch(`${process.env.NEXTAUTH_URL}/api/user/reset-usage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            });
          } catch (e) {
            console.error("[reset usage]", e);
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



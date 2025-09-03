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

async function downgradeUserToFree(email: string, reason: string) {
  try {
    const user = await prisma.user.findFirst({ 
      where: { email: { equals: email, mode: "insensitive" } } 
    });
    
    if (user && user.plan !== "FREE") {
      console.log(`[stripe/webhook] Downgrading user ${email} to FREE: ${reason}`);
      await prisma.user.update({ 
        where: { id: user.id }, 
        data: { plan: "FREE" } 
      });
      
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
  } catch (e) {
    console.error(`[stripe/webhook] Error downgrading user ${email}:`, e);
  }
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

  // ✅ IDEMPOTENCE: Kontrola, zda už event zpracováváme
  try {
    await prisma.webhookEvent.create({
      data: {
        source: "stripe",
        eventId: event.id,
        processed: false,
      },
    });
  } catch (error: unknown) {
    // Duplicitní event - ignorujeme
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === "P2002") {
      console.log("[stripe/webhook] Duplicate event ignored:", event.id);
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw error;
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
        // ✅ Platba úspěšná - plán zůstává
        console.log("[stripe/webhook] Invoice paid successfully:", event.id);
        break;
      }
      
      case "invoice.payment_failed": {
        // ❌ Platba selhala - downgrade na FREE
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        try {
          const customer = await getStripe().customers.retrieve(customerId);
          if (customer && "email" in customer && customer.email) {
            await downgradeUserToFree(customer.email, "payment_failed");
          }
        } catch (e) {
          console.error("[stripe/webhook] Error retrieving customer for failed payment:", e);
        }
        break;
      }
      
      case "invoice.payment_action_required": {
        // ⚠️ Platba vyžaduje akci - downgrade na FREE
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        try {
          const customer = await getStripe().customers.retrieve(customerId);
          if (customer && "email" in customer && customer.email) {
            await downgradeUserToFree(customer.email, "payment_action_required");
          }
        } catch (e) {
          console.error("[stripe/webhook] Error retrieving customer for action required:", e);
        }
        break;
      }
      
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = (sub.customer as string) ?? undefined;
        if (!customerId) break;
        
        try {
          const customer = await getStripe().customers.retrieve(customerId);
          const email = (customer && "email" in customer ? (customer as Stripe.Customer).email : null) || undefined;
          if (!email) break;
          
          // Determine status and plan
          const status: Stripe.Subscription.Status | undefined = sub?.status;
          const cancelAtPeriodEnd = sub?.cancel_at_period_end;
          const metaPlan = planFromMeta(sub.metadata?.plan);
          const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
          if (!user) break;
          
          if (status === "active" || status === "trialing") {
            // ✅ Aktivní nebo trial - ponech plán
            if (!cancelAtPeriodEnd && metaPlan) {
              await prisma.user.update({ where: { id: user.id }, data: { plan: metaPlan } });
              try { 
                const slug = metaPlan === "STARTER" ? "starter" : metaPlan === "PRO" ? "pro" : "premium";
                await mlSetPlanGroup(email, slug); 
              } catch (e) {
                console.error("[ML set plan]", e);
              }
            }
          } else if (status === "past_due") {
            // ⚠️ Past due - downgrade na FREE
            await downgradeUserToFree(email, "subscription_past_due");
          } else {
            // ❌ Jiný status - downgrade na FREE
            await downgradeUserToFree(email, `subscription_status_${status}`);
          }
        } catch (e) {
          console.error("[stripe/webhook] Error in subscription.updated:", e);
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        // ❌ Předplatné smazáno - downgrade na FREE
        const sub = event.data.object as Stripe.Subscription;
        const customerId = (sub.customer as string) ?? undefined;
        if (!customerId) break;
        
        try {
          const customer = await getStripe().customers.retrieve(customerId);
          const email = (customer && "email" in customer ? (customer as Stripe.Customer).email : null) || undefined;
          if (!email) break;
          
          await downgradeUserToFree(email, "subscription_deleted");
        } catch (e) {
          console.error("[stripe/webhook] Error in subscription.deleted:", e);
        }
        break;
      }
      
      default:
        console.log("[stripe/webhook] Unhandled event type:", event.type);
        break;
    }
  } catch (e) {
    console.error("[stripe/webhook] handler error", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}



export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const stripe = getStripe();
    
    // Najdi customer podle emailu
    const customers = await stripe.customers.list({
      email: session.user.email,
      limit: 1
    });

    if (customers.data.length === 0) {
      return NextResponse.json({ ok: false, error: "NO_CUSTOMER" }, { status: 404 });
    }

    const customer = customers.data[0];

    // Najdi aktivní předplatné
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ ok: false, error: "NO_SUBSCRIPTION" }, { status: 404 });
    }

    const subscription = subscriptions.data[0];

    // Zruš předplatné na konci období
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[billing/cancel] error:", error);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

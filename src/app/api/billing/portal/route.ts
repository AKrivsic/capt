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

    // Vytvoř customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard/billing`,
    });

    return NextResponse.json({ ok: true, url: portalSession.url });
  } catch (error) {
    console.error("[billing/portal] error:", error);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// src/app/dashboard/billing/page.tsx
import { getSessionServer } from "@/lib/session";
import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import BillingClient from "./BillingClient";
import type Stripe from "stripe";

export default async function BillingPage() {
  const session = await getSessionServer();
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/dashboard/billing");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, plan: true, createdAt: true }
  });

  if (!user || !user.email) redirect("/api/auth/signin?callbackUrl=/dashboard/billing");

  // Získej Stripe customer data
  let customer: Stripe.Customer | null = null;
  let subscription: Stripe.Subscription | null = null;
  let invoices: Stripe.Invoice[] = [];

  try {
    const stripe = getStripe();
    
    // Najdi customer podle emailu
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    if (customers.data.length > 0) {
      customer = customers.data[0];
      
      // Najdi aktivní předplatné
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 1
      });

      if (subscriptions.data.length > 0) {
        subscription = subscriptions.data[0];
      }

      // Získej poslední faktury
      const invoiceList = await stripe.invoices.list({
        customer: customer.id,
        limit: 5
      });
      invoices = invoiceList.data;
    }
  } catch (error) {
    console.error("Error fetching Stripe data:", error);
  }

  return (
    <BillingClient 
      user={user}
      customer={customer}
      subscription={subscription}
      invoices={invoices}
    />
  );
}

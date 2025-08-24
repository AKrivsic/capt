"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trackUpgradeClick } from "@/utils/tracking";
import type Stripe from "stripe";

type User = {
  id: string;
  email: string | null;
  plan: string;
  createdAt: Date;
};

interface BillingClientProps {
  user: User;
  customer: Stripe.Customer | null;
  subscription: Stripe.Subscription | null;
  invoices: Stripe.Invoice[];
}

export default function BillingClient({ user, customer, subscription, invoices }: BillingClientProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const formatAmount = (amount: number | null, currency: string | null) => {
    if (amount === null || currency === null) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You&apos;ll lose access to premium features at the end of your current billing period.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to cancel subscription. Please try again.");
      }
    } catch {
      alert("Error canceling subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to resume subscription. Please try again.");
      }
    } catch {
      alert("Error resuming subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerPortal = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to open customer portal. Please try again.");
      }
    } catch {
      alert("Error opening customer portal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isSubscriptionActive = subscription && subscription.status === 'active';
  const isCanceling = subscription?.cancel_at_period_end;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Plan & Billing</h1>
        {!isSubscriptionActive && (
          <Link
            href="/#pricing"
            className="btn"
            onClick={() => trackUpgradeClick("billing")}
          >
            Upgrade plan
          </Link>
        )}
      </div>

      {/* Current Plan */}
      <div className="rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{user.plan}</p>
            {subscription && (
              <p className="text-sm text-gray-600">
                {isCanceling 
                  ? `Cancels on ${formatDate(subscription.current_period_end)}`
                  : `Next billing: ${formatDate(subscription.current_period_end)}`
                }
              </p>
            )}
          </div>
          <div className="space-y-2">
            {isSubscriptionActive && !isCanceling && (
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="btn btn-outline btn-sm"
              >
                {loading ? "Canceling..." : "Cancel Subscription"}
              </button>
            )}
            {isCanceling && (
              <button
                onClick={handleResumeSubscription}
                disabled={loading}
                className="btn btn-primary btn-sm"
              >
                {loading ? "Resuming..." : "Resume Subscription"}
              </button>
            )}
            {customer && (
              <button
                onClick={handleCustomerPortal}
                disabled={loading}
                className="btn btn-outline btn-sm"
              >
                {loading ? "Opening..." : "Manage Billing"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Invoices</h2>
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{formatDate(invoice.created)}</p>
                  <p className="text-sm text-gray-600">
                    {formatAmount(invoice.amount_paid, invoice.currency)} • {invoice.status || "unknown"}
                  </p>
                </div>
                <div className="space-x-2">
                  {invoice.hosted_invoice_url && (
                    <a
                      href={invoice.hosted_invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline"
                    >
                      View
                    </a>
                  )}
                  {invoice.invoice_pdf && (
                    <a
                      href={invoice.invoice_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline"
                    >
                      PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help */}
      <div className="rounded-xl border p-6 bg-gray-50">
        <h2 className="text-lg font-semibold mb-4">Need Help?</h2>
        <p className="text-gray-600 mb-4">
          For billing questions or to update your payment method, you can:
        </p>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Use the &quot;Manage Billing&quot; button above to access your Stripe customer portal</li>
          <li>• Contact our support team at support@captioni.com</li>
          <li>• Cancel anytime - you&apos;ll keep access until the end of your billing period</li>
        </ul>
      </div>
    </div>
  );
}

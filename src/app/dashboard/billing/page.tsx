// src/app/dashboard/billing/page.tsx
import { getSessionServer } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function BillingPage() {
  const session = await getSessionServer();
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/dashboard/billing");

  // MVP: dummy invoices/links – později napojíme na Stripe
  const invoices = [
    { id: "inv_001", date: "2025-08-01", amount: "$9.00", url: "#" },
    { id: "inv_000", date: "2025-07-01", amount: "$0.00", url: "#" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Plan & Billing</h1>
        <a href="#pricing" className="btn">Upgrade plan</a>
      </div>

      <div className="rounded-xl border p-4">
        <h2 className="font-medium mb-3">Invoices</h2>
        <ul className="space-y-2">
          {invoices.map(inv => (
            <li key={inv.id} className="flex items-center justify-between rounded-md border px-3 py-2">
              <span>{inv.date}</span>
              <span className="opacity-70">{inv.amount}</span>
              <a className="link" href={inv.url} target="_blank">View</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// src/app/dashboard/support/page.tsx
import { getSessionServer } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SupportPage() {
  const session = await getSessionServer();
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/dashboard/support");

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Support</h1>
      <p className="text-sm text-gray-600">
        Need help? Reach us at <a className="link" href="mailto:support@captioni.ai">support@captioni.ai</a>
      </p>
      <ul className="list-disc pl-5 text-sm">
        <li><a className="link" href="#faq">FAQ</a></li>
        <li>Status page (soon)</li>
        <li>Priority support for Pro/Premium</li>
      </ul>
    </div>
  );
}

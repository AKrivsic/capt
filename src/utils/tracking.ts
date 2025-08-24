"use client";

// --- Doménové typy ---
export type Plan = "FREE" | "STARTER" | "PRO" | "PREMIUM";
export type Source =
  | "homepage"
  | "blog"
  | "footer"
  | "faq"
  | "generator"
  | "pricing"
  | "dashboard"
  | "billing"
  | "goToGenerator"
  | "demoModal"
  | "header"
  | "other";

type EventName =
  | "Demo click"
  | "Pricing click"
  | "Signup start"
  | "Signup complete"
  | "Generator access"
  | "Generation complete"
  | "Checkout start"
  | "Purchase success"
  | "Upgrade click"
  | "Modal close"
  | "Logout click";

type TrackProps = Record<string, string | number | boolean | null | undefined>;
type PlausibleOptions = { props?: TrackProps; revenue?: number };
type PlausibleQueueItem = [EventName, PlausibleOptions?];

// --- Správná definice callable typu s vlastností `q` (na funkci, ne na returnu) ---
type PlausibleFn = {
  (eventName: EventName, options?: PlausibleOptions): void;
  q?: PlausibleQueueItem[];
};

// --- Globální augmentace window ---
declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}

// Disable switch (např. pro e2e/test)
const DISABLED =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_PLAUSIBLE_DISABLED === "1";

// Inicializace stubu, pokud Plausible skript ještě není načtený
function ensurePlausibleStub(): void {
  if (typeof window === "undefined") return;
  if (typeof window.plausible === "function") return;

  const queue: PlausibleQueueItem[] = [];
  const stub = ((eventName: EventName, options?: PlausibleOptions) => {
    queue.push([eventName, options]);
  }) as PlausibleFn;

  stub.q = queue;
  window.plausible = stub;
}

// Bezpečné volání i když skript ještě není načtený
function callPlausible(name: EventName, options?: PlausibleOptions): void {
  if (typeof window === "undefined" || DISABLED) return;
  ensurePlausibleStub();
  try {
    window.plausible?.(name, options);
  } catch {
    // nikdy neshazovat UI kvůli trackingu
  }
}

function trackCore(name: EventName, options?: PlausibleOptions): void {
  callPlausible(name, options);
}

/* ===== Konkrétní akce ===== */

// Awareness
export function trackDemoClick(source: Source): void {
  trackCore("Demo click", { props: { source } });
}
export function trackPricingClick(source: Source): void {
  trackCore("Pricing click", { props: { source } });
}

// Consideration
export function trackSignupStart(source: Source): void {
  trackCore("Signup start", { props: { source } });
}
export function trackSignupComplete(): void {
  trackCore("Signup complete");
}

// Activation
export function trackGeneratorAccess(source: Source): void {
  trackCore("Generator access", { props: { source } });
}
export function trackGenerationComplete(plan: Plan): void {
  trackCore("Generation complete", { props: { plan } });
}

// Monetization
export function trackCheckoutStart(plan: Exclude<Plan, "FREE">): void {
  trackCore("Checkout start", { props: { plan } });
}
export function trackPurchaseSuccess(plan: Exclude<Plan, "FREE">, revenueUsd: number): void {
  trackCore("Purchase success", { props: { plan }, revenue: revenueUsd });
}

// Retention / Engagement
export function trackUpgradeClick(source: Source): void {
  trackCore("Upgrade click", { props: { source } });
}
export function trackLogoutClick(source: Source): void {
  trackCore("Logout click", { props: { source } });
}

export function trackModalClose(
  modal: "demo" | "legal" | "generic",
  method: "esc" | "overlay" | "button"
): void {
  trackCore("Modal close", { props: { modal, method, source: "other" } });
}

export {};

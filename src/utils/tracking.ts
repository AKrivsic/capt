"use client";

// --- Doménové typy ---
export type Plan = "FREE" | "TEXT_STARTER" | "TEXT_PRO" | "VIDEO_LITE" | "VIDEO_PRO" | "VIDEO_UNLIMITED";
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
  | "Logout click"
  | "Visit try"
  | "Demo text start"
  | "Demo video upload"
  | "Preview shown"
  | "Email unlock"
  | "Download clean"
  | "Limit reached";

type TrackProps = Record<string, string | number | boolean | null | undefined>;
type PlausibleOptions = { props?: TrackProps; revenue?: number };
type PlausibleQueueItem = [string, PlausibleOptions?];

// Disable switch (např. pro e2e/test)
const DISABLED =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_PLAUSIBLE_DISABLED === "1";

// Inicializace stubu, pokud Plausible skript ještě není načtený
function ensurePlausibleStub(): void {
  if (typeof window === "undefined") return;
  if (typeof window.plausible === "function") return;

  const queue: PlausibleQueueItem[] = [];
  const stub = ((eventName: string, options?: PlausibleOptions) => {
    queue.push([eventName, options]);
  }) as unknown as { (name: string, options?: PlausibleOptions): void; q?: PlausibleQueueItem[] };
  stub.q = queue;
  window.plausible = stub as unknown as typeof window.plausible;
}

// Bezpečné volání i když skript ještě není načtený
function callPlausible(name: EventName, options?: PlausibleOptions): void {
  if (typeof window === "undefined" || DISABLED) return;
  ensurePlausibleStub();
  try {
    const fn = window.plausible as unknown as (event: string, options?: PlausibleOptions) => void;
    fn?.(name, options);
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

export function trackStyleUiMatch(enabled: boolean): void {
  // Logujeme jako součást generator metriks
  trackCore("Generator access", { props: { ab_event: "style_ui_match", enabled } });
}

// ====== Funnel Events (for post-launch metrics) ======

// Visit → Try flow
export function trackVisitTry(): void {
  trackCore("Visit try", { props: { source: "homepage" } });
}

// Demo interactions
export function trackDemoTextStart(): void {
  trackCore("Demo text start", { props: { source: "demo_modal" } });
}

export function trackDemoVideoUpload(): void {
  trackCore("Demo video upload", { props: { source: "demo_modal" } });
}

// Preview and generation
export function trackPreviewShown(): void {
  trackCore("Preview shown", { props: { source: "generator" } });
}

// Email unlock flow
export function trackEmailUnlock(): void {
  trackCore("Email unlock", { props: { source: "video_demo" } });
}

// Download flow
export function trackDownloadClean(): void {
  trackCore("Download clean", { props: { source: "email_link" } });
}

// Limit reached events
export function trackLimitReached(type: "text" | "video"): void {
  trackCore("Limit reached", { props: { type } });
}

export {};

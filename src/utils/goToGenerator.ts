"use client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function goToGenerator(router: AppRouterInstance, isLoggedIn: boolean) {
  const plausible: ((event: string, opts?: { props?: Record<string, unknown> }) => void) | undefined =
    (window as unknown as { plausible?: (event: string, opts?: { props?: Record<string, unknown> }) => void }).plausible;
  if (!isLoggedIn) {
    // track demo
    plausible?.("Demo_click", { props: { source: "goToGenerator" } });
    router.push("/?demo=true", { scroll: false });
    return;
  }

  // track generator access
  plausible?.("Generator_access", { props: { source: "goToGenerator" } });
  router.push("/#generator", { scroll: true });
}
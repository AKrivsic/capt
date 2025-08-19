"use client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function goToGenerator(router: AppRouterInstance, isLoggedIn: boolean) {
  if (!isLoggedIn) {
    // track demo
    window.plausible?.("Demo click", { props: { source: "goToGenerator" } });
    router.push("/?demo=true", { scroll: false });
    return;
  }

  // track generator access
  window.plausible?.("Generator access", { props: { source: "goToGenerator" } });
  router.push("/#generator", { scroll: true });
}
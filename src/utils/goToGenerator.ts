// src/utils/goToGenerator.ts
"use client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function goToGenerator(router: AppRouterInstance, isLoggedIn: boolean) {
  if (!isLoggedIn) {
    router.push("/?demo=true", { scroll: false });
    return;
  }
  router.push("/#generator", { scroll: true });
}

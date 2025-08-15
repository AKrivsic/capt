"use client";
import { useSearchParams } from "next/navigation";
import PostSignInConsent from "@/components/marketing/PostSignInConsent";

export default function ConsentOnHome() {
  const sp = useSearchParams();
  const shouldOpen = sp.get("consent") === "1";
  if (!shouldOpen) return null;
  return <PostSignInConsent openOnMount />;
}

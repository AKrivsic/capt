"use client";
import { useSession } from "next-auth/react";
import PostSignInConsent from "@/components/marketing/PostSignInConsent";

export default function ConsentOnHome() {
  const { data: session, status } = useSession();
  const consent = (session && (session.user as { marketingConsent?: boolean | null })?.marketingConsent) ?? null;
  const shouldOpen = status === "authenticated" && consent === null;
  if (!shouldOpen) return null;
  return <PostSignInConsent openOnMount />;
}

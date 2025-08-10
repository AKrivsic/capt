"use client";
import { normalizePlatform } from "@/utils/normalizePlatform";

type GenerateParams = {
  style: string;
  platformLabel: "Instagram"|"TikTok"|"X/Twitter"|"OnlyFans";
  outputs: string[];     // např. ["caption","hashtags"]
  vibe: string;
  variants?: number;     // default 3
  demo?: boolean;        // true = free/demo režim
};

export async function callGenerate(params: GenerateParams) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      style: params.style,
      platform: normalizePlatform(params.platformLabel),
      outputs: params.outputs,
      vibe: params.vibe,
      variants: params.variants ?? 3,
      demo: !!params.demo,
    }),
  });

  const payload = await res.json();
  if (!payload?.ok) {
    throw new Error(payload?.error || "GENERATION_FAILED");
  }
  // payload.data: Record<type, string[]>
  return payload.data as Record<string, string[]>;
}

// src/lib/platformConstraints.ts (NOVÝ)
import { collapseForTwitter } from "./validators";
import type { PlatformKey } from "@/constants/platformNotes";

export function applyPlatformConstraints(platform: PlatformKey, type: string, text: string) {
  let out = text;
  if (platform === "X/Twitter") {
    out = out.replace(/.*follow for more fun!?$/gim, "").trim();
    out = collapseForTwitter(out);
  }
  return out;
}

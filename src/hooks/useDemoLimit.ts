"use client";
import { useCallback, useEffect, useState } from "react";

export function useDemoLimit(key = "captioni_demo_modal_v1", max = 2) {
  const [uses, setUses] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setUses(raw ? Number(raw) : 0);
    } catch {}
  }, [key]);

  const canUse = uses < max;

  const inc = useCallback(() => {
    const next = uses + 1;
    setUses(next);
    try { localStorage.setItem(key, String(next)); } catch {}
    return next;
  }, [uses, key]);

  const reset = useCallback(() => {
    setUses(0);
    try { localStorage.setItem(key, "0"); } catch {}
  }, [key]);

  return { uses, canUse, inc, reset, max };
}

// src/utils/usage.ts

// Client-side helpers to persist per-day usage.
// Resets by local day (or a provided IANA time zone).
const NAMESPACE = "captioni:usage";

type Opts = { timeZone?: string; date?: Date };

function formatYMD(opts?: Opts): string {
  const d = opts?.date ?? new Date();
  if (opts?.timeZone) {
    // en-CA yields YYYY-MM-DD
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: opts.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  }
  // Local timezone fallback
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayKey(prefix: string, opts?: Opts): string {
  return `${NAMESPACE}:${prefix}:${formatYMD(opts)}`;
}

export function getUsage(prefix: string, opts?: Opts): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(dayKey(prefix, opts));
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function setUsage(prefix: string, value: number, opts?: Opts): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(dayKey(prefix, opts), String(Math.max(0, Math.floor(value))));
  } catch {
    /* noop */
  }
}

export function incUsage(prefix: string, opts?: Opts): number {
  const next = getUsage(prefix, opts) + 1;
  setUsage(prefix, next, opts);
  return next;
}

export function clearUsage(prefix: string, opts?: Opts): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(dayKey(prefix, opts));
  } catch {
    /* noop */
  }
}

export function isAtLimit(prefix: string, limit: number, opts?: Opts): boolean {
  return getUsage(prefix, opts) >= limit;
}

export function remaining(prefix: string, limit: number, opts?: Opts): number {
  return Math.max(0, limit - getUsage(prefix, opts));
}

import { useEffect, useState, useCallback } from "react";

export type HistoryItem = {
  id: string;
  platform: "instagram" | "tiktok" | "x" | "onlyfans";
  style: string;
  type: string;
  variantIndex: number;
  text: string;
  feedback: "like" | "dislike" | null;
  createdAt: string; // ISO string from API
};

export type HistoryFilters = {
  platform?: "instagram" | "tiktok" | "x" | "onlyfans";
  type?: string;
  style?: string;
  q?: string;
  order?: "new" | "old";
};

type ListResp = {
  ok: boolean;
  data?: HistoryItem[];
  nextCursor?: string | null;
  error?: string;
};

export function useHistory(initialLimit = 20, initialFilters: HistoryFilters = { order: "new" }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<HistoryFilters>(initialFilters);

  const buildQuery = useCallback(
    (reset: boolean) => {
      const params = new URLSearchParams({ limit: String(initialLimit) });
      if (!reset && cursor) params.set("cursor", cursor);
      if (filters.platform) params.set("platform", filters.platform);
      if (filters.type) params.set("type", filters.type);
      if (filters.style) params.set("style", filters.style);
      if (filters.q) params.set("q", filters.q);
      if (filters.order) params.set("order", filters.order);
      return params.toString();
    },
    [cursor, filters, initialLimit]
  );

  const load = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/history/list?${buildQuery(reset)}`);
        const json: ListResp = await res.json();

        if (!json.ok) throw new Error(json.error || "Failed to fetch history");

        const newItems: HistoryItem[] = json.data ?? [];

        if (reset) setItems(newItems);
        else setItems((prev) => [...prev, ...newItems]);

        setCursor(json.nextCursor ?? null);
        setHasMore(Boolean(json.nextCursor));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [buildQuery]
  );

  // první načtení
  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // když se změní filtry → reset
  useEffect(() => {
    setCursor(null);
    load(true);
  }, [filters, load]);

  const applyFilters = (next: HistoryFilters) => setFilters((prev) => ({ ...prev, ...next }));
  const clearFilters = () => setFilters({ order: filters.order ?? "new" });

  const refresh = useCallback(() => {
    setCursor(null);
    load(true);
  }, [load]);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore: () => load(false),
    refresh,
    filters,
    applyFilters,
    clearFilters,
  };
}

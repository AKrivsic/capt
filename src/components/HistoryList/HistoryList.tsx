"use client";
import { useHistory } from "@/hooks/useHistory";
import styles from "./HistoryList.module.css";

const platformEmoji: Record<string, string> = {
  instagram: "📸",
  tiktok: "🎵",
  x: "🗨️",
  onlyfans: "⭐",
};

type PlatformEnum = "instagram" | "tiktok" | "x" | "onlyfans";

const types = ["caption","bio","hashtags","dm","comments","story","hook"];

export default function HistoryList() {
  const { items, loading, error, loadMore, hasMore, refresh, filters, applyFilters, clearFilters } =
    useHistory(20, { order: "new" });

  const isInitialLoading = loading && items.length === 0;

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>Your recent generations</h3>
          <span className={styles.badge}>Pro • History</span>
        </div>
        <div className={styles.actions}>
          <button className={styles.buttonGhost} onClick={refresh} disabled={loading}>
            Refresh
          </button>
          <button
            className={styles.exportBtn}
            onClick={() => {
              const params = new URLSearchParams();
              if (filters.platform) params.set("platform", filters.platform);
              if (filters.type) params.set("type", filters.type);
              if (filters.style) params.set("style", filters.style);
              if (filters.q) params.set("q", filters.q);
              if (filters.order) params.set("order", filters.order);
              params.set("limit", "5000");
              const url = `/api/history/export?${params.toString()}`;
              window.open(url, "_blank");
            }}
            disabled={loading}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className={styles.filters}>
        <div>
          <label className={styles.label}>Platform</label>
          <select
            className={styles.select}
            value={filters.platform ?? ""}
            onChange={(e) => {
              const v = e.target.value as "" | PlatformEnum;
              applyFilters({ platform: v === "" ? undefined : v });
            }}
          >
            <option value="">All</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="x">X/Twitter</option>
            <option value="onlyfans">OnlyFans</option>
          </select>
        </div>

        <div>
          <label className={styles.label}>Type</label>
          <select
            className={styles.select}
            value={filters.type ?? ""}
            onChange={(e) => applyFilters({ type: e.target.value || undefined })}
          >
            <option value="">All</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={styles.label}>Style</label>
          <input
            className={styles.input}
            placeholder="e.g. Barbie"
            value={filters.style ?? ""}
            onChange={(e) => applyFilters({ style: e.target.value || undefined })}
          />
        </div>

        <div>
          <label className={styles.label}>Search text</label>
          <input
            className={styles.input}
            placeholder="search in content…"
            value={filters.q ?? ""}
            onChange={(e) => applyFilters({ q: e.target.value || undefined })}
          />
        </div>

        <div className={styles.filterActions}>
          <select
            className={styles.select}
            value={filters.order ?? "new"}
            onChange={(e) => applyFilters({ order: e.target.value as "new" | "old" })}
          >
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
          </select>
          <button className={styles.buttonGhost} onClick={clearFilters} disabled={loading}>
            Clear
          </button>
        </div>
      </div>

      {error && <div className={styles.empty}>⚠️ {error}</div>}
      {!error && items.length === 0 && !isInitialLoading && (
        <div className={styles.empty}>No history yet. Try different filters ✨</div>
      )}

      {!isInitialLoading && items.length > 0 && (
        <ul className={styles.list}>
          {items.map((it) => (
            <li key={it.id} className={styles.item}>
              <div className={styles.itemHeader}>
                <div className={styles.metaLeft}>
                  <span className={styles.platformPill}>
                    <span className={styles.platformIcon}>
                      {platformEmoji[it.platform] ?? "✨"}
                    </span>
                    {it.platform}
                  </span>
                  <span className={styles.chip}>{it.type.toUpperCase()}</span>
                  <span className={styles.chip}>{it.style}</span>
                </div>
                <span className={styles.stamp}>
                  #{it.variantIndex} • {new Date(it.createdAt).toLocaleString()}
                </span>
              </div>
              <div className={styles.body}>
                <pre className={styles.text}>{it.text}</pre>
              </div>
              <div className={styles.feedback}>Feedback: {it.feedback ?? "—"}</div>
            </li>
          ))}
        </ul>
      )}

      {hasMore && !error && (
        <div className={styles.loadMoreWrap}>
          <button className={styles.button} onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </section>
  );
}

export function extractVideoIdFromPreviewUrl(url: string): string | null {
  try {
    // podpora relativních i absolutních URL
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const u = new URL(url, base);
    // očekávaný tvar: /api/demo/preview/:id
    const m = /\/api\/demo\/preview\/([^/?#]+)/.exec(u.pathname);
    if (!m || !m[1]) return null;
    return decodeURIComponent(m[1]);
  } catch {
    return null;
  }
}

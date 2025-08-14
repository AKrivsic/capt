// lib/esp.ts
type SubscribeOpts = {
  email: string;
  name?: string | null;
  tags?: string[];
  doubleOptIn?: boolean;
  listId?: string;
  source?: string;
};

/**
 * Je ESP zapnuté?
 * Pokud nejsou nastavené ENV, adapter se chová jako NO-OP (jen loguje).
 */
function isConfigured() {
  return Boolean(process.env.ESP_SUBSCRIBE_URL && process.env.ESP_API_KEY);
}

function defaultTags() {
  return (process.env.ESP_DEFAULT_TAGS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const DEFAULT_TIMEOUT = Number(process.env.ESP_TIMEOUT_MS || 8000);

async function postJSON(url: string, apiKey: string, body: unknown) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${res.status} ${text}`);
    }
  } finally {
    clearTimeout(t);
  }
}

/**
 * Přihlášení do ESP listu (vendor-neutral).
 * Pokud není nastaveno ENV → NO-OP (zaloguje a vrátí se).
 */
export async function espSubscribe(opts: SubscribeOpts) {
  if (!opts?.email) throw new Error("espSubscribe: missing email");

  if (!isConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[ESP] NO-OP subscribe", {
        email: opts.email,
        name: opts.name,
        tags: opts.tags || defaultTags(),
        listId: opts.listId || process.env.ESP_LIST_ID,
        doubleOptIn: opts.doubleOptIn ?? (process.env.ESP_DOUBLE_OPT_IN === "true"),
        source: opts.source || "captioni-app",
      });
    }
    return; // nic neposílat, jen „dummy“ režim
  }

  const url = process.env.ESP_SUBSCRIBE_URL!;
  const apiKey = process.env.ESP_API_KEY!;
  const payload = {
    email: opts.email,
    name: opts.name ?? undefined,
    tags: (opts.tags && opts.tags.length ? opts.tags : defaultTags()) || undefined,
    listId: opts.listId ?? process.env.ESP_LIST_ID,
    doubleOptIn: opts.doubleOptIn ?? (process.env.ESP_DOUBLE_OPT_IN === "true"),
    source: opts.source || "captioni-app",
  };

  await postJSON(url, apiKey, payload);
}

/**
 * Odhlášení z ESP (vendor-neutral).
 * Pokud není nastaveno ENV → NO-OP (zaloguje a vrátí se).
 */
export async function espUnsubscribe(email: string) {
  if (!email) throw new Error("espUnsubscribe: missing email");

  if (!isConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[ESP] NO-OP unsubscribe", { email });
    }
    return;
  }

  const url = process.env.ESP_UNSUBSCRIBE_URL!;
  const apiKey = process.env.ESP_API_KEY!;
  await postJSON(url, apiKey, { email });
}

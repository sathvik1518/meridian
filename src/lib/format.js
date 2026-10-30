// Small formatting helpers used all over the UI.
export const LOW_STOCK = 15; // at or below this many units we call it "low"
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export const money = (n) => usd.format(Number(n) || 0);

export const moneyWhole = (n) => usd0.format(Number(n) || 0);

export const compactMoney = (n) => "$" + compact.format(Number(n) || 0);

export const compactNumber = (n) => compact.format(Number(n) || 0);

export const percent = (n) => `${Math.round(Number(n) || 0)}%`;

// "home-office" -> "Home Office"
export function titleCase(slug = "") {
  return String(slug)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

// Price after discount percentage.
export const discounted = (price, pct) => Number(price) * (1 - (Number(pct) || 0) / 100);

// One place decides what "out / low / ok" means so every screen agrees.
export function stockStatus(stock) {
  const n = Number(stock) || 0;
  if (n <= 0) return { key: "out", label: "Out of stock", tone: "bad" };
  if (n <= LOW_STOCK) return { key: "low", label: "Low stock", tone: "warn" };
  return { key: "ok", label: "In stock", tone: "ok" };
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

const shortFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export const formatDate = (iso) => dateFmt.format(new Date(iso));

export const formatShortDate = (iso) => shortFmt.format(new Date(iso));

export function timeAgo(iso, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const units = [
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ];
  for (const [size, label] of units) if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`;
  return "just now";
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// Turn rows into a CSV string (quotes escaped) for the Restock export.
export function toCsv(rows) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

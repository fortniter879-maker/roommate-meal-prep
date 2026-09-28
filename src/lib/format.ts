export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

export function toCents(value: FormDataEntryValue | null) {
  const n = Number(String(value ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}

export function toNumber(value: FormDataEntryValue | null, fallback = 0) {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function formatNumber(n: number, digits = 0) {
  return Number(n).toLocaleString("en-CA", { maximumFractionDigits: digits });
}

/** Splits cents evenly; the first few people absorb the leftover cents so shares always sum to total. */
export function splitEvenly(totalCents: number, count: number) {
  if (count <= 0) return [];
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

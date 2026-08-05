/** Zero-decimal currencies are stored in whole units, not cents. */
const ZERO_DECIMAL = new Set(["bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"])

function toMajorUnits(minorAmount: number, currency: string) {
  return ZERO_DECIMAL.has(currency.toLowerCase()) ? minorAmount : minorAmount / 100
}

export function formatCurrency(minorAmount: number, currency: string, options?: { compact?: boolean }) {
  const value = toMajorUnits(minorAmount, currency)
  const zeroDecimal = ZERO_DECIMAL.has(currency.toLowerCase())

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    notation: options?.compact ? "compact" : "standard",
    maximumFractionDigits: options?.compact ? 1 : zeroDecimal ? 0 : 2,
    minimumFractionDigits: options?.compact ? 0 : zeroDecimal ? 0 : 2,
  }).format(value)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

export function formatPercent(ratio: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(ratio)
}

export function formatDelta(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? { label: "no change", direction: "flat" as const } : { label: "new", direction: "up" as const }
  }

  const ratio = (current - previous) / Math.abs(previous)
  const direction = ratio > 0.0005 ? ("up" as const) : ratio < -0.0005 ? ("down" as const) : ("flat" as const)

  return {
    label: `${ratio > 0 ? "+" : ""}${new Intl.NumberFormat("en-US", {
      style: "percent",
      maximumFractionDigits: 1,
    }).format(ratio)}`,
    direction,
  }
}

/** Axis tick label sized to the bucket width: clock time intraday, date otherwise. */
export function formatBucketLabel(unixSeconds: number, bucketSeconds: number) {
  const intraday = bucketSeconds < 86_400

  return new Intl.DateTimeFormat("en-US", {
    ...(intraday ? { hour: "numeric", minute: "2-digit" } : { month: "short", day: "numeric" }),
    timeZone: "UTC",
  }).format(unixSeconds * 1000)
}

/** Human description of the charted window, e.g. "6 hours · 15m buckets". */
export function formatWindowLabel(bucketSeconds: number, buckets: number) {
  const totalSeconds = bucketSeconds * buckets
  const bucketLabel =
    bucketSeconds < 3_600
      ? `${bucketSeconds / 60}m`
      : bucketSeconds < 86_400
        ? `${bucketSeconds / 3_600}h`
        : `${bucketSeconds / 86_400}d`

  const spanLabel =
    totalSeconds < 86_400
      ? `${Math.round(totalSeconds / 3_600)} hours`
      : `${Math.round(totalSeconds / 86_400)} days`

  return `${spanLabel} · ${bucketLabel} buckets`
}

export function formatTimestamp(unixSeconds: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(unixSeconds * 1000)
}

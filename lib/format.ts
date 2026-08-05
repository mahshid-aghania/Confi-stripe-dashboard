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

/** Chart sampling interval in words, e.g. "daily". */
export function formatGranularity(bucketSeconds: number) {
  if (bucketSeconds < 86_400) return "hourly"
  if (bucketSeconds === 86_400) return "daily"
  if (bucketSeconds < 30 * 86_400) return "weekly"
  return "monthly"
}

/** Inclusive calendar span, e.g. "Jul 7 – Aug 5, 2026". */
export function formatRangeSpan(start: number, end: number) {
  const lastDay = end - 86_400
  const sameYear =
    new Date(start * 1000).getUTCFullYear() === new Date(lastDay * 1000).getUTCFullYear()

  const from = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
  }).format(start * 1000)

  return `${from} – ${formatDate(lastDay)}`
}

/** Full calendar date for report rows, e.g. "Mar 4, 2026". */
export function formatDate(unixSeconds: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(unixSeconds * 1000)
}

/** Stripe reason codes are snake_case; render them as readable prose. */
export function formatRefundReason(reason: string | null) {
  if (!reason) return "Not specified"

  return reason.replace(/_/g, " ").replace(/^\w/, (char) => char.toUpperCase())
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

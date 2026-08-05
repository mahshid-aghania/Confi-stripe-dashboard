export const DAY_SECONDS = 86_400
const HOUR_SECONDS = 3_600

export const PRESETS = [
  { id: "7d", label: "7D", days: 7 },
  { id: "30d", label: "30D", days: 30 },
  { id: "90d", label: "90D", days: 90 },
  { id: "12m", label: "12M", days: 365 },
  { id: "ytd", label: "YTD", days: null },
] as const

export type PresetId = (typeof PRESETS)[number]["id"]

export type DateRange = {
  /** Inclusive UTC-midnight start. */
  start: number
  /** Exclusive end — midnight after the last included day. */
  end: number
  /** Whole days covered, always >= 1. */
  days: number
  preset: PresetId | null
  label: string
  /** ISO yyyy-mm-dd, for populating the date inputs. */
  fromISO: string
  toISO: string
}

export type RangeParams = {
  preset?: string | string[]
  from?: string | string[]
  to?: string | string[]
}

export const DEFAULT_PRESET: PresetId = "30d"

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function startOfUtcDay(unixSeconds: number) {
  return Math.floor(unixSeconds / DAY_SECONDS) * DAY_SECONDS
}

export function toISODate(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10)
}

/**
 * Parses yyyy-mm-dd as UTC midnight. Returns null for anything malformed or for
 * impossible dates like 2026-02-31, which Date would otherwise roll forward.
 */
export function fromISODate(value: string | undefined): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null

  const parsed = Date.parse(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed)) return null

  const seconds = Math.floor(parsed / 1000)
  return toISODate(seconds) === value ? seconds : null
}

function presetById(id: string | undefined) {
  return PRESETS.find((preset) => preset.id === id) ?? null
}

function presetRange(preset: (typeof PRESETS)[number], today: number): DateRange {
  const end = today + DAY_SECONDS

  // YTD runs from Jan 1 of the current UTC year rather than a fixed day count.
  const start =
    preset.days === null
      ? Math.floor(Date.UTC(new Date(today * 1000).getUTCFullYear(), 0, 1) / 1000)
      : today - (preset.days - 1) * DAY_SECONDS

  return {
    start,
    end,
    days: Math.max(1, Math.round((end - start) / DAY_SECONDS)),
    preset: preset.id,
    label: preset.id === "ytd" ? "Year to date" : `Last ${preset.label.toLowerCase()}`,
    fromISO: toISODate(start),
    toISO: toISODate(today),
  }
}

/**
 * Resolves URL params into a concrete range. Custom `from`/`to` win when both
 * parse; anything invalid falls back to the default preset so a hand-edited URL
 * can never produce an unbounded or reversed Stripe query.
 */
export function resolveRange(params: RangeParams = {}, now = Math.floor(Date.now() / 1000)): DateRange {
  const today = startOfUtcDay(now)

  const from = fromISODate(first(params.from))
  const to = fromISODate(first(params.to))

  if (from !== null && to !== null) {
    // Tolerate a reversed selection instead of rejecting it.
    const startDay = Math.min(from, to)
    const endDay = Math.min(Math.max(from, to), today)
    const clampedStart = Math.min(startDay, endDay)
    const end = endDay + DAY_SECONDS

    return {
      start: clampedStart,
      end,
      days: Math.max(1, Math.round((end - clampedStart) / DAY_SECONDS)),
      preset: null,
      label: `${toISODate(clampedStart)} → ${toISODate(endDay)}`,
      fromISO: toISODate(clampedStart),
      toISO: toISODate(endDay),
    }
  }

  const preset = presetById(first(params.preset)) ?? presetById(DEFAULT_PRESET)!
  return presetRange(preset, today)
}

/** Equal-length window immediately before `range`, for period-over-period deltas. */
export function previousRange(range: DateRange) {
  const span = range.end - range.start
  return { start: range.start - span, end: range.start }
}

/**
 * Bucket width for the chart, chosen so a range always yields a readable number
 * of samples: hourly for a day or two, daily for weeks, weekly past a quarter,
 * monthly past a year.
 */
export function bucketSecondsFor(range: DateRange) {
  if (range.days <= 2) return HOUR_SECONDS
  if (range.days <= 31) return DAY_SECONDS
  if (range.days <= 120) return DAY_SECONDS
  if (range.days <= 400) return 7 * DAY_SECONDS
  return 30 * DAY_SECONDS
}

/** Serializes a range back into a query string for links. */
export function rangeQuery(range: Pick<DateRange, "preset" | "fromISO" | "toISO">) {
  if (range.preset) {
    return range.preset === DEFAULT_PRESET ? "" : `?preset=${range.preset}`
  }
  return `?from=${range.fromISO}&to=${range.toISO}`
}

import "server-only"

import type Stripe from "stripe"

import { isPermissionError, stripe } from "@/lib/stripe"

const DAY_SECONDS = 86_400
const HOUR_SECONDS = 3_600

/** Window used for the KPI cards and their period-over-period deltas. */
export const WINDOW_DAYS = 30

/**
 * Chart granularity ladder, coarsest-last. The first rung whose total span
 * covers the real data is used, so a sandbox with an hour of activity gets a
 * readable minute/hour axis instead of 30 mostly-empty days.
 */
const GRANULARITY_LADDER = [
  { bucketSeconds: 900, buckets: 24 }, // 6 hours at 15m
  { bucketSeconds: HOUR_SECONDS, buckets: 24 }, // 1 day at 1h
  { bucketSeconds: 6 * HOUR_SECONDS, buckets: 28 }, // 7 days at 6h
  { bucketSeconds: DAY_SECONDS, buckets: 30 }, // 30 days at 1d
  { bucketSeconds: DAY_SECONDS, buckets: 90 }, // 90 days at 1d
] as const

export type PaymentRow = {
  id: string
  amount: number
  currency: string
  status: Stripe.Charge.Status
  refunded: boolean
  disputed: boolean
  description: string | null
  customerLabel: string
  brand: string | null
  last4: string | null
  created: number
}

export type RevenuePoint = {
  /** Unix seconds at the start of the bucket. */
  date: number
  gross: number
  count: number
}

export type RevenueSeries = {
  points: RevenuePoint[]
  /** Width of one bucket in seconds — drives axis label formatting. */
  bucketSeconds: number
  start: number
  end: number
  total: number
  count: number
}

export type Metric = {
  value: number
  previous: number
}

export type DashboardData = {
  currency: string
  windowDays: number
  generatedAt: number
  grossVolume: Metric
  netVolume: Metric
  successfulPayments: Metric
  refundedVolume: Metric
  /** null when the restricted key lacks the Balance scope. */
  availableBalance: number | null
  pendingBalance: number | null
  successRate: number
  series: RevenueSeries
  payments: PaymentRow[]
  isEmpty: boolean
  error: string | null
}

function floorTo(unixSeconds: number, bucketSeconds: number) {
  return Math.floor(unixSeconds / bucketSeconds) * bucketSeconds
}

function startOfUtcDay(unixSeconds: number) {
  return floorTo(unixSeconds, DAY_SECONDS)
}

function customerLabel(charge: Stripe.Charge) {
  const details = charge.billing_details
  if (details?.name) return details.name

  const customer = charge.customer
  if (customer && typeof customer !== "string" && !("deleted" in customer && customer.deleted)) {
    const expanded = customer as Stripe.Customer
    if (expanded.name) return expanded.name
    if (expanded.email) return expanded.email
  }

  if (details?.email) return details.email
  if (charge.receipt_email) return charge.receipt_email
  if (typeof customer === "string") return customer
  return "Unnamed"
}

function cardDetails(charge: Stripe.Charge) {
  const card = charge.payment_method_details?.card
  return {
    brand: card?.brand ?? null,
    last4: card?.last4 ?? null,
  }
}

/**
 * Net amount for a charge, using the expanded balance transaction when Stripe
 * has settled it. Falls back to gross when the transaction is not available yet.
 */
function netAmount(charge: Stripe.Charge) {
  const transaction = charge.balance_transaction
  if (transaction && typeof transaction !== "string") {
    return transaction.net
  }
  return charge.amount - charge.amount_refunded
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = Math.floor(Date.now() / 1000)
  const windowStart = startOfUtcDay(now - (WINDOW_DAYS - 1) * DAY_SECONDS)
  const previousStart = windowStart - WINDOW_DAYS * DAY_SECONDS

  const empty: DashboardData = {
    currency: "usd",
    windowDays: WINDOW_DAYS,
    generatedAt: now,
    grossVolume: { value: 0, previous: 0 },
    netVolume: { value: 0, previous: 0 },
    successfulPayments: { value: 0, previous: 0 },
    refundedVolume: { value: 0, previous: 0 },
    availableBalance: null,
    pendingBalance: null,
    successRate: 0,
    series: buildSeries([], now),
    payments: [],
    isEmpty: true,
    error: null,
  }

  try {
    const [balance, charges] = await Promise.all([
      // The read-only restricted live key has no Balance scope. Treat the
      // balance as unavailable rather than failing the whole dashboard.
      stripe.balance.retrieve().catch((error: unknown) => {
        if (isPermissionError(error)) return null
        throw error
      }),
      stripe.charges
        .list({
          limit: 100,
          created: { gte: previousStart },
          expand: ["data.balance_transaction", "data.customer"],
        })
        .autoPagingToArray({ limit: 1000 }),
    ])

    const currency = balance?.available[0]?.currency ?? charges[0]?.currency ?? "usd"

    const current = charges.filter((charge) => charge.created >= windowStart)
    const previous = charges.filter((charge) => charge.created < windowStart)

    const succeeded = current.filter((charge) => charge.status === "succeeded")
    const previousSucceeded = previous.filter((charge) => charge.status === "succeeded")

    const sum = (list: Stripe.Charge[], pick: (charge: Stripe.Charge) => number) =>
      list.reduce((total, charge) => total + pick(charge), 0)

    return {
      currency,
      windowDays: WINDOW_DAYS,
      generatedAt: now,
      grossVolume: {
        value: sum(succeeded, (charge) => charge.amount),
        previous: sum(previousSucceeded, (charge) => charge.amount),
      },
      netVolume: {
        value: sum(succeeded, netAmount),
        previous: sum(previousSucceeded, netAmount),
      },
      successfulPayments: {
        value: succeeded.length,
        previous: previousSucceeded.length,
      },
      refundedVolume: {
        value: sum(current, (charge) => charge.amount_refunded),
        previous: sum(previous, (charge) => charge.amount_refunded),
      },
      availableBalance: balance
        ? balance.available.reduce((total, entry) => total + entry.amount, 0)
        : null,
      pendingBalance: balance ? balance.pending.reduce((total, entry) => total + entry.amount, 0) : null,
      successRate: current.length === 0 ? 0 : succeeded.length / current.length,
      series: buildSeries(succeeded, now),
      payments: charges
        .slice()
        .sort((a, b) => b.created - a.created)
        .slice(0, 12)
        .map((charge) => ({
          id: charge.id,
          amount: charge.amount,
          currency: charge.currency,
          status: charge.status,
          refunded: charge.amount_refunded > 0,
          disputed: charge.disputed,
          description: charge.description,
          customerLabel: customerLabel(charge),
          ...cardDetails(charge),
          created: charge.created,
        })),
      isEmpty: charges.length === 0,
      error: null,
    }
  } catch (error) {
    console.log("[v0] Stripe dashboard fetch failed:", error instanceof Error ? error.message : error)
    return {
      ...empty,
      error: error instanceof Error ? error.message : "Unable to reach Stripe.",
    }
  }
}

/**
 * Buckets succeeded charges into a window sized to the data that actually
 * exists. Stripe stamps charges with server time and cannot backdate them, so
 * a fixed 30-day axis flattens a fresh account into a single invisible spike.
 */
function buildSeries(charges: Stripe.Charge[], now: number): RevenueSeries {
  const earliest = charges.reduce((min, charge) => Math.min(min, charge.created), Number.POSITIVE_INFINITY)
  const span = Number.isFinite(earliest) ? now - earliest : WINDOW_DAYS * DAY_SECONDS

  const rung =
    GRANULARITY_LADDER.find((candidate) => candidate.bucketSeconds * candidate.buckets >= span) ??
    GRANULARITY_LADDER[GRANULARITY_LADDER.length - 1]

  const { bucketSeconds, buckets } = rung
  const end = floorTo(now, bucketSeconds)
  const start = end - (buckets - 1) * bucketSeconds

  const points = new Map<number, RevenuePoint>()
  for (let index = 0; index < buckets; index += 1) {
    const date = start + index * bucketSeconds
    points.set(date, { date, gross: 0, count: 0 })
  }

  let total = 0
  let count = 0

  for (const charge of charges) {
    const bucket = points.get(floorTo(charge.created, bucketSeconds))
    if (!bucket) continue
    bucket.gross += charge.amount
    bucket.count += 1
    total += charge.amount
    count += 1
  }

  return {
    points: Array.from(points.values()),
    bucketSeconds,
    start,
    end: end + bucketSeconds,
    total,
    count,
  }
}

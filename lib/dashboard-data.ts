import "server-only"

import type Stripe from "stripe"

import { type DateRange, bucketSecondsFor, previousRange, resolveRange } from "@/lib/date-range"
import { isPermissionError, stripe } from "@/lib/stripe"

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
  /** Same bucket offset in the preceding period, for the comparison overlay. */
  previousGross: number
}

export type RevenueSeries = {
  points: RevenuePoint[]
  /** Width of one bucket in seconds — drives axis label formatting. */
  bucketSeconds: number
  start: number
  end: number
  total: number
  previousTotal: number
  count: number
  /** Largest bucket in the current period. */
  peak: RevenuePoint | null
}

export type Metric = {
  value: number
  previous: number
}

export type DashboardData = {
  currency: string
  range: DateRange
  generatedAt: number
  grossVolume: Metric
  netVolume: Metric
  successfulPayments: Metric
  averageOrderValue: Metric
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

export async function getDashboardData(range: DateRange = resolveRange()): Promise<DashboardData> {
  const now = Math.floor(Date.now() / 1000)
  const comparison = previousRange(range)

  const empty: DashboardData = {
    currency: "usd",
    range,
    generatedAt: now,
    grossVolume: { value: 0, previous: 0 },
    netVolume: { value: 0, previous: 0 },
    successfulPayments: { value: 0, previous: 0 },
    averageOrderValue: { value: 0, previous: 0 },
    refundedVolume: { value: 0, previous: 0 },
    availableBalance: null,
    pendingBalance: null,
    successRate: 0,
    series: buildSeries([], [], range),
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
          // Spans both periods so deltas need only one round trip.
          created: { gte: comparison.start, lt: range.end },
          expand: ["data.balance_transaction", "data.customer"],
        })
        .autoPagingToArray({ limit: 2500 }),
    ])

    const currency = balance?.available[0]?.currency ?? charges[0]?.currency ?? "usd"

    const current = charges.filter((charge) => charge.created >= range.start)
    const previous = charges.filter((charge) => charge.created < range.start)

    const succeeded = current.filter((charge) => charge.status === "succeeded")
    const previousSucceeded = previous.filter((charge) => charge.status === "succeeded")

    const sum = (list: Stripe.Charge[], pick: (charge: Stripe.Charge) => number) =>
      list.reduce((total, charge) => total + pick(charge), 0)

    const grossValue = sum(succeeded, (charge) => charge.amount)
    const grossPrevious = sum(previousSucceeded, (charge) => charge.amount)

    return {
      currency,
      range,
      generatedAt: now,
      grossVolume: { value: grossValue, previous: grossPrevious },
      netVolume: {
        value: sum(succeeded, netAmount),
        previous: sum(previousSucceeded, netAmount),
      },
      successfulPayments: {
        value: succeeded.length,
        previous: previousSucceeded.length,
      },
      averageOrderValue: {
        value: succeeded.length === 0 ? 0 : Math.round(grossValue / succeeded.length),
        previous: previousSucceeded.length === 0 ? 0 : Math.round(grossPrevious / previousSucceeded.length),
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
      series: buildSeries(succeeded, previousSucceeded, range),
      payments: charges
        .filter((charge) => charge.created >= range.start)
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
      isEmpty: current.length === 0,
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
 * Buckets succeeded charges across the selected range. Buckets are aligned to
 * the range start rather than the epoch, so the first sample always begins on
 * the chosen day instead of an arbitrary weekday.
 */
function buildSeries(
  charges: Stripe.Charge[],
  previousCharges: Stripe.Charge[],
  range: DateRange,
): RevenueSeries {
  const bucketSeconds = bucketSecondsFor(range)
  const bucketCount = Math.max(1, Math.ceil((range.end - range.start) / bucketSeconds))
  const comparison = previousRange(range)

  const points: RevenuePoint[] = Array.from({ length: bucketCount }, (_, index) => ({
    date: range.start + index * bucketSeconds,
    gross: 0,
    count: 0,
    previousGross: 0,
  }))

  const indexOf = (created: number, origin: number) =>
    Math.floor((created - origin) / bucketSeconds)

  let total = 0
  let count = 0

  for (const charge of charges) {
    const point = points[indexOf(charge.created, range.start)]
    if (!point) continue
    point.gross += charge.amount
    point.count += 1
    total += charge.amount
    count += 1
  }

  let previousTotal = 0

  for (const charge of previousCharges) {
    previousTotal += charge.amount
    const point = points[indexOf(charge.created, comparison.start)]
    if (point) point.previousGross += charge.amount
  }

  const peak = points.reduce<RevenuePoint | null>(
    (best, point) => (point.gross > 0 && (!best || point.gross > best.gross) ? point : best),
    null,
  )

  return {
    points,
    bucketSeconds,
    start: range.start,
    end: range.end,
    total,
    previousTotal,
    count,
    peak,
  }
}

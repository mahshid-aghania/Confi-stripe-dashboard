import "server-only"

import type Stripe from "stripe"

import { stripe } from "@/lib/stripe"

const DAY_SECONDS = 86_400
export const WINDOW_DAYS = 30

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
  /** Unix seconds at the start of the bucket day (UTC). */
  date: number
  gross: number
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
  availableBalance: number
  pendingBalance: number
  successRate: number
  series: RevenuePoint[]
  payments: PaymentRow[]
  isEmpty: boolean
  error: string | null
}

function startOfUtcDay(unixSeconds: number) {
  const date = new Date(unixSeconds * 1000)
  date.setUTCHours(0, 0, 0, 0)
  return Math.floor(date.getTime() / 1000)
}

function customerLabel(charge: Stripe.Charge) {
  const details = charge.billing_details
  if (details?.name) return details.name
  if (details?.email) return details.email
  if (typeof charge.customer === "string") return charge.customer
  if (charge.customer && "email" in charge.customer && charge.customer.email) {
    return charge.customer.email
  }
  return "Guest"
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
    availableBalance: 0,
    pendingBalance: 0,
    successRate: 0,
    series: buildSeries([], windowStart),
    payments: [],
    isEmpty: true,
    error: null,
  }

  try {
    const [balance, charges] = await Promise.all([
      stripe.balance.retrieve(),
      stripe.charges
        .list({
          limit: 100,
          created: { gte: previousStart },
          expand: ["data.balance_transaction"],
        })
        .autoPagingToArray({ limit: 1000 }),
    ])

    const currency = balance.available[0]?.currency ?? charges[0]?.currency ?? "usd"

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
      availableBalance: balance.available.reduce((total, entry) => total + entry.amount, 0),
      pendingBalance: balance.pending.reduce((total, entry) => total + entry.amount, 0),
      successRate: current.length === 0 ? 0 : succeeded.length / current.length,
      series: buildSeries(succeeded, windowStart),
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

function buildSeries(charges: Stripe.Charge[], windowStart: number): RevenuePoint[] {
  const buckets = new Map<number, RevenuePoint>()

  for (let index = 0; index < WINDOW_DAYS; index += 1) {
    const date = windowStart + index * DAY_SECONDS
    buckets.set(date, { date, gross: 0, count: 0 })
  }

  for (const charge of charges) {
    const key = startOfUtcDay(charge.created)
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.gross += charge.amount
    bucket.count += 1
  }

  return Array.from(buckets.values())
}

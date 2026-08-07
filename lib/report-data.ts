import "server-only"

import type Stripe from "stripe"

import { type DateRange, monthsInRange, previousMonthStart, utcMonthKey } from "@/lib/date-range"
import { stripe } from "@/lib/stripe"

/** Cap on charges pulled for one report; guards against a runaway range. */
const CHARGE_LIMIT = 6000

export type MonthRow = {
  key: string
  label: string
  start: number
  end: number
  /** The selected range clips this month, so its total is not a full month. */
  partial: boolean
  days: number
  /** Total charged to customers, tax included (charge.amount). */
  gross: number
  /** Tax collected via Stripe Tax / invoice tax rates. */
  tax: number
  /** gross − tax */
  grossExTax: number
  /** Stripe processing fees drawn from the settled balance transactions. */
  fees: number
  /** Refunds issued against charges created in this month. */
  refunded: number
  /** gross − fees − refunded. */
  net: number
  payments: number
  refundCount: number
  failedCount: number
  averageOrder: number
  uniqueCustomers: number
  /** Growth against the preceding calendar month; null when no baseline. */
  momRatio: number | null
  momDelta: number | null
  /** Running gross total through the end of this month. */
  cumulative: number
  /** Average gross per day in the month, comparable across partial months. */
  dailyAverage: number
}

export type ReportTotals = {
  gross: number
  tax: number
  grossExTax: number
  fees: number
  refunded: number
  net: number
  payments: number
  refundCount: number
  failedCount: number
  averageOrder: number
  uniqueCustomers: number
  monthlyAverage: number
  refundRate: number
  successRate: number
}

export type ReportData = {
  currency: string
  range: DateRange
  generatedAt: number
  months: MonthRow[]
  totals: ReportTotals
  best: MonthRow | null
  worst: MonthRow | null
  /** Gross for the calendar month before the range, baseline for the first bar. */
  baselineGross: number | null
  /** True when the charge cap was hit and figures understate reality. */
  truncated: boolean
  isEmpty: boolean
  error: string | null
}

type Accumulator = {
  gross: number
  tax: number
  fees: number
  refunded: number
  payments: number
  refundCount: number
  failedCount: number
  customers: Set<string>
}

function emptyAccumulator(): Accumulator {
  return {
    gross: 0,
    tax: 0,
    fees: 0,
    refunded: 0,
    payments: 0,
    refundCount: 0,
    failedCount: 0,
    customers: new Set(),
  }
}

function customerKey(charge: Stripe.Charge) {
  const email = charge.billing_details?.email ?? charge.receipt_email
  if (email) return email.toLowerCase()
  if (typeof charge.customer === "string") return charge.customer
  if (charge.customer && "id" in charge.customer) return charge.customer.id
  return charge.id
}

/** Fee for a charge, available only once Stripe has settled the transaction. */
function chargeFee(charge: Stripe.Charge) {
  const transaction = charge.balance_transaction
  return transaction && typeof transaction !== "string" ? transaction.fee : 0
}

type ExpandedInvoice = { tax?: number | null; deleted?: boolean }

/** Tax collected on a charge from the expanded invoice; 0 when unavailable. */
function chargeTax(charge: Stripe.Charge): number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inv = (charge as any).invoice as ExpandedInvoice | string | null | undefined
  if (!inv || typeof inv === "string" || inv.deleted) return 0
  return inv.tax ?? 0
}

export async function getReportData(range: DateRange): Promise<ReportData> {
  const generatedAt = Math.floor(Date.now() / 1000)
  const buckets = monthsInRange(range)

  const base: ReportData = {
    currency: "cad",
    range,
    generatedAt,
    months: [],
    totals: {
      gross: 0,
      tax: 0,
      grossExTax: 0,
      fees: 0,
      refunded: 0,
      net: 0,
      payments: 0,
      refundCount: 0,
      failedCount: 0,
      averageOrder: 0,
      uniqueCustomers: 0,
      monthlyAverage: 0,
      refundRate: 0,
      successRate: 0,
    },
    best: null,
    worst: null,
    baselineGross: null,
    truncated: false,
    isEmpty: true,
    error: null,
  }

  if (buckets.length === 0) return base

  // One extra preceding month so the first displayed month still gets a
  // month-over-month delta instead of an empty dash.
  const baselineStart = previousMonthStart(buckets[0].start)

  try {
    const charges = await stripe.charges
      .list({
        limit: 100,
        created: { gte: baselineStart, lt: range.end },
        expand: ["data.balance_transaction", "data.invoice"],
      })
      .autoPagingToArray({ limit: CHARGE_LIMIT })

    const byMonth = new Map<string, Accumulator>()
    const allCustomers = new Set<string>()
    let currency = charges[0]?.currency ?? "cad"

    for (const charge of charges) {
      const key = utcMonthKey(charge.created)
      const bucket = byMonth.get(key) ?? emptyAccumulator()

      if (charge.status === "succeeded") {
        bucket.gross += charge.amount
        bucket.tax += chargeTax(charge)
        bucket.fees += chargeFee(charge)
        bucket.refunded += charge.amount_refunded
        bucket.payments += 1
        if (charge.amount_refunded > 0) bucket.refundCount += 1
        bucket.customers.add(customerKey(charge))
        currency = charge.currency
      } else if (charge.status === "failed") {
        bucket.failedCount += 1
      }

      byMonth.set(key, bucket)
    }

    const baselineKey = utcMonthKey(baselineStart)
    // Only meaningful when the baseline month sits entirely outside the range.
    const baselineGross = buckets.some((bucket) => bucket.key === baselineKey)
      ? null
      : (byMonth.get(baselineKey)?.gross ?? 0)

    let cumulative = 0
    let previousGross = baselineGross

    const months: MonthRow[] = buckets.map((bucket) => {
      const totals = byMonth.get(bucket.key) ?? emptyAccumulator()
      const grossExTax = totals.gross - totals.tax
      const net = totals.gross - totals.fees - totals.refunded
      cumulative += totals.gross

      for (const customer of totals.customers) allCustomers.add(customer)

      const momRatio =
        previousGross === null || previousGross === 0 ? null : (totals.gross - previousGross) / previousGross
      const momDelta = previousGross === null ? null : totals.gross - previousGross

      const row: MonthRow = {
        key: bucket.key,
        label: bucket.label,
        start: bucket.start,
        end: bucket.end,
        partial: bucket.partial,
        days: bucket.days,
        gross: totals.gross,
        tax: totals.tax,
        grossExTax,
        fees: totals.fees,
        refunded: totals.refunded,
        net,
        payments: totals.payments,
        refundCount: totals.refundCount,
        failedCount: totals.failedCount,
        averageOrder: totals.payments === 0 ? 0 : Math.round(totals.gross / totals.payments),
        uniqueCustomers: totals.customers.size,
        momRatio,
        momDelta,
        cumulative,
        dailyAverage: Math.round(totals.gross / bucket.days),
      }

      previousGross = totals.gross
      return row
    })

    const sum = (pick: (row: MonthRow) => number) => months.reduce((total, row) => total + pick(row), 0)

    const gross = sum((row) => row.gross)
    const tax = sum((row) => row.tax)
    const fees = sum((row) => row.fees)
    const refunded = sum((row) => row.refunded)
    const payments = sum((row) => row.payments)
    const failedCount = sum((row) => row.failedCount)

    // Months with zero activity would drag the extremes to a meaningless CA$0.
    const active = months.filter((row) => row.payments > 0)

    return {
      currency,
      range,
      generatedAt,
      months,
      totals: {
        gross,
        tax,
        grossExTax: gross - tax,
        fees,
        refunded,
        net: gross - fees - refunded,
        payments,
        refundCount: sum((row) => row.refundCount),
        failedCount,
        averageOrder: payments === 0 ? 0 : Math.round(gross / payments),
        uniqueCustomers: allCustomers.size,
        monthlyAverage: months.length === 0 ? 0 : Math.round(gross / months.length),
        refundRate: gross === 0 ? 0 : refunded / gross,
        successRate: payments + failedCount === 0 ? 0 : payments / (payments + failedCount),
      },
      best: active.reduce<MonthRow | null>(
        (top, row) => (!top || row.gross > top.gross ? row : top),
        null,
      ),
      worst: active.reduce<MonthRow | null>(
        (low, row) => (!low || row.gross < low.gross ? row : low),
        null,
      ),
      baselineGross,
      truncated: charges.length >= CHARGE_LIMIT,
      isEmpty: payments === 0,
      error: null,
    }
  } catch (error) {
    console.log("[v0] Stripe report fetch failed:", error instanceof Error ? error.message : error)
    return { ...base, error: error instanceof Error ? error.message : "Unable to reach Stripe." }
  }
}

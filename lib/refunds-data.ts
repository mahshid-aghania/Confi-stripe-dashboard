import "server-only"

import type Stripe from "stripe"

import { type DateRange, resolveRange } from "@/lib/date-range"
import { stripe } from "@/lib/stripe"
import { EMPTY_ADDRESS, type RefundAddress, type RefundRow, type RefundsReport } from "@/lib/refunds-types"

function expanded<T extends { id: string }>(value: string | T | null | undefined): T | null {
  return value && typeof value === "object" ? value : null
}

/** Expanded, non-deleted customer only — deleted records have no usable fields. */
function activeCustomer(
  value: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined,
): Stripe.Customer | null {
  if (!value || typeof value !== "object" || value.deleted) return null
  return value as Stripe.Customer
}

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/**
 * Split a single Stripe name field into given/family parts. Stripe stores one
 * free-text name, so the last whitespace-separated token is treated as the
 * family name and everything before it as the given name.
 */
function splitName(fullName: string | null): { firstName: string | null; lastName: string | null } {
  if (!fullName) return { firstName: null, lastName: null }

  const parts = fullName.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return { firstName: parts[0], lastName: null }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  }
}

function toAddress(
  address: Stripe.Address | null | undefined,
  source: RefundAddress["source"],
): RefundAddress | null {
  // An address object with no street line carries no usable information.
  if (!address || !clean(address.line1)) return null

  return {
    line1: clean(address.line1),
    line2: clean(address.line2),
    city: clean(address.city),
    state: clean(address.state),
    postalCode: clean(address.postal_code),
    country: clean(address.country),
    source,
  }
}

/** Billing address, then shipping, then the saved customer record. */
function resolveAddress(charge: Stripe.Charge | null, customer: Stripe.Customer | null): RefundAddress {
  return (
    toAddress(charge?.billing_details?.address, "billing") ??
    toAddress(charge?.shipping?.address, "shipping") ??
    toAddress(customer?.address, "customer") ??
    EMPTY_ADDRESS
  )
}

function resolveOrderNumber(charge: Stripe.Charge | null): string | null {
  const metadata = charge?.metadata ?? {}
  // WooCommerce writes order_id; accept the common variants too.
  return (
    clean(metadata.order_id) ??
    clean(metadata.order_number) ??
    clean(metadata.orderId) ??
    clean(metadata.order) ??
    null
  )
}

function toRow(refund: Stripe.Refund): RefundRow {
  const charge = expanded<Stripe.Charge>(refund.charge)
  // A deleted customer object carries no name, email, or address, so ignore it
  // and let the charge's billing details supply those fields instead.
  const customer = activeCustomer(refund.customer) ?? activeCustomer(charge?.customer)

  const billing = charge?.billing_details
  const fullName = clean(billing?.name) ?? clean(customer?.name)
  const email = clean(billing?.email) ?? clean(customer?.email) ?? clean(charge?.receipt_email)
  const card = charge?.payment_method_details?.card

  return {
    id: refund.id,
    orderNumber: resolveOrderNumber(charge),
    ...splitName(fullName),
    fullName,
    email,
    address: resolveAddress(charge, customer),
    amount: refund.amount,
    currency: refund.currency,
    chargeAmount: charge?.amount ?? null,
    isPartial: charge?.amount != null && refund.amount < charge.amount,
    reason: clean(refund.reason),
    status: refund.status ?? "unknown",
    createdAt: refund.created,
    paymentId:
      typeof refund.payment_intent === "string"
        ? refund.payment_intent
        : (refund.payment_intent?.id ?? charge?.id ?? null),
    receiptNumber: clean(refund.receipt_number),
    cardBrand: clean(card?.brand),
    cardLast4: clean(card?.last4),
  }
}

/**
 * Succeeded charge volume for the window, used to express refunds as a share of
 * revenue. Returns null instead of throwing so a missing scope or a slow page
 * never takes the report down with it.
 */
async function getGrossVolume(rangeStart: number, rangeEnd: number): Promise<number | null> {
  try {
    let total = 0
    let seen = 0

    for await (const charge of stripe.charges.list({
      limit: 100,
      created: { gte: rangeStart, lt: rangeEnd },
    })) {
      if (charge.status === "succeeded") total += charge.amount
      if (++seen >= 2000) break
    }

    return total
  } catch {
    return null
  }
}

/**
 * Every refund created in the trailing window, paginated to completion.
 * `charge.customer` is expanded so the address chain can fall back to the saved
 * customer record even when the refund itself has no customer reference.
 */
export async function getRefundsReport(range: DateRange = resolveRange()): Promise<RefundsReport> {
  const generatedAt = Math.floor(Date.now() / 1000)
  const rangeStart = range.start
  const rangeEnd = range.end
  const windowDays = range.days

  const base: RefundsReport = {
    rows: [],
    range,
    windowDays,
    rangeStart,
    generatedAt,
    currency: "cad",
    totalAmount: 0,
    count: 0,
    partialCount: 0,
    withReasonCount: 0,
    uniqueCustomers: 0,
    grossVolume: null,
    reasonBreakdown: [],
    truncated: false,
    error: null,
  }

  let refunds: Stripe.Refund[] = []

  try {
    const pages = stripe.refunds.list({
      limit: 100,
      created: { gte: rangeStart, lt: rangeEnd },
      expand: ["data.charge", "data.customer", "data.charge.customer"],
    })

    // Hard cap so a very large account cannot hang the request.
    for await (const refund of pages) {
      refunds.push(refund)
      if (refunds.length >= 1000) {
        base.truncated = true
        break
      }
    }
  } catch (error) {
    return {
      ...base,
      error: error instanceof Error ? error.message : "Unable to load refunds from Stripe.",
    }
  }

  const rows = refunds.map(toRow).sort((a, b) => b.createdAt - a.createdAt)
  const grossVolume = await getGrossVolume(rangeStart, rangeEnd)

  const reasonTotals = new Map<string, { count: number; amount: number }>()
  for (const row of rows) {
    const key = row.reason ?? "unspecified"
    const current = reasonTotals.get(key) ?? { count: 0, amount: 0 }
    reasonTotals.set(key, { count: current.count + 1, amount: current.amount + row.amount })
  }

  return {
    ...base,
    rows,
    currency: rows[0]?.currency ?? base.currency,
    totalAmount: rows.reduce((sum, row) => sum + row.amount, 0),
    count: rows.length,
    partialCount: rows.filter((row) => row.isPartial).length,
    withReasonCount: rows.filter((row) => row.reason !== null).length,
    uniqueCustomers: new Set(rows.map((row) => row.email ?? row.id)).size,
    grossVolume,
    reasonBreakdown: [...reasonTotals.entries()]
      .map(([reason, totals]) => ({ reason, ...totals }))
      .sort((a, b) => b.count - a.count),
  }
}

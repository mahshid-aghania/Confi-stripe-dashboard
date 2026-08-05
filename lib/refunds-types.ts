/**
 * Shared refund types and pure helpers. Deliberately free of "server-only" so
 * client components (table rendering, CSV export) can import them.
 */

import type { DateRange } from "@/lib/date-range"

export type RefundAddress = {
  line1: string | null
  line2: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  /** Where the address was resolved from, so the UI can be honest about provenance. */
  source: "billing" | "shipping" | "customer" | null
}

export type RefundRow = {
  id: string
  orderNumber: string | null
  firstName: string | null
  lastName: string | null
  fullName: string | null
  email: string | null
  address: RefundAddress
  amount: number
  currency: string
  chargeAmount: number | null
  isPartial: boolean
  reason: string | null
  status: string
  createdAt: number
  paymentId: string | null
  receiptNumber: string | null
  cardBrand: string | null
  cardLast4: string | null
}

export type RefundsReport = {
  rows: RefundRow[]
  range: DateRange
  windowDays: number
  rangeStart: number
  generatedAt: number
  currency: string
  totalAmount: number
  count: number
  partialCount: number
  withReasonCount: number
  /** Distinct customers by email, so repeat refunders are not double counted. */
  uniqueCustomers: number
  /** Succeeded charge volume in the same window; null when the call fails. */
  grossVolume: number | null
  reasonBreakdown: { reason: string; count: number; amount: number }[]
  truncated: boolean
  error: string | null
}

export const EMPTY_ADDRESS: RefundAddress = {
  line1: null,
  line2: null,
  city: null,
  state: null,
  postalCode: null,
  country: null,
  source: null,
}

export type SortKey = "date" | "amount" | "name" | "order"
export type SortDirection = "asc" | "desc"
export type RefundKind = "all" | "partial" | "full"

/** Free-text match across every field an operator would search by. */
export function matchesQuery(row: RefundRow, query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true

  return [
    row.orderNumber,
    row.firstName,
    row.lastName,
    row.fullName,
    row.email,
    row.reason,
    row.status,
    row.paymentId,
    row.id,
    row.receiptNumber,
    row.cardLast4,
    formatAddress(row.address),
  ].some((field) => field?.toLowerCase().includes(needle))
}

export function sortRows(rows: RefundRow[], key: SortKey, direction: SortDirection) {
  const factor = direction === "asc" ? 1 : -1

  return [...rows].sort((a, b) => {
    switch (key) {
      case "amount":
        return (a.amount - b.amount) * factor
      case "name":
        // Blank names always sink, regardless of direction.
        return (
          (a.lastName ?? a.firstName ?? "\uffff").localeCompare(b.lastName ?? b.firstName ?? "\uffff") *
          factor
        )
      case "order":
        return (a.orderNumber ?? "\uffff").localeCompare(b.orderNumber ?? "\uffff", undefined, {
          numeric: true,
        }) * factor
      default:
        return (a.createdAt - b.createdAt) * factor
    }
  })
}

/** Multi-line address block for the expanded detail panel. */
export function addressLines(address: RefundAddress) {
  if (!address.line1) return []

  const region = [address.city, address.state, address.postalCode].filter(Boolean).join(" ")

  return [address.line1, address.line2, region, address.country].filter(Boolean) as string[]
}

/** Single-line address, e.g. "12 King St W, Toronto ON M5H 1A1, CA". */
export function formatAddress(address: RefundAddress) {
  if (!address.line1) return null

  const street = [address.line1, address.line2].filter(Boolean).join(", ")
  const region = [address.city, [address.state, address.postalCode].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(" ")

  return [street, region, address.country].filter(Boolean).join(", ")
}

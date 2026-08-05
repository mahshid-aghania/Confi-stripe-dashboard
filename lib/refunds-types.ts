/**
 * Shared refund types and pure helpers. Deliberately free of "server-only" so
 * client components (table rendering, CSV export) can import them.
 */

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
  windowDays: number
  rangeStart: number
  generatedAt: number
  currency: string
  totalAmount: number
  count: number
  partialCount: number
  withReasonCount: number
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

/** Single-line address, e.g. "12 King St W, Toronto ON M5H 1A1, CA". */
export function formatAddress(address: RefundAddress) {
  if (!address.line1) return null

  const street = [address.line1, address.line2].filter(Boolean).join(", ")
  const region = [address.city, [address.state, address.postalCode].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(" ")

  return [street, region, address.country].filter(Boolean).join(", ")
}

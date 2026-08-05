import "server-only"

import Stripe from "stripe"

/**
 * Production ("main") Stripe account.
 *
 * STRIPE_LIVE_SECRET_KEY is a read-only restricted live key. It intentionally
 * lacks the Balance, Invoices, and Balance-transactions scopes, so any call to
 * those will throw StripePermissionError — callers must degrade gracefully
 * rather than assume the data is available.
 */
const liveKey = process.env.STRIPE_LIVE_SECRET_KEY

if (!liveKey) {
  throw new Error("STRIPE_LIVE_SECRET_KEY is not set")
}

export const stripe = new Stripe(liveKey)

export const isLiveMode = liveKey.includes("_live_")

/** True when Stripe rejected the call for lack of restricted-key scope. */
export function isPermissionError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    (error as { type?: string }).type === "StripePermissionError"
  )
}

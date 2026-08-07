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
const liveKey = process.env.STRIPE_LIVE_SECRET_KEY ?? ""

// Defer the guard to request time so Next.js can build without the key.
// The error will surface as a dashboard error card rather than a build crash.
function getStripe() {
  if (!liveKey) throw new Error("STRIPE_LIVE_SECRET_KEY is not set")
  return new Stripe(liveKey)
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe]
  },
})

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

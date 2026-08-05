import Stripe from 'stripe';

// Only instantiate Stripe on the server side when the key is available
export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

  return new Stripe(key, {
    apiVersion: '2026-07-29.dahlia',
  });
}

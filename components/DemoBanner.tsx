'use client';

export default function DemoBanner() {
  return (
    <div className="w-full bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-fade-in">
      <svg
        className="w-4 h-4 text-amber-500 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>
        <strong>Demo mode</strong> — no Stripe key configured. Showing sample data.{' '}
        <span className="text-amber-600">
          Set <code className="bg-amber-100 px-1 rounded text-amber-700">STRIPE_SECRET_KEY</code> in{' '}
          your environment to load real refunds.
        </span>
      </span>
    </div>
  );
}

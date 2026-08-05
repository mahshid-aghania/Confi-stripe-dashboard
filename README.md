# Confidentist — Stripe Refunds Dashboard

An interactive dashboard for viewing, searching, filtering, and exporting Stripe refunds from January 2026.

## Features

- **Summary cards** — Total refunded, count, average, and largest single refund
- **Daily activity chart** — Bar chart showing refund amounts by day in January 2026
- **Reason breakdown** — Horizontal bar chart grouped by refund reason
- **Sortable refunds table** — Sort by date, amount, status, reason, currency
- **Search & filters** — Filter by charge ID, customer email, description, status, or reason
- **CSV export** — Download current filtered results as a CSV file
- **Stripe Dashboard links** — Each row links directly to the refund in Stripe
- **Demo mode** — Shows realistic sample data when no Stripe key is configured

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Recharts (for bar charts)
- Stripe SDK (server-side only)
- Fonts: Fraunces (display) + Manrope (body) via Google Fonts

## Getting Started

### 1. Clone and install dependencies

```bash
git clone https://github.com/mahshid-aghania/Confi-stripe-dashboard.git
cd Confi-stripe-dashboard
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Stripe secret key:

```
STRIPE_SECRET_KEY=sk_test_your_key_here
```

> **Note:** If `STRIPE_SECRET_KEY` is not set, the app runs in **demo mode** with sample data and displays a banner.

### 3. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production

```bash
pnpm build
pnpm start
```

## Project Structure

```
├── app/
│   ├── api/refunds/route.ts   # API route — fetches from Stripe
│   ├── layout.tsx             # Root layout with fonts
│   ├── page.tsx               # Main dashboard page (server component)
│   └── globals.css            # Global styles + Tailwind
├── components/
│   ├── RefundsDashboard.tsx   # Main client component
│   ├── SummaryCards.tsx       # Summary stat cards
│   ├── DailyChart.tsx         # Daily bar chart
│   ├── ReasonChart.tsx        # Reason breakdown chart
│   ├── RefundsTable.tsx       # Sortable + filterable table
│   ├── CsvExportButton.tsx    # CSV download button
│   └── DemoBanner.tsx         # Demo mode banner
├── lib/
│   ├── types.ts               # TypeScript interfaces
│   ├── stripe.ts              # Stripe client initialization
│   ├── refunds-data.ts        # Data fetching + aggregation
│   ├── demo-data.ts           # Sample data (20 refunds)
│   └── format.ts              # Currency/date/status formatters
└── .env.example               # Environment variable template
```

## API Route

`GET /api/refunds` — Returns all refunds data as JSON, including summary stats, daily aggregates, and reason breakdown. Uses demo data if `STRIPE_SECRET_KEY` is not configured.

## Demo Mode

When no `STRIPE_SECRET_KEY` environment variable is set, the dashboard loads 20 realistic sample refunds spanning January 2026, with varied amounts ($10–$500), currencies (CAD/USD), statuses, and reasons. A banner at the top of the page indicates demo mode.

## Security

- The Stripe secret key is **never exposed to the client** — all Stripe calls are server-side only
- The `stripe` package is only imported in server-side files (`lib/stripe.ts`, `lib/refunds-data.ts`, `app/api/refunds/route.ts`)
- No secrets are hardcoded in source code

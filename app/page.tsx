import { ConsoleHeader } from "@/components/console-header"
import { MetricGrid } from "@/components/metric-grid"
import { PaymentsTable } from "@/components/payments-table"
import { RevenuePanel } from "@/components/revenue-panel"
import { TabNav } from "@/components/tab-nav"
import { getDashboardData } from "@/lib/dashboard-data"
import { type RangeParams, resolveRange } from "@/lib/date-range"

export const dynamic = "force-dynamic"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<RangeParams>
}) {
  const range = resolveRange(await searchParams)
  const data = await getDashboardData(range)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 md:px-8 md:py-14">
      <ConsoleHeader
        title="Revenue console"
        generatedAt={data.generatedAt}
        range={data.range}
        live={!data.isEmpty}
        basePath="/"
      />
      <TabNav />

      {data.error ? (
        <div role="alert" className="rounded-md border border-alert/40 bg-surface px-5 py-4">
          <p className="numeric text-[11px] uppercase tracking-[0.14em] text-alert">Stripe request failed</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{data.error}</p>
        </div>
      ) : null}

      <RevenuePanel data={data} />
      <MetricGrid data={data} />
      <PaymentsTable payments={data.payments} />

      <footer className="border-t border-border pt-6">
        <p className="numeric text-[11px] text-muted">
          Live data from the Stripe API · amounts in {data.currency.toUpperCase()} · timestamps in UTC
        </p>
      </footer>
    </main>
  )
}

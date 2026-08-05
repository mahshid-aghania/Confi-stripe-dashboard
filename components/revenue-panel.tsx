import { RevenueChart } from "@/components/revenue-chart"
import type { DashboardData } from "@/lib/dashboard-data"
import { formatCurrency, formatNumber } from "@/lib/format"

export function RevenuePanel({ data }: { data: DashboardData }) {
  const peak = data.series.reduce(
    (best, point) => (point.gross > best.gross ? point : best),
    data.series[0] ?? { date: 0, gross: 0, count: 0 },
  )
  const totalPayments = data.series.reduce((total, point) => total + point.count, 0)
  const dailyAverage = data.series.length > 0 ? Math.round(data.grossVolume.value / data.series.length) : 0

  return (
    <section aria-label="Revenue over time" className="rounded-md border border-border bg-surface">
      <div className="flex flex-col gap-4 border-b border-border px-5 py-5 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <h2 className="numeric text-[11px] uppercase tracking-[0.14em] text-muted">Gross volume · daily</h2>
          <p className="numeric text-3xl leading-none">{formatCurrency(data.grossVolume.value, data.currency)}</p>
        </div>

        <dl className="flex items-center gap-8">
          <div className="flex flex-col gap-1">
            <dt className="numeric text-[11px] uppercase tracking-[0.14em] text-muted">Daily avg</dt>
            <dd className="numeric text-sm">{formatCurrency(dailyAverage, data.currency)}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="numeric text-[11px] uppercase tracking-[0.14em] text-muted">Peak day</dt>
            <dd className="numeric text-sm">{formatCurrency(peak.gross, data.currency)}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="numeric text-[11px] uppercase tracking-[0.14em] text-muted">Payments</dt>
            <dd className="numeric text-sm">{formatNumber(totalPayments)}</dd>
          </div>
        </dl>
      </div>

      <div className="grid-texture px-2 py-5 md:px-4">
        <RevenueChart series={data.series} currency={data.currency} />
      </div>
    </section>
  )
}

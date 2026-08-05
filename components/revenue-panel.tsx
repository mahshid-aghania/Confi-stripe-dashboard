import { RevenueChart } from "@/components/revenue-chart"
import type { DashboardData } from "@/lib/dashboard-data"
import { formatCurrency, formatNumber, formatWindowLabel } from "@/lib/format"

export function RevenuePanel({ data }: { data: DashboardData }) {
  const { series } = data
  const peak = series.points.reduce((best, point) => (point.gross > best.gross ? point : best), {
    date: 0,
    gross: 0,
    count: 0,
  })

  // Averaged over buckets that actually carry volume, so a wide empty window
  // does not drag the number to near zero.
  const activeBuckets = series.points.filter((point) => point.count > 0).length
  const perBucketAverage = activeBuckets > 0 ? Math.round(series.total / activeBuckets) : 0

  return (
    <section aria-label="Revenue over time" className="rounded-md border border-border bg-surface">
      <div className="flex flex-col gap-4 border-b border-border px-5 py-5 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <h2 className="numeric text-[11px] uppercase tracking-[0.14em] text-muted">
            Gross volume · {formatWindowLabel(series.bucketSeconds, series.points.length)}
          </h2>
          <p className="numeric text-3xl leading-none">{formatCurrency(series.total, data.currency)}</p>
        </div>

        <dl className="flex items-center gap-8">
          <div className="flex flex-col gap-1">
            <dt className="numeric text-[11px] uppercase tracking-[0.14em] text-muted">Active avg</dt>
            <dd className="numeric text-sm">{formatCurrency(perBucketAverage, data.currency)}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="numeric text-[11px] uppercase tracking-[0.14em] text-muted">Peak</dt>
            <dd className="numeric text-sm">{formatCurrency(peak.gross, data.currency)}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="numeric text-[11px] uppercase tracking-[0.14em] text-muted">Payments</dt>
            <dd className="numeric text-sm">{formatNumber(series.count)}</dd>
          </div>
        </dl>
      </div>

      <div className="grid-texture px-2 py-5 md:px-4">
        <RevenueChart series={series} currency={data.currency} />
      </div>
    </section>
  )
}

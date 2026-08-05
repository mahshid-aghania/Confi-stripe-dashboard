import { RevenueChart } from "@/components/revenue-chart"
import type { DashboardData } from "@/lib/dashboard-data"
import {
  formatBucketLabel,
  formatCurrency,
  formatDelta,
  formatGranularity,
  formatNumber,
  formatRangeSpan,
} from "@/lib/format"

/** "hourly" -> "hour", so the stat label reads "Avg / day" not "Avg / dai". */
const BUCKET_NOUN = {
  hourly: "hour",
  daily: "day",
  weekly: "week",
  monthly: "month",
} as const

export function RevenuePanel({ data }: { data: DashboardData }) {
  const { series, currency, range } = data
  const delta = formatDelta(series.total, series.previousTotal)
  const showComparison = series.previousTotal > 0

  // Averaged over buckets that actually carry volume, so a wide empty window
  // does not drag the number to near zero.
  const activeBuckets = series.points.filter((point) => point.count > 0).length
  const perBucketAverage = activeBuckets > 0 ? Math.round(series.total / activeBuckets) : 0

  const stats = [
    {
      label: `Avg / ${BUCKET_NOUN[formatGranularity(series.bucketSeconds)]}`,
      value: formatCurrency(perBucketAverage, currency),
    },
    {
      label: "Peak",
      value: series.peak ? formatCurrency(series.peak.gross, currency) : "—",
      hint: series.peak ? formatBucketLabel(series.peak.date, series.bucketSeconds) : null,
    },
    { label: "Payments", value: formatNumber(series.count) },
  ]

  return (
    <section aria-label="Revenue over time" className="rounded-md border border-border bg-surface">
      <div className="flex flex-col gap-5 border-b border-border px-5 py-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="numeric text-[11px] uppercase tracking-[0.14em] text-muted">
            Gross volume · {formatRangeSpan(range.start, range.end)}
          </h2>

          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="numeric text-4xl leading-none tracking-tight">
              {formatCurrency(series.total, currency)}
            </p>
            <span
              className={`numeric text-sm ${
                delta.direction === "up" ? "text-signal" : delta.direction === "down" ? "text-alert" : "text-muted"
              }`}
            >
              {delta.label}
            </span>
          </div>

          {showComparison ? (
            <p className="numeric text-[11px] text-muted">
              vs {formatCurrency(series.previousTotal, currency)} in the prior {range.days}d
            </p>
          ) : null}
        </div>

        <dl className="flex flex-wrap items-start gap-x-8 gap-y-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
              <dt className="numeric text-[11px] uppercase tracking-[0.14em] text-muted">{stat.label}</dt>
              <dd className="numeric text-sm">{stat.value}</dd>
              {stat.hint ? <dd className="numeric text-[10px] text-muted">{stat.hint}</dd> : null}
            </div>
          ))}
        </dl>
      </div>

      <div className="grid-texture px-2 py-5 md:px-4">
        <RevenueChart series={series} currency={currency} showComparison={showComparison} />
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-5 py-3">
        <Legend color="bg-signal" label={`This period · ${formatGranularity(series.bucketSeconds)}`} />
        {showComparison ? <Legend dashed label={`Prior ${range.days}d`} /> : null}
      </div>
    </section>
  )
}

function Legend({ color, dashed, label }: { color?: string; dashed?: boolean; label: string }) {
  return (
    <span className="flex items-center gap-2">
      {dashed ? (
        <span aria-hidden="true" className="h-px w-4 border-t border-dashed border-muted" />
      ) : (
        <span aria-hidden="true" className={`h-0.5 w-4 rounded-full ${color}`} />
      )}
      <span className="numeric text-[10px] uppercase tracking-[0.14em] text-muted">{label}</span>
    </span>
  )
}

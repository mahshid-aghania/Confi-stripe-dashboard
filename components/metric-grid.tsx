import type { DashboardData } from "@/lib/dashboard-data"
import { formatCurrency, formatDelta, formatNumber, formatPercent } from "@/lib/format"

type Cell = {
  label: string
  value: string
  hint: string
  delta?: ReturnType<typeof formatDelta>
}

export function MetricGrid({ data }: { data: DashboardData }) {
  const { currency, range } = data

  const cells: Cell[] = [
    {
      label: "Gross volume",
      value: formatCurrency(data.grossVolume.value, currency),
      hint: `${formatNumber(data.successfulPayments.value)} succeeded payments`,
      delta: formatDelta(data.grossVolume.value, data.grossVolume.previous),
    },
    {
      label: "Net volume",
      value: formatCurrency(data.netVolume.value, currency),
      // The restricted live key has no Balance scope, so only surface the
      // balance when it actually resolved.
      hint:
        data.availableBalance !== null
          ? `${formatCurrency(data.availableBalance, currency)} available now`
          : "After Stripe fees and refunds",
      delta: formatDelta(data.netVolume.value, data.netVolume.previous),
    },
    {
      label: "Avg order value",
      value: data.successfulPayments.value === 0 ? "—" : formatCurrency(data.averageOrderValue.value, currency),
      hint: `Across ${formatNumber(data.successfulPayments.value)} payments`,
      delta: formatDelta(data.averageOrderValue.value, data.averageOrderValue.previous),
    },
    {
      label: "Authorization rate",
      value: data.isEmpty ? "—" : formatPercent(data.successRate),
      hint:
        data.refundedVolume.value > 0
          ? `${formatCurrency(data.refundedVolume.value, currency)} refunded`
          : "No refunds in range",
    },
  ]

  return (
    <section
      aria-label="Key metrics"
      className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
    >
      {cells.map((cell) => (
        <article key={cell.label} className="flex flex-col gap-3 bg-surface px-5 py-6">
          <h2 className="numeric text-[11px] uppercase tracking-[0.14em] text-muted">{cell.label}</h2>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="numeric text-2xl leading-none">{cell.value}</p>
            {cell.delta ? (
              <span
                className={`numeric text-xs ${
                  cell.delta.direction === "up"
                    ? "text-signal"
                    : cell.delta.direction === "down"
                      ? "text-alert"
                      : "text-muted"
                }`}
                title={`vs prior ${range.days} days`}
              >
                {cell.delta.label}
              </span>
            ) : null}
          </div>

          <p className="text-xs leading-relaxed text-muted">{cell.hint}</p>
        </article>
      ))}
    </section>
  )
}

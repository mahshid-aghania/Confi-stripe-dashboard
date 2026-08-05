import type { DashboardData } from "@/lib/dashboard-data"
import { formatCurrency, formatDelta, formatNumber, formatPercent } from "@/lib/format"

type Cell = {
  label: string
  value: string
  hint: string
  delta?: ReturnType<typeof formatDelta>
}

export function MetricGrid({ data }: { data: DashboardData }) {
  const { currency } = data

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
      hint: "After Stripe fees and refunds",
      delta: formatDelta(data.netVolume.value, data.netVolume.previous),
    },
    // The read-only restricted live key has no Balance scope, so fall back to
    // refunded volume — which is computable from charges — instead of a blank card.
    data.availableBalance !== null
      ? {
          label: "Available balance",
          value: formatCurrency(data.availableBalance, currency),
          hint: `${formatCurrency(data.pendingBalance ?? 0, currency)} pending`,
        }
      : {
          label: "Refunded volume",
          value: formatCurrency(data.refundedVolume.value, currency),
          hint: "Balance scope not enabled on key",
          delta: formatDelta(data.refundedVolume.value, data.refundedVolume.previous),
        },
    {
      label: "Authorization rate",
      value: data.isEmpty ? "—" : formatPercent(data.successRate),
      hint: data.refundedVolume.value > 0 ? `${formatCurrency(data.refundedVolume.value, currency)} refunded` : "No refunds",
    },
  ]

  return (
    <section aria-label="Key metrics" className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
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

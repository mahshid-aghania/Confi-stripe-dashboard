import { formatCurrency, formatNumber, formatPercent, formatRefundReason } from "@/lib/format"
import type { RefundsReport } from "@/lib/refunds-types"

export function RefundsSummary({ report }: { report: RefundsReport }) {
  const stats = [
    { label: "Refunds issued", value: formatNumber(report.count), hint: `${formatNumber(report.uniqueCustomers)} customers` },
    {
      label: "Total refunded",
      value: formatCurrency(report.totalAmount, report.currency),
      hint: `${formatNumber(report.partialCount)} partial`,
    },
    {
      // Share of gross volume is the number that says whether refunds are a problem.
      label: "Refund rate",
      value:
        report.grossVolume && report.grossVolume > 0
          ? formatPercent(report.totalAmount / report.grossVolume)
          : "—",
      hint:
        report.grossVolume && report.grossVolume > 0
          ? `of ${formatCurrency(report.grossVolume, report.currency)} gross`
          : "Gross volume unavailable",
    },
    {
      label: "Average refund",
      value:
        report.count === 0
          ? "—"
          : formatCurrency(Math.round(report.totalAmount / report.count), report.currency),
      hint: report.count === 0 ? "No refunds" : `across ${formatNumber(report.count)} refunds`,
    },
  ]

  return (
    <section aria-label="Refund summary" className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-2 bg-surface px-5 py-4">
            <p className="numeric text-[11px] uppercase tracking-[0.14em] text-muted">{stat.label}</p>
            <p className="numeric text-xl tracking-tight">{stat.value}</p>
            <p className="numeric text-[11px] text-muted">{stat.hint}</p>
          </div>
        ))}
      </div>

      {report.reasonBreakdown.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <p className="numeric text-[11px] uppercase tracking-[0.14em] text-muted">Reason breakdown</p>
          {report.reasonBreakdown.map((entry) => (
            <p key={entry.reason} className="numeric text-[12px]">
              <span className={entry.reason === "unspecified" ? "text-muted" : "text-foreground"}>
                {formatRefundReason(entry.reason === "unspecified" ? null : entry.reason)}
              </span>
              <span className="ml-1.5 text-muted">
                {formatNumber(entry.count)} · {formatCurrency(entry.amount, report.currency)}
              </span>
            </p>
          ))}
        </div>
      ) : null}
    </section>
  )
}

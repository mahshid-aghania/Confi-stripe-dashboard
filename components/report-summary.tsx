import { formatCurrency, formatNumber, formatPercent } from "@/lib/format"
import type { ReportData } from "@/lib/report-data"

/**
 * Headline figures for the period. Gross leads at display size because it is
 * the number the report exists to answer; the rest sit as supporting detail.
 */
export function ReportSummary({ data }: { data: ReportData }) {
  const { totals, currency, months, best, worst } = data

  const supporting: { label: string; value: string; hint?: string }[] = [
    { label: "Excl. Tax", value: formatCurrency(totals.grossExTax, currency), hint: `tax ${formatCurrency(totals.tax, currency)}` },
    { label: "Net", value: formatCurrency(totals.net, currency), hint: "gross − fees − refunds" },
    { label: "Stripe fees", value: formatCurrency(totals.fees, currency) },
    {
      label: "Refunded",
      value: formatCurrency(totals.refunded, currency),
      hint: `${formatPercent(totals.refundRate)} of gross`,
    },
    { label: "Payments", value: formatNumber(totals.payments) },
    { label: "Customers", value: formatNumber(totals.uniqueCustomers), hint: "unique by email" },
    { label: "Avg order", value: formatCurrency(totals.averageOrder, currency) },
    {
      label: "Monthly avg",
      value: formatCurrency(totals.monthlyAverage, currency),
      hint: `over ${months.length} ${months.length === 1 ? "month" : "months"}`,
    },
    {
      label: "Success rate",
      value: formatPercent(totals.successRate),
      hint: `${formatNumber(totals.failedCount)} failed`,
    },
  ]

  return (
    <section aria-label="Period summary" className="flex flex-col gap-5">
      <div className="flex flex-col gap-6 rounded-md border border-border bg-surface p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="flex flex-col gap-1.5">
          <p className="numeric text-[11px] uppercase tracking-[0.16em] text-muted">
            Gross revenue (incl. tax) · {months.length} {months.length === 1 ? "month" : "months"}
          </p>
          <p className="numeric text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            {formatCurrency(totals.gross, currency)}
          </p>
        </div>

        <dl className="flex flex-wrap gap-x-8 gap-y-4">
          {best ? (
            <Extreme label="Best month" row={best.label} value={formatCurrency(best.gross, currency)} tone="up" />
          ) : null}
          {worst && best && worst.key !== best.key ? (
            <Extreme
              label="Weakest month"
              row={worst.label}
              value={formatCurrency(worst.gross, currency)}
              tone="down"
            />
          ) : null}
        </dl>
      </div>

      {/* Eight cells across two or four columns, so the grid never leaves a
          hole where the border colour would show through. */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4">
        {supporting.map((item) => (
          <div key={item.label} className="flex flex-col gap-1 bg-surface px-4 py-3.5">
            <dt className="numeric text-[10px] uppercase tracking-[0.16em] text-muted">{item.label}</dt>
            <dd className="numeric text-base text-foreground">{item.value}</dd>
            {item.hint ? <p className="numeric text-[10px] text-muted">{item.hint}</p> : null}
          </div>
        ))}
      </dl>
    </section>
  )
}

function Extreme({
  label,
  row,
  value,
  tone,
}: {
  label: string
  row: string
  value: string
  tone: "up" | "down"
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="numeric text-[10px] uppercase tracking-[0.16em] text-muted">{label}</dt>
      <dd className="flex items-baseline gap-2">
        <span className={`numeric text-sm ${tone === "up" ? "text-signal" : "text-muted"}`}>{row}</span>
        <span className="numeric text-sm text-foreground">{value}</span>
      </dd>
    </div>
  )
}

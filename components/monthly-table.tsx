import { formatCurrency, formatNumber, formatPercent } from "@/lib/format"
import type { MonthRow, ReportData } from "@/lib/report-data"

const COLUMNS = [
  { key: "month",      label: "Month",      align: "left"  as const },
  { key: "gross",      label: "Gross",      align: "right" as const },
  { key: "tax",        label: "Tax",        align: "right" as const },
  { key: "exTax",      label: "Excl. Tax",  align: "right" as const },
  { key: "mom",        label: "MoM",        align: "right" as const },
  { key: "fees",       label: "Fees",       align: "right" as const },
  { key: "refunded",   label: "Refunded",   align: "right" as const },
  { key: "net",        label: "Net",        align: "right" as const },
  { key: "payments",   label: "Txns",       align: "right" as const },
  { key: "aov",        label: "AOV",        align: "right" as const },
]

/** Month-by-month breakdown with a totals row that ties back to the summary. */
export function MonthlyTable({ data }: { data: ReportData }) {
  const { months, totals, currency } = data
  const hasPartial = months.some((month) => month.partial)

  return (
    <section aria-label="Monthly breakdown" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="numeric text-[11px] uppercase tracking-[0.16em] text-muted">Monthly breakdown</h2>
        <p className="numeric text-[10px] text-muted">Refunds are attributed to the month of the original charge</p>
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border">
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`numeric px-2.5 py-3 text-[10px] font-normal uppercase tracking-[0.16em] text-muted ${
                    column.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {months.map((month) => (
              <tr key={month.key} className="border-b border-border/60 last:border-b-0">
                <th scope="row" className="whitespace-nowrap px-3 py-3 text-left font-normal">
                  <span className="numeric text-sm text-foreground">{month.label}</span>
                  {month.partial ? (
                    <span className="numeric ml-2 text-[10px] uppercase tracking-[0.12em] text-warn">
                      {month.days}d
                    </span>
                  ) : null}
                </th>
                <Cell>{formatCurrency(month.gross, currency)}</Cell>
                <Cell muted>{formatCurrency(month.tax, currency)}</Cell>
                <Cell>{formatCurrency(month.grossExTax, currency)}</Cell>
                <td className="px-3 py-3 text-right">
                  <MomBadge row={month} />
                </td>
                <Cell muted>{formatCurrency(month.fees, currency)}</Cell>
                <Cell tone={month.refunded > 0 ? "warn" : "muted"}>
                  {formatCurrency(month.refunded, currency)}
                </Cell>
                <Cell>{formatCurrency(month.net, currency)}</Cell>
                <Cell muted>{formatNumber(month.payments)}</Cell>
                <Cell muted>{formatCurrency(month.averageOrder, currency)}</Cell>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="border-t border-border bg-surface-raised">
              <th scope="row" className="numeric px-3 py-3 text-left text-xs uppercase tracking-[0.14em] text-muted">
                Total
              </th>
              <Cell strong>{formatCurrency(totals.gross, currency)}</Cell>
              <Cell muted>{formatCurrency(totals.tax, currency)}</Cell>
              <Cell strong>{formatCurrency(totals.grossExTax, currency)}</Cell>
              <td />
              <Cell muted>{formatCurrency(totals.fees, currency)}</Cell>
              <Cell muted>{formatCurrency(totals.refunded, currency)}</Cell>
              <Cell strong>{formatCurrency(totals.net, currency)}</Cell>
              <Cell muted>{formatNumber(totals.payments)}</Cell>
              <Cell muted>{formatCurrency(totals.averageOrder, currency)}</Cell>
            </tr>
          </tfoot>
        </table>
      </div>

      {hasPartial ? (
        <p className="numeric text-[10px] text-warn">
          Months marked with a day count are clipped by the selected range, so their totals are not full months.
        </p>
      ) : null}
    </section>
  )
}

function Cell({
  children,
  muted,
  strong,
  tone,
}: {
  children: React.ReactNode
  muted?: boolean
  strong?: boolean
  tone?: "warn" | "muted"
}) {
  const color = tone === "warn" ? "text-warn" : tone === "muted" || muted ? "text-muted" : "text-foreground"

  return (
    <td className={`numeric px-2.5 py-3 text-right text-sm ${color} ${strong ? "text-foreground" : ""}`}>
      {children}
    </td>
  )
}

function MomBadge({ row }: { row: MonthRow }) {
  if (row.momRatio === null) {
    return <span className="numeric text-sm text-muted">—</span>
  }

  const up = row.momRatio > 0.0005
  const down = row.momRatio < -0.0005
  const color = up ? "text-signal" : down ? "text-alert" : "text-muted"

  return (
    <span className={`numeric inline-flex items-center gap-1 text-sm ${color}`}>
      <span aria-hidden="true">{up ? "▲" : down ? "▼" : "•"}</span>
      {formatPercent(row.momRatio)}
    </span>
  )
}

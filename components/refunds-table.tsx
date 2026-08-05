import { formatCurrency, formatDate, formatRefundReason } from "@/lib/format"
import { formatAddress, type RefundRow } from "@/lib/refunds-types"

const STATUS_TONE: Record<string, string> = {
  succeeded: "text-signal",
  pending: "text-warn",
  failed: "text-alert",
  canceled: "text-muted",
}

function Empty() {
  return <span className="text-muted">&mdash;</span>
}

export function RefundsTable({ rows }: { rows: RefundRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface px-5 py-10 text-center">
        <p className="text-sm text-muted">No refunds were issued in this window.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse text-left">
          <caption className="sr-only">
            Refunds issued in the reporting window, including customer, amount, reason, and address.
          </caption>
          <thead>
            <tr className="border-b border-border bg-surface">
              {[
                "Order",
                "First name",
                "Family name",
                "Email",
                "Refund date",
                "Amount",
                "Reason",
                "Address",
                "Status",
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="numeric whitespace-nowrap px-4 py-3 text-[11px] font-normal uppercase tracking-[0.14em] text-muted"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const address = formatAddress(row.address)

              return (
                <tr key={row.id} className="border-b border-border/60 last:border-0 hover:bg-surface/60">
                  <td className="numeric whitespace-nowrap px-4 py-3 text-[13px]">
                    {row.orderNumber ?? <Empty />}
                  </td>
                  <td className="px-4 py-3 text-[13px]">{row.firstName ?? <Empty />}</td>
                  <td className="px-4 py-3 text-[13px]">{row.lastName ?? <Empty />}</td>
                  <td className="px-4 py-3 text-[13px] text-muted">
                    {row.email ? (
                      <span className="block max-w-[190px] truncate" title={row.email}>
                        {row.email}
                      </span>
                    ) : (
                      <Empty />
                    )}
                  </td>
                  <td className="numeric whitespace-nowrap px-4 py-3 text-[13px] text-muted">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="numeric whitespace-nowrap px-4 py-3 text-[13px]">
                    {formatCurrency(row.amount, row.currency)}
                    {row.isPartial && row.chargeAmount !== null ? (
                      <span className="ml-1.5 text-[11px] text-warn">
                        partial of {formatCurrency(row.chargeAmount, row.currency)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[13px]">
                    <span className={row.reason ? undefined : "text-muted"}>
                      {formatRefundReason(row.reason)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-muted">
                    {address ? (
                      <span className="block max-w-[240px] truncate" title={`${address} (from ${row.address.source})`}>
                        {address}
                      </span>
                    ) : (
                      <Empty />
                    )}
                  </td>
                  <td className="numeric whitespace-nowrap px-4 py-3 text-[12px]">
                    <span className={STATUS_TONE[row.status] ?? "text-muted"}>{row.status}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

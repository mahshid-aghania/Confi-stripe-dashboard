import type { PaymentRow } from "@/lib/dashboard-data"
import { formatCurrency, formatTimestamp } from "@/lib/format"

function statusLabel(payment: PaymentRow) {
  if (payment.disputed) return { text: "disputed", tone: "alert" as const }
  if (payment.refunded) return { text: "refunded", tone: "muted" as const }
  if (payment.status === "succeeded") return { text: "succeeded", tone: "signal" as const }
  if (payment.status === "failed") return { text: "failed", tone: "alert" as const }
  return { text: payment.status, tone: "muted" as const }
}

const toneClass = {
  signal: "border-signal/35 text-signal",
  alert: "border-alert/35 text-alert",
  muted: "border-border text-muted",
}

export function PaymentsTable({ payments }: { payments: PaymentRow[] }) {
  return (
    <section aria-label="Recent payments" className="rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-5">
        <h2 className="numeric text-[11px] uppercase tracking-[0.14em] text-muted">Recent payments</h2>
        <p className="numeric text-[11px] text-muted">{payments.length} shown</p>
      </div>

      {payments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
          <p className="text-sm text-foreground">No payments yet</p>
          <p className="max-w-sm text-xs leading-relaxed text-muted">
            This console reads directly from your Stripe account. Charges will appear here within seconds of being
            created.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                {["Amount", "Status", "Customer", "Method", "Date"].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="numeric px-5 py-3 text-[11px] font-normal uppercase tracking-[0.14em] text-muted"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const status = statusLabel(payment)

                return (
                  <tr key={payment.id} className="border-b border-border last:border-b-0">
                    <td className="numeric px-5 py-3.5 text-sm">{formatCurrency(payment.amount, payment.currency)}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`numeric inline-flex rounded-sm border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] ${toneClass[status.tone]}`}
                      >
                        {status.text}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate px-5 py-3.5 text-sm text-foreground">
                      {payment.customerLabel}
                    </td>
                    <td className="numeric px-5 py-3.5 text-sm text-muted">
                      {payment.brand ? `${payment.brand} ···· ${payment.last4 ?? "----"}` : "—"}
                    </td>
                    <td className="numeric px-5 py-3.5 text-sm text-muted">{formatTimestamp(payment.created)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

import { RefundsExport } from "@/components/refunds-export"
import { RefundsSummary } from "@/components/refunds-summary"
import { RefundsTable } from "@/components/refunds-table"
import { TabNav } from "@/components/tab-nav"
import { formatDate, formatTimestamp } from "@/lib/format"
import { getRefundsReport, REFUND_WINDOW_DAYS } from "@/lib/refunds-data"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Refund report · Confi",
  description: "Every refund issued in the trailing 30 days, from the live Stripe account.",
}

export default async function RefundsPage() {
  const report = await getRefundsReport(REFUND_WINDOW_DAYS)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 md:px-8 md:py-14">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" aria-hidden="true" />
            <p className="numeric text-[11px] uppercase tracking-[0.18em] text-muted">
              Stripe · production
            </p>
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-balance md:text-3xl">Refund report</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            Every refund issued between {formatDate(report.rangeStart)} and {formatDate(report.generatedAt)},
            resolved against the live Stripe account.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <TabNav />
          <div className="flex items-center gap-4 pb-0.5">
            <p className="numeric text-[11px] text-muted">Synced {formatTimestamp(report.generatedAt)} UTC</p>
            <RefundsExport rows={report.rows} windowDays={report.windowDays} />
          </div>
        </div>
      </header>

      {report.error ? (
        <div role="alert" className="rounded-md border border-alert/40 bg-surface px-5 py-4">
          <p className="numeric text-[11px] uppercase tracking-[0.14em] text-alert">Stripe request failed</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{report.error}</p>
        </div>
      ) : null}

      {report.truncated ? (
        <div role="status" className="rounded-md border border-warn/40 bg-surface px-5 py-4">
          <p className="numeric text-[11px] uppercase tracking-[0.14em] text-warn">Results truncated</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Showing the first 1,000 refunds in this window.
          </p>
        </div>
      ) : null}

      <RefundsSummary report={report} />
      <RefundsTable rows={report.rows} />

      <footer className="flex flex-col gap-2 border-t border-border pt-6">
        <p className="numeric text-[11px] leading-relaxed text-muted">
          Live production Stripe data · amounts in {report.currency.toUpperCase()} · dates in UTC
        </p>
        <p className="numeric text-[11px] leading-relaxed text-muted">
          Reason shows &quot;Not specified&quot; when the refund was issued without one. Addresses resolve from
          billing, then shipping, then the saved customer record.
        </p>
      </footer>
    </main>
  )
}

import { RefundsSummary } from "@/components/refunds-summary"
import { RefundsWorkspace } from "@/components/refunds-workspace"
import { TabNav } from "@/components/tab-nav"
import { WindowSelect, WINDOW_OPTIONS } from "@/components/window-select"
import { formatDate, formatTimestamp } from "@/lib/format"
import { getRefundsReport, REFUND_WINDOW_DAYS } from "@/lib/refunds-data"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Refund report · Confi",
  description: "Every refund issued on the live Stripe account, with full customer and payment detail.",
}

/** Only allow the presented windows, so the Stripe range can't be driven arbitrarily. */
function resolveWindow(value: string | string[] | undefined) {
  const parsed = Number(Array.isArray(value) ? value[0] : value)
  return WINDOW_OPTIONS.includes(parsed as (typeof WINDOW_OPTIONS)[number])
    ? parsed
    : REFUND_WINDOW_DAYS
}

export default async function RefundsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string | string[] }>
}) {
  const { days } = await searchParams
  const windowDays = resolveWindow(days)
  const report = await getRefundsReport(windowDays)

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
            resolved against the live Stripe account. Select any row for full payment and address detail.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <TabNav />
          <div className="flex items-center gap-3 pb-0.5">
            <p className="numeric hidden text-[11px] text-muted lg:block">
              Synced {formatTimestamp(report.generatedAt)} UTC
            </p>
            <WindowSelect active={report.windowDays} />
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
      <RefundsWorkspace report={report} />

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

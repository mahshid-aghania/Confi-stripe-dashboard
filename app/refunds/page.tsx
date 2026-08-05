import { ConsoleHeader } from "@/components/console-header"
import { RefundsSummary } from "@/components/refunds-summary"
import { RefundsWorkspace } from "@/components/refunds-workspace"
import { TabNav } from "@/components/tab-nav"
import { type RangeParams, resolveRange } from "@/lib/date-range"
import { getRefundsReport } from "@/lib/refunds-data"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Refund report · Confi",
  description: "Every refund issued on the live Stripe account, with full customer and payment detail.",
}

export default async function RefundsPage({
  searchParams,
}: {
  searchParams: Promise<RangeParams>
}) {
  const range = resolveRange(await searchParams)
  const report = await getRefundsReport(range)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 md:px-8 md:py-14">
      <ConsoleHeader
        title="Refund report"
        generatedAt={report.generatedAt}
        range={report.range}
        live={report.count > 0}
        basePath="/refunds"
      />
      <TabNav />

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
            Showing the first 1,000 refunds in this range.
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

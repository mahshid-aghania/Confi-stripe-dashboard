import { MonthRangePicker } from "@/components/month-range-picker"
import { MonthOverMonthChart, MonthlyRevenueChart, StackedRevenueChart } from "@/components/monthly-charts"
import { MonthlyTable } from "@/components/monthly-table"
import { ReportExport } from "@/components/report-export"
import { ReportSummary } from "@/components/report-summary"
import { TabNav } from "@/components/tab-nav"
import {
  type RangeParams,
  monthChoices,
  resolveRange,
  utcMonthKey,
} from "@/lib/date-range"
import { formatRangeSpan, formatTimestamp } from "@/lib/format"
import { getReportData } from "@/lib/report-data"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Revenue report · ConfiDentist",
  description: "Month-over-month revenue reporting from live Stripe data.",
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<RangeParams>
}) {
  const params = await searchParams
  // A monthly report defaults to the year so far rather than a 30-day window.
  const range = resolveRange(
    params.from || params.to || params.preset ? params : { preset: "ytd" },
  )
  const data = await getReportData(range)

  const choices = monthChoices()
  const lastMonthKey = utcMonthKey(range.end - 86_400)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 md:px-8 md:py-14">
      <header className="flex flex-col gap-6 border-b border-border pb-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span
                className={`h-1.5 w-1.5 rounded-full ${data.isEmpty ? "bg-muted" : "bg-signal"}`}
                aria-hidden="true"
              />
              <p className="numeric text-[11px] uppercase tracking-[0.18em] text-muted">
                {data.isEmpty ? "Stripe · no activity" : "Stripe · live"}
              </p>
            </div>
            <h1 className="text-2xl font-medium tracking-tight text-balance md:text-3xl">Revenue report</h1>
            <p className="numeric text-xs text-muted">
              {formatRangeSpan(range.start, range.end)} · {data.months.length}{" "}
              {data.months.length === 1 ? "month" : "months"} · synced {formatTimestamp(data.generatedAt)} UTC
            </p>
          </div>

          {/* Controls are screen-only; the printed page states its period in the
              header text above, so nothing is lost. */}
          <div className="flex flex-col items-start gap-3 print:hidden lg:items-end">
            <MonthRangePicker choices={choices} fromKey={utcMonthKey(range.start)} toKey={lastMonthKey} />
            <ReportExport data={data} />
          </div>
        </div>
      </header>

      <div className="print:hidden">
        <TabNav />
      </div>

      {data.error ? (
        <div role="alert" className="rounded-md border border-alert/40 bg-surface px-5 py-4">
          <p className="numeric text-[11px] uppercase tracking-[0.14em] text-alert">Stripe request failed</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{data.error}</p>
        </div>
      ) : null}

      {data.truncated ? (
        <div role="status" className="rounded-md border border-warn/40 bg-surface px-5 py-4">
          <p className="numeric text-[11px] uppercase tracking-[0.14em] text-warn">Partial data</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            This range exceeds the per-report charge limit, so totals understate actual revenue. Narrow the range
            for exact figures.
          </p>
        </div>
      ) : null}

      <ReportSummary data={data} />

      {/* Fancy stacked chart is the hero — shows net + refunds per month in colour */}
      <StackedRevenueChart months={data.months} currency={data.currency} />

      <div className="flex flex-col gap-6">
        <MonthlyRevenueChart months={data.months} currency={data.currency} />
        <MonthOverMonthChart months={data.months} currency={data.currency} />
      </div>

      <MonthlyTable data={data} />

      <footer className="border-t border-border pt-6">
        <p className="numeric text-[11px] leading-relaxed text-muted">
          Live data from the Stripe API · amounts in {data.currency.toUpperCase()} · calendar months in UTC ·
          all amounts exclude tax · net is gross less Stripe fees and refunds
        </p>
      </footer>
    </main>
  )
}

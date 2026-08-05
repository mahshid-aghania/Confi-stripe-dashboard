import { RangePicker } from "@/components/range-picker"
import type { DateRange } from "@/lib/date-range"
import { formatRangeSpan, formatTimestamp } from "@/lib/format"

type ConsoleHeaderProps = {
  generatedAt: number
  range: DateRange
  live: boolean
  basePath: string
  title: string
}

export function ConsoleHeader({ generatedAt, range, live, basePath, title }: ConsoleHeaderProps) {
  return (
    <header className="flex flex-col gap-6 border-b border-border pb-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span
              className={`h-1.5 w-1.5 rounded-full ${live ? "bg-signal" : "bg-muted"}`}
              aria-hidden="true"
            />
            <p className="numeric text-[11px] uppercase tracking-[0.18em] text-muted">
              {live ? "Stripe · live" : "Stripe · no activity"}
            </p>
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-balance md:text-3xl">{title}</h1>
          <p className="numeric text-xs text-muted">
            {formatRangeSpan(range.start, range.end)} · {range.days} {range.days === 1 ? "day" : "days"} ·
            synced {formatTimestamp(generatedAt)} UTC
          </p>
        </div>

        <RangePicker range={range} basePath={basePath} />
      </div>
    </header>
  )
}

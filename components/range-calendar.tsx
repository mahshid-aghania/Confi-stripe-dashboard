"use client"

import { useState } from "react"

import { DAY_SECONDS, fromISODate, startOfUtcDay, toISODate } from "@/lib/date-range"

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const

type MonthCursor = { year: number; month: number }

function monthStart({ year, month }: MonthCursor) {
  return Math.floor(Date.UTC(year, month, 1) / 1000)
}

function daysInMonth({ year, month }: MonthCursor) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

function shiftMonth(cursor: MonthCursor, delta: number): MonthCursor {
  const next = new Date(Date.UTC(cursor.year, cursor.month + delta, 1))
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() }
}

function monthLabel(cursor: MonthCursor) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    monthStart(cursor) * 1000,
  )
}

function cursorFor(unixSeconds: number): MonthCursor {
  const date = new Date(unixSeconds * 1000)
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() }
}

type RangeCalendarProps = {
  fromISO: string
  toISO: string
  onApply: (from: string, to: string) => void
  onCancel: () => void
}

export function RangeCalendar({ fromISO, toISO, onApply, onCancel }: RangeCalendarProps) {
  const today = startOfUtcDay(Math.floor(Date.now() / 1000))

  const [start, setStart] = useState<number | null>(fromISODate(fromISO))
  const [end, setEnd] = useState<number | null>(fromISODate(toISO))
  const [hovered, setHovered] = useState<number | null>(null)
  const [cursor, setCursor] = useState<MonthCursor>(cursorFor(fromISODate(toISO) ?? today))

  const atCurrentMonth = cursor.year === cursorFor(today).year && cursor.month === cursorFor(today).month

  // While picking the second date, preview the span under the cursor.
  const previewEnd = end ?? hovered
  const spanStart = start !== null && previewEnd !== null ? Math.min(start, previewEnd) : start
  const spanEnd = start !== null && previewEnd !== null ? Math.max(start, previewEnd) : start

  function select(day: number) {
    if (start === null || end !== null) {
      setStart(day)
      setEnd(null)
      return
    }
    setEnd(day)
  }

  const first = monthStart(cursor)
  const leading = new Date(first * 1000).getUTCDay()
  const total = daysInMonth(cursor)

  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: total }, (_, index) => first + index * DAY_SECONDS),
  ]

  const resolvedStart = spanStart !== null ? Math.min(spanStart, spanEnd ?? spanStart) : null
  const resolvedEnd = spanEnd !== null ? Math.max(spanStart ?? spanEnd, spanEnd) : null
  const canApply = start !== null && end !== null

  return (
    <div className="flex w-[19rem] flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(shiftMonth(cursor, -1))}
          aria-label="Previous month"
          className="numeric rounded border border-border px-2 py-1 text-xs text-muted transition-colors hover:border-signal hover:text-signal"
        >
          {"<"}
        </button>
        <p className="numeric text-[11px] uppercase tracking-[0.14em] text-foreground">{monthLabel(cursor)}</p>
        <button
          type="button"
          onClick={() => setCursor(shiftMonth(cursor, 1))}
          disabled={atCurrentMonth}
          aria-label="Next month"
          className="numeric rounded border border-border px-2 py-1 text-xs text-muted transition-colors hover:border-signal hover:text-signal disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted"
        >
          {">"}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAYS.map((day, index) => (
          <span
            key={`${day}-${index}`}
            aria-hidden="true"
            className="numeric py-1 text-center text-[10px] uppercase tracking-[0.1em] text-muted"
          >
            {day}
          </span>
        ))}

        {cells.map((day, index) => {
          if (day === null) return <span key={`pad-${index}`} />

          const future = day > today
          const isStart = day === resolvedStart
          const isEnd = day === resolvedEnd
          const inSpan =
            resolvedStart !== null && resolvedEnd !== null && day > resolvedStart && day < resolvedEnd
          const edge = isStart || isEnd

          return (
            <button
              key={day}
              type="button"
              disabled={future}
              onClick={() => select(day)}
              onMouseEnter={() => setHovered(day)}
              aria-label={toISODate(day)}
              aria-pressed={edge}
              className={`numeric h-8 text-xs transition-colors disabled:cursor-not-allowed disabled:text-muted/30 ${
                edge
                  ? "bg-signal font-medium text-background"
                  : inSpan
                    ? "bg-signal/15 text-foreground"
                    : "text-muted hover:bg-surface-raised hover:text-foreground"
              } ${isStart ? "rounded-l" : ""} ${isEnd ? "rounded-r" : ""}`}
            >
              {new Date(day * 1000).getUTCDate()}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <p className="numeric text-[10px] text-muted">
          {canApply
            ? `${toISODate(resolvedStart!)} → ${toISODate(resolvedEnd!)}`
            : start !== null
              ? "Pick an end date"
              : "Pick a start date"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="numeric px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canApply}
            onClick={() => onApply(toISODate(resolvedStart!), toISODate(resolvedEnd!))}
            className="numeric rounded border border-signal px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-signal transition-colors hover:bg-signal hover:text-background disabled:cursor-not-allowed disabled:border-border disabled:text-muted disabled:hover:bg-transparent"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"

import { RangeCalendar } from "@/components/range-calendar"
import { DEFAULT_PRESET, type DateRange, PRESETS, type PresetId } from "@/lib/date-range"

type RangePickerProps = {
  range: DateRange
  /** Route the selection applies to, e.g. "/" or "/refunds". */
  basePath: string
}

export function RangePicker({ range, basePath }: RangePickerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)

  // Dismiss the popover on outside click or Escape.
  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  function navigate(query: string) {
    startTransition(() => router.push(`${basePath}${query}`, { scroll: false }))
  }

  function selectPreset(preset: PresetId) {
    navigate(preset === DEFAULT_PRESET ? "" : `?preset=${preset}`)
  }

  return (
    <div ref={containerRef} className="relative flex flex-wrap items-center gap-2">
      <div
        role="group"
        aria-label="Reporting range"
        className={`flex items-center gap-px overflow-hidden rounded-md border border-border bg-border transition-opacity ${
          pending ? "opacity-60" : ""
        }`}
      >
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => selectPreset(preset.id)}
            aria-pressed={range.preset === preset.id}
            className={`numeric px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
              range.preset === preset.id
                ? "bg-surface-raised text-foreground"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`numeric flex items-center gap-2 rounded-md border px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
          range.preset === null
            ? "border-signal text-signal"
            : "border-border text-muted hover:border-signal hover:text-signal"
        }`}
      >
        <CalendarGlyph />
        {range.preset === null ? `${range.fromISO} → ${range.toISO}` : "Custom"}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Choose a date range"
          className="absolute right-0 top-full z-30 mt-2 rounded-md border border-border bg-surface shadow-xl shadow-background/60"
        >
          <RangeCalendar
            fromISO={range.fromISO}
            toISO={range.toISO}
            onCancel={() => setOpen(false)}
            onApply={(from, to) => {
              setOpen(false)
              navigate(`?from=${from}&to=${to}`)
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

function CalendarGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3.5" width="12" height="10.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 7h12M5.5 2v3M10.5 2v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

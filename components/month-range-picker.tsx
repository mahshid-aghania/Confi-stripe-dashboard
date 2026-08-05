"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { monthKeyToBounds } from "@/lib/date-range"

type MonthRangePickerProps = {
  choices: { value: string; label: string }[]
  /** Current selection, derived server-side from the resolved range. */
  fromKey: string
  toKey: string
}

/** "2019-01" -> "Jan 2019", for a month outside the rolling choice list. */
function labelForKey(key: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(key)
  if (!match) return key

  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, 1),
  )
}

/**
 * Month-granularity range control. A monthly report is almost always requested
 * in whole months ("January through July"), which takes two clicks here versus
 * seven months of back-navigation in the day calendar.
 */
export function MonthRangePicker({ choices, fromKey, toKey }: MonthRangePickerProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [from, setFrom] = useState(fromKey)
  const [to, setTo] = useState(toKey)

  // Re-sync when the resolved range changes underneath us — browser Back, or a
  // range carried in from another tab. Without this the dropdowns keep showing
  // a stale selection that no longer matches the report on screen.
  const [syncedKeys, setSyncedKeys] = useState(`${fromKey}|${toKey}`)
  if (syncedKeys !== `${fromKey}|${toKey}`) {
    setSyncedKeys(`${fromKey}|${toKey}`)
    setFrom(fromKey)
    setTo(toKey)
  }

  /*
   * A deep-linked range can predate the rolling choice list (e.g. ?from=2019-01).
   * A <select> silently falls back to its first option in that case, so the
   * control would contradict the report it is supposedly describing. Fold any
   * missing selection into the list to keep the two honest.
   */
  const options = [...choices]
  for (const key of [fromKey, toKey, from, to]) {
    if (!options.some((choice) => choice.value === key)) {
      options.push({ value: key, label: labelForKey(key) })
    }
  }
  options.sort((a, b) => b.value.localeCompare(a.value))

  const dirty = from !== fromKey || to !== toKey

  function apply() {
    const bounds = monthKeyToBounds(from, to)
    if (!bounds) return

    startTransition(() =>
      router.push(`/report?from=${bounds.fromISO}&to=${bounds.toISO}`, { scroll: false }),
    )
  }

  return (
    <div className={`flex flex-wrap items-end gap-3 transition-opacity ${pending ? "opacity-60" : ""}`}>
      <Field id="report-from" label="From" value={from} onChange={setFrom} choices={options} />
      <Field id="report-to" label="To" value={to} onChange={setTo} choices={options} />

      <button
        type="button"
        onClick={apply}
        disabled={!dirty || pending}
        className="numeric rounded-md border border-signal px-3.5 py-2 text-[11px] uppercase tracking-[0.14em] text-signal transition-colors hover:bg-signal hover:text-background disabled:cursor-not-allowed disabled:border-border disabled:text-muted disabled:hover:bg-transparent"
      >
        {pending ? "Loading" : "Run report"}
      </button>
    </div>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  choices,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  choices: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="numeric text-[10px] uppercase tracking-[0.16em] text-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="numeric rounded-md border border-border bg-surface px-3 py-2 text-xs text-foreground outline-none transition-colors hover:border-signal focus-visible:border-signal"
      >
        {choices.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
          </option>
        ))}
      </select>
    </div>
  )
}

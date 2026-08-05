import Link from "next/link"

export const WINDOW_OPTIONS = [7, 30, 90, 365] as const

export function WindowSelect({ active }: { active: number }) {
  return (
    <div
      role="group"
      aria-label="Reporting window"
      className="flex items-center gap-px overflow-hidden rounded-md border border-border bg-border"
    >
      {WINDOW_OPTIONS.map((days) => (
        <Link
          key={days}
          href={days === 30 ? "/refunds" : `/refunds?days=${days}`}
          aria-current={days === active ? "true" : undefined}
          className={`numeric px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
            days === active
              ? "bg-surface-raised text-foreground"
              : "bg-surface text-muted hover:text-foreground"
          }`}
        >
          {days === 365 ? "1y" : `${days}d`}
        </Link>
      ))}
    </div>
  )
}

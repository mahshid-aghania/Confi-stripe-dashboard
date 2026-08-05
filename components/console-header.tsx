import { formatTimestamp } from "@/lib/format"

type ConsoleHeaderProps = {
  generatedAt: number
  windowDays: number
  live: boolean
}

export function ConsoleHeader({ generatedAt, windowDays, live }: ConsoleHeaderProps) {
  return (
    <header className="flex flex-col gap-6 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
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
        <h1 className="text-2xl font-medium tracking-tight text-balance md:text-3xl">Revenue console</h1>
      </div>

      <dl className="flex items-center gap-8">
        <div className="flex flex-col gap-1">
          <dt className="numeric text-[11px] uppercase tracking-[0.14em] text-muted">Window</dt>
          <dd className="numeric text-sm">Last {windowDays}d</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="numeric text-[11px] uppercase tracking-[0.14em] text-muted">Synced</dt>
          <dd className="numeric text-sm">{formatTimestamp(generatedAt)} UTC</dd>
        </div>
      </dl>
    </header>
  )
}

"use client"

import { useMemo, useState } from "react"

import { RefundsExport } from "@/components/refunds-export"
import { RefundsTable } from "@/components/refunds-table"
import { formatCurrency, formatNumber, formatRefundReason } from "@/lib/format"
import {
  matchesQuery,
  sortRows,
  type RefundKind,
  type RefundsReport,
  type SortDirection,
  type SortKey,
} from "@/lib/refunds-types"

const KINDS: { value: RefundKind; label: string }[] = [
  { value: "all", label: "All" },
  { value: "full", label: "Full" },
  { value: "partial", label: "Partial" },
]

export function RefundsWorkspace({ report }: { report: RefundsReport }) {
  const [query, setQuery] = useState("")
  const [kind, setKind] = useState<RefundKind>("all")
  const [reason, setReason] = useState<string>("all")
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const visible = useMemo(() => {
    const filtered = report.rows.filter((row) => {
      if (kind === "partial" && !row.isPartial) return false
      if (kind === "full" && row.isPartial) return false
      if (reason !== "all" && (row.reason ?? "unspecified") !== reason) return false
      return matchesQuery(row, query)
    })

    return sortRows(filtered, sortKey, sortDirection)
  }, [report.rows, query, kind, reason, sortKey, sortDirection])

  const visibleTotal = visible.reduce((sum, row) => sum + row.amount, 0)
  const filtering = visible.length !== report.rows.length

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    // Dates and amounts read best largest-first; names read best A–Z.
    setSortDirection(key === "name" || key === "order" ? "asc" : "desc")
  }

  return (
    <section aria-label="Refund records" className="flex flex-col gap-4">
      <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <label htmlFor="refund-search" className="sr-only">
              Search refunds
            </label>
            <input
              id="refund-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, order, address"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted focus:border-signal"
            />
          </div>

          <div
            role="group"
            aria-label="Refund type"
            className="flex items-center gap-px overflow-hidden rounded-md border border-border bg-border"
          >
            {KINDS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setKind(option.value)}
                aria-pressed={kind === option.value}
                className={`numeric px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                  kind === option.value
                    ? "bg-surface-raised text-foreground"
                    : "bg-surface text-muted hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {report.reasonBreakdown.length > 1 ? (
            <div>
              <label htmlFor="refund-reason" className="sr-only">
                Filter by reason
              </label>
              <select
                id="refund-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="numeric rounded-md border border-border bg-surface px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-foreground outline-none transition-colors focus:border-signal"
              >
                <option value="all">All reasons</option>
                {report.reasonBreakdown.map((entry) => (
                  <option key={entry.reason} value={entry.reason}>
                    {formatRefundReason(entry.reason === "unspecified" ? null : entry.reason)} (
                    {entry.count})
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <RefundsExport
          rows={visible}
          fromISO={report.range.fromISO}
          toISO={report.range.toISO}
          filtered={filtering}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <p className="numeric text-[11px] text-muted">
          Showing {formatNumber(visible.length)} of {formatNumber(report.rows.length)} refunds
          {" · "}
          <span className="text-foreground">{formatCurrency(visibleTotal, report.currency)}</span>
        </p>
        {filtering ? (
          <button
            type="button"
            onClick={() => {
              setQuery("")
              setKind("all")
              setReason("all")
            }}
            className="numeric text-[11px] uppercase tracking-[0.14em] text-signal transition-opacity hover:opacity-70"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <RefundsTable
        rows={visible}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        expandedId={expandedId}
        onToggle={(id) => setExpandedId((current) => (current === id ? null : id))}
      />
    </section>
  )
}

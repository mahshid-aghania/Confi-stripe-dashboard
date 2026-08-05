"use client"

import { Fragment } from "react"

import { formatCurrency, formatDate, formatRefundReason, formatTimestamp } from "@/lib/format"
import { addressLines, formatAddress, type RefundRow, type SortDirection, type SortKey } from "@/lib/refunds-types"

const STATUS_TONE: Record<string, string> = {
  succeeded: "text-signal",
  pending: "text-warn",
  failed: "text-alert",
  canceled: "text-muted",
}

const COLUMNS: { label: string; sort?: SortKey; align?: boolean }[] = [
  { label: "Order", sort: "order" },
  { label: "First name", sort: "name" },
  { label: "Family name" },
  { label: "Email" },
  { label: "Refund date", sort: "date" },
  { label: "Amount", sort: "amount" },
  { label: "Reason" },
  { label: "Address" },
  { label: "Status" },
]

function Empty() {
  return <span className="text-muted">&mdash;</span>
}

function SortArrow({ active, direction }: { active: boolean; direction: SortDirection }) {
  if (!active) return null
  return <span aria-hidden="true">{direction === "asc" ? " \u2191" : " \u2193"}</span>
}

/** Label/value pair inside the expanded detail panel. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="numeric text-[10px] uppercase tracking-[0.14em] text-muted">{label}</p>
      <div className="text-[13px] leading-relaxed">{children}</div>
    </div>
  )
}

export function RefundsTable({
  rows,
  sortKey,
  sortDirection,
  onSort,
  expandedId,
  onToggle,
}: {
  rows: RefundRow[]
  sortKey: SortKey
  sortDirection: SortDirection
  onSort: (key: SortKey) => void
  expandedId: string | null
  onToggle: (id: string) => void
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface px-5 py-10 text-center">
        <p className="text-sm text-muted">No refunds match the current filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <caption className="sr-only">
            Refunds issued in the reporting window. Select a row to see full payment and address detail.
          </caption>
          <thead>
            <tr className="border-b border-border bg-surface">
              {COLUMNS.map((column) => {
                const active = column.sort === sortKey

                return (
                  <th
                    key={column.label}
                    scope="col"
                    aria-sort={
                      active ? (sortDirection === "asc" ? "ascending" : "descending") : undefined
                    }
                    className="numeric whitespace-nowrap px-4 py-3 text-[11px] font-normal uppercase tracking-[0.14em] text-muted"
                  >
                    {column.sort ? (
                      <button
                        type="button"
                        onClick={() => onSort(column.sort as SortKey)}
                        className={`uppercase tracking-[0.14em] transition-colors hover:text-foreground ${
                          active ? "text-foreground" : ""
                        }`}
                      >
                        {column.label}
                        <SortArrow active={active} direction={sortDirection} />
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const address = formatAddress(row.address)
              const expanded = expandedId === row.id

              return (
                <Fragment key={row.id}>
                  <tr
                    onClick={() => onToggle(row.id)}
                    aria-expanded={expanded}
                    className={`cursor-pointer border-b border-border/60 transition-colors hover:bg-surface/60 ${
                      expanded ? "bg-surface/60" : ""
                    }`}
                  >
                    <td className="numeric whitespace-nowrap px-4 py-3 text-[13px]">
                      {row.orderNumber ?? <Empty />}
                    </td>
                    <td className="px-4 py-3 text-[13px]">{row.firstName ?? <Empty />}</td>
                    <td className="px-4 py-3 text-[13px]">{row.lastName ?? <Empty />}</td>
                    <td className="px-4 py-3 text-[13px] text-muted">
                      {row.email ? (
                        <span className="block max-w-[150px] truncate" title={row.email}>
                          {row.email}
                        </span>
                      ) : (
                        <Empty />
                      )}
                    </td>
                    <td className="numeric whitespace-nowrap px-4 py-3 text-[13px] text-muted">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="numeric whitespace-nowrap px-4 py-3 text-[13px]">
                      {formatCurrency(row.amount, row.currency)}
                      {row.isPartial && row.chargeAmount !== null ? (
                        <span className="ml-1.5 text-[11px] text-warn">
                          of {formatCurrency(row.chargeAmount, row.currency)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-[13px]">
                      <span className={row.reason ? undefined : "text-muted"}>
                        {formatRefundReason(row.reason)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted">
                      {address ? (
                        <span className="block max-w-[170px] truncate" title={address}>
                          {address}
                        </span>
                      ) : (
                        <Empty />
                      )}
                    </td>
                    <td className="numeric whitespace-nowrap px-4 py-3 text-[12px]">
                      <span className={STATUS_TONE[row.status] ?? "text-muted"}>{row.status}</span>
                    </td>
                  </tr>

                  {expanded ? (
                    <tr className="border-b border-border/60 bg-surface-raised">
                      <td colSpan={COLUMNS.length} className="px-4 py-5">
                        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                          <Field label="Refunded at">
                            <span className="numeric">{formatTimestamp(row.createdAt)} UTC</span>
                          </Field>
                          <Field label="Refund type">
                            {row.isPartial ? (
                              <span className="text-warn">Partial refund</span>
                            ) : (
                              "Full refund"
                            )}
                          </Field>
                          <Field label="Card">
                            {row.cardBrand && row.cardLast4 ? (
                              <span className="numeric">
                                {row.cardBrand} &middot; &middot;&middot;&middot;&middot;{row.cardLast4}
                              </span>
                            ) : (
                              <Empty />
                            )}
                          </Field>
                          <Field label="Receipt number">
                            {row.receiptNumber ? (
                              <span className="numeric">{row.receiptNumber}</span>
                            ) : (
                              <Empty />
                            )}
                          </Field>

                          <Field label="Full name">{row.fullName ?? <Empty />}</Field>
                          <Field label="Email">
                            {row.email ? (
                              <a href={`mailto:${row.email}`} className="text-signal hover:underline">
                                {row.email}
                              </a>
                            ) : (
                              <Empty />
                            )}
                          </Field>
                          <Field label="Refund ID">
                            <span className="numeric break-all text-muted">{row.id}</span>
                          </Field>
                          <Field label="Payment ID">
                            {row.paymentId ? (
                              <span className="numeric break-all text-muted">{row.paymentId}</span>
                            ) : (
                              <Empty />
                            )}
                          </Field>

                          <div className="col-span-2">
                            <Field
                              label={
                                row.address.source
                                  ? `Address (from ${row.address.source})`
                                  : "Address"
                              }
                            >
                              {addressLines(row.address).length > 0 ? (
                                <address className="not-italic leading-relaxed">
                                  {addressLines(row.address).map((line) => (
                                    <span key={line} className="block">
                                      {line}
                                    </span>
                                  ))}
                                </address>
                              ) : (
                                <span className="text-muted">No address on record</span>
                              )}
                            </Field>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

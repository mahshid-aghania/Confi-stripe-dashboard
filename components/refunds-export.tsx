"use client"

import { formatAddress, type RefundRow } from "@/lib/refunds-types"

const HEADERS = [
  "Order number",
  "First name",
  "Family name",
  "Email",
  "Refund date (UTC)",
  "Refund amount",
  "Currency",
  "Original charge amount",
  "Partial refund",
  "Reason",
  "Status",
  "Address",
  "Address line 1",
  "Address line 2",
  "City",
  "State/Province",
  "Postal code",
  "Country",
  "Address source",
  "Card",
  "Payment ID",
  "Refund ID",
  "Receipt number",
]

/** RFC 4180 quoting: wrap in quotes and double any embedded quotes. */
function cell(value: string | number | null) {
  if (value === null || value === "") return ""
  return `"${String(value).replace(/"/g, '""')}"`
}

function minorToDecimal(minorAmount: number, currency: string) {
  const zeroDecimal = ["jpy", "krw", "vnd", "clp"].includes(currency.toLowerCase())
  return zeroDecimal ? String(minorAmount) : (minorAmount / 100).toFixed(2)
}

function toCsv(rows: RefundRow[]) {
  const lines = [HEADERS.map(cell).join(",")]

  for (const row of rows) {
    lines.push(
      [
        cell(row.orderNumber),
        cell(row.firstName),
        cell(row.lastName),
        cell(row.email),
        // ISO date keeps spreadsheets from re-interpreting the format.
        cell(new Date(row.createdAt * 1000).toISOString()),
        cell(minorToDecimal(row.amount, row.currency)),
        cell(row.currency.toUpperCase()),
        cell(row.chargeAmount === null ? null : minorToDecimal(row.chargeAmount, row.currency)),
        cell(row.isPartial ? "yes" : "no"),
        cell(row.reason ?? "Not specified"),
        cell(row.status),
        cell(formatAddress(row.address)),
        cell(row.address.line1),
        cell(row.address.line2),
        cell(row.address.city),
        cell(row.address.state),
        cell(row.address.postalCode),
        cell(row.address.country),
        cell(row.address.source),
        cell(row.cardBrand && row.cardLast4 ? `${row.cardBrand} ****${row.cardLast4}` : null),
        cell(row.paymentId),
        cell(row.id),
        cell(row.receiptNumber),
      ].join(","),
    )
  }

  return lines.join("\r\n")
}

export function RefundsExport({
  rows,
  windowDays,
  filtered = false,
}: {
  rows: RefundRow[]
  windowDays: number
  filtered?: boolean
}) {
  function download() {
    // BOM so Excel reads UTF-8 names and currency symbols correctly.
    const blob = new Blob([`\uFEFF${toCsv(rows)}`], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const stamp = new Date().toISOString().slice(0, 10)

    link.href = url
    link.download = `refunds-${filtered ? "filtered" : `last-${windowDays}d`}-${stamp}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={rows.length === 0}
      className="numeric shrink-0 rounded-md border border-border px-3.5 py-2 text-[11px] uppercase tracking-[0.14em] text-foreground transition-colors hover:border-signal hover:text-signal disabled:cursor-not-allowed disabled:text-muted disabled:hover:border-border"
    >
      {filtered ? `Export ${rows.length} rows` : "Export CSV"}
    </button>
  )
}

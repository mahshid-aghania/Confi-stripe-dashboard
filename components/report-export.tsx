"use client"

import { useRef, useState } from "react"

import type { ReportData } from "@/lib/report-data"

/** RFC 4180 quoting: wrap in quotes and double any embedded quotes. */
function cell(value: string | number | null) {
  if (value === null || value === "") return ""
  return `"${String(value).replace(/"/g, '""')}"`
}

const ZERO_DECIMAL = new Set(["bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"])

function money(minorAmount: number, currency: string) {
  return ZERO_DECIMAL.has(currency.toLowerCase()) ? String(minorAmount) : (minorAmount / 100).toFixed(2)
}

function ratio(value: number | null) {
  return value === null ? "" : (value * 100).toFixed(2)
}

const HEADERS = [
  "Month", "Period start (UTC)", "Period end (UTC)", "Days counted", "Full month",
  "Gross revenue", "MoM change %", "MoM difference", "Stripe fees", "Refunded",
  "Net revenue", "Payments", "Refunded payments", "Failed payments",
  "Unique customers", "Average order value", "Average per day", "Cumulative gross", "Currency",
]

function toCsv(data: ReportData) {
  const { currency, range, totals, months } = data

  const lines = [
    [cell("ConfiDentist revenue report")].join(","),
    [cell("Period"), cell(`${range.fromISO} to ${range.toISO}`)].join(","),
    [cell("Months"), cell(months.length)].join(","),
    [cell("Generated (UTC)"), cell(new Date(data.generatedAt * 1000).toISOString())].join(","),
    [cell("Currency"), cell(currency.toUpperCase())].join(","),
    [cell("Gross revenue"), cell(money(totals.gross, currency))].join(","),
    [cell("Stripe fees"), cell(money(totals.fees, currency))].join(","),
    [cell("Refunded"), cell(money(totals.refunded, currency))].join(","),
    [cell("Net revenue"), cell(money(totals.net, currency))].join(","),
    [cell("Payments"), cell(totals.payments)].join(","),
    [cell("Unique customers"), cell(totals.uniqueCustomers)].join(","),
    [cell("Average order value"), cell(money(totals.averageOrder, currency))].join(","),
    [cell("Monthly average"), cell(money(totals.monthlyAverage, currency))].join(","),
    [cell("Refund rate %"), cell(ratio(totals.refundRate))].join(","),
    [cell("Success rate %"), cell(ratio(totals.successRate))].join(","),
    "",
    HEADERS.map(cell).join(","),
  ]

  for (const month of months) {
    lines.push(
      [
        cell(month.label),
        cell(new Date(month.start * 1000).toISOString().slice(0, 10)),
        cell(new Date((month.end - 86_400) * 1000).toISOString().slice(0, 10)),
        cell(month.days),
        cell(month.partial ? "no" : "yes"),
        cell(money(month.gross, currency)),
        cell(ratio(month.momRatio)),
        cell(month.momDelta === null ? "" : money(month.momDelta, currency)),
        cell(money(month.fees, currency)),
        cell(money(month.refunded, currency)),
        cell(money(month.net, currency)),
        cell(month.payments),
        cell(month.refundCount),
        cell(month.failedCount),
        cell(month.uniqueCustomers),
        cell(money(month.averageOrder, currency)),
        cell(money(month.dailyAverage, currency)),
        cell(money(month.cumulative, currency)),
        cell(currency.toUpperCase()),
      ].join(","),
    )
  }

  lines.push(
    [
      cell("TOTAL"), cell(range.fromISO), cell(range.toISO), cell(range.days), cell(""),
      cell(money(totals.gross, currency)), cell(""), cell(""),
      cell(money(totals.fees, currency)), cell(money(totals.refunded, currency)),
      cell(money(totals.net, currency)), cell(totals.payments),
      cell(totals.refundCount), cell(totals.failedCount), cell(totals.uniqueCustomers),
      cell(money(totals.averageOrder, currency)), cell(""),
      cell(money(totals.gross, currency)), cell(currency.toUpperCase()),
    ].join(","),
  )

  return lines.join("\r\n")
}

export function ReportExport({ data }: { data: ReportData }) {
  const [pdfState, setPdfState] = useState<"idle" | "generating" | "error">("idle")
  const disabled = data.months.length === 0

  function downloadCsv() {
    const blob = new Blob([`﻿${toCsv(data)}`], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `revenue-report-${data.range.fromISO}-to-${data.range.toISO}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async function downloadPdf() {
    if (pdfState === "generating") return
    setPdfState("generating")

    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ])

      // Switch to paper colours so the PDF is legible on white.
      document.documentElement.classList.add("printing")
      // One frame so the class repaints before capture.
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))

      const target = document.getElementById("report-pdf-target") ?? document.body

      const canvas = await html2canvas(target, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
        // Ignore the controls bar (MonthRangePicker / export buttons).
        ignoreElements: (el) => el.classList.contains("print:hidden"),
      })

      document.documentElement.classList.remove("printing")

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgH = (canvas.height * pageW) / canvas.width

      let remaining = imgH
      let yOffset = 0

      pdf.addImage(imgData, "PNG", 0, yOffset, pageW, imgH)
      remaining -= pageH

      while (remaining > 0) {
        yOffset -= pageH
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, yOffset, pageW, imgH)
        remaining -= pageH
      }

      pdf.save(`revenue-report-${data.range.fromISO}-to-${data.range.toISO}.pdf`)
      setPdfState("idle")
    } catch (err) {
      console.error("[pdf]", err)
      document.documentElement.classList.remove("printing")
      setPdfState("error")
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5 print:hidden lg:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={downloadCsv}
          disabled={disabled}
          className="numeric rounded-md border border-border px-3.5 py-2 text-[11px] uppercase tracking-[0.14em] text-foreground transition-colors hover:border-signal hover:text-signal disabled:cursor-not-allowed disabled:text-muted disabled:hover:border-border"
        >
          Export CSV
        </button>

        <button
          type="button"
          onClick={() => void downloadPdf()}
          disabled={disabled || pdfState === "generating"}
          className="numeric rounded-md border border-signal px-3.5 py-2 text-[11px] uppercase tracking-[0.14em] text-signal transition-colors hover:bg-signal hover:text-background disabled:cursor-not-allowed disabled:border-border disabled:text-muted disabled:hover:bg-transparent"
        >
          {pdfState === "generating" ? "Generating PDF…" : "Download PDF"}
        </button>
      </div>

      {pdfState === "error" ? (
        <p role="alert" className="numeric max-w-[16rem] text-[10px] leading-relaxed text-alert lg:text-right">
          PDF generation failed. Try again or use the browser print dialog.
        </p>
      ) : null}
    </div>
  )
}

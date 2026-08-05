'use client';

import type { RefundRecord } from '@/lib/types';
import { formatCurrency, formatDate, formatReason, formatStatus } from '@/lib/format';

interface CsvExportButtonProps {
  refunds: RefundRecord[];
  disabled?: boolean;
}

function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function CsvExportButton({ refunds, disabled }: CsvExportButtonProps) {
  const handleExport = () => {
    const headers = [
      'ID',
      'Date',
      'Amount',
      'Currency',
      'Status',
      'Reason',
      'Charge ID',
      'Customer Email',
      'Description',
    ];

    const rows = refunds.map((r) => [
      escapeCSV(r.id),
      escapeCSV(formatDate(r.created)),
      escapeCSV((r.amount / 100).toFixed(2)),
      escapeCSV(r.currency.toUpperCase()),
      escapeCSV(formatStatus(r.status)),
      escapeCSV(formatReason(r.reason)),
      escapeCSV(r.charge),
      escapeCSV(r.customerEmail),
      escapeCSV(r.description),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `refunds-jan-2026-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || refunds.length === 0}
      className="
        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
        bg-teal-500 text-white
        hover:bg-teal-600 active:bg-teal-700
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-150
        shadow-sm hover:shadow-md
      "
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      Export CSV ({refunds.length})
    </button>
  );
}

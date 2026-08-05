'use client';

import { useState, useMemo } from 'react';
import type { RefundRecord } from '@/lib/types';
import { formatCurrency, formatDate, formatReason, formatStatus } from '@/lib/format';
import CsvExportButton from './CsvExportButton';

interface RefundsTableProps {
  refunds: RefundRecord[];
}

type SortKey = 'created' | 'amount' | 'status' | 'reason' | 'currency';
type SortDir = 'asc' | 'desc';

const STATUS_COLORS: Record<string, string> = {
  succeeded: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-rose-100 text-rose-700',
  canceled: 'bg-slate-100 text-slate-600',
  requires_action: 'bg-purple-100 text-purple-700',
};

function SortIcon({ dir, active }: { dir: SortDir; active: boolean }) {
  if (!active) {
    return (
      <svg className="w-3 h-3 text-slate-300 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }
  return (
    <svg className="w-3 h-3 text-teal-500 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {dir === 'asc' ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      )}
    </svg>
  );
}

export default function RefundsTable({ refunds }: RefundsTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('created');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const uniqueStatuses = useMemo(
    () => Array.from(new Set(refunds.map((r) => r.status))).sort(),
    [refunds]
  );

  const uniqueReasons = useMemo(
    () => Array.from(new Set(refunds.map((r) => r.reason ?? 'not_specified'))).sort(),
    [refunds]
  );

  const filtered = useMemo(() => {
    let result = refunds;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          (r.charge?.toLowerCase().includes(q) ?? false) ||
          (r.customerEmail?.toLowerCase().includes(q) ?? false) ||
          (r.description?.toLowerCase().includes(q) ?? false)
      );
    }

    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter);
    }

    if (reasonFilter) {
      const rf = reasonFilter === 'not_specified' ? null : reasonFilter;
      result = result.filter((r) => r.reason === rf);
    }

    return [...result].sort((a, b) => {
      let aVal: string | number = 0;
      let bVal: string | number = 0;

      switch (sortKey) {
        case 'created':
          aVal = a.created;
          bVal = b.created;
          break;
        case 'amount':
          aVal = a.amount;
          bVal = b.amount;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'reason':
          aVal = a.reason ?? '';
          bVal = b.reason ?? '';
          break;
        case 'currency':
          aVal = a.currency;
          bVal = b.currency;
          break;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [refunds, search, statusFilter, reasonFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const thClass = 'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap';
  const sortableThClass = `${thClass} cursor-pointer select-none hover:text-teal-600 transition-colors`;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm animate-fade-in">
      {/* Controls */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search charge, email, description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 transition-colors placeholder:text-slate-400"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 transition-colors text-slate-700 bg-white"
          >
            <option value="">All statuses</option>
            {uniqueStatuses.map((s) => (
              <option key={s} value={s}>
                {formatStatus(s)}
              </option>
            ))}
          </select>

          {/* Reason filter */}
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 transition-colors text-slate-700 bg-white"
          >
            <option value="">All reasons</option>
            {uniqueReasons.map((r) => (
              <option key={r} value={r}>
                {formatReason(r === 'not_specified' ? null : r)}
              </option>
            ))}
          </select>
        </div>

        <CsvExportButton refunds={filtered} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th
                className={sortableThClass}
                onClick={() => handleSort('created')}
              >
                <span className="flex items-center">
                  Date
                  <SortIcon dir={sortDir} active={sortKey === 'created'} />
                </span>
              </th>
              <th
                className={sortableThClass}
                onClick={() => handleSort('amount')}
              >
                <span className="flex items-center">
                  Amount
                  <SortIcon dir={sortDir} active={sortKey === 'amount'} />
                </span>
              </th>
              <th
                className={sortableThClass}
                onClick={() => handleSort('currency')}
              >
                <span className="flex items-center">
                  Currency
                  <SortIcon dir={sortDir} active={sortKey === 'currency'} />
                </span>
              </th>
              <th
                className={sortableThClass}
                onClick={() => handleSort('status')}
              >
                <span className="flex items-center">
                  Status
                  <SortIcon dir={sortDir} active={sortKey === 'status'} />
                </span>
              </th>
              <th
                className={sortableThClass}
                onClick={() => handleSort('reason')}
              >
                <span className="flex items-center">
                  Reason
                  <SortIcon dir={sortDir} active={sortKey === 'reason'} />
                </span>
              </th>
              <th className={thClass}>Charge ID</th>
              <th className={thClass}>Customer</th>
              <th className={thClass}>Description</th>
              <th className={thClass}>Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-400 text-sm">
                  No refunds match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((refund) => (
                <tr
                  key={refund.id}
                  className="hover:bg-slate-50/70 transition-colors duration-100 group"
                >
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                    {formatDate(refund.created)}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">
                    {formatCurrency(refund.amount, refund.currency)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 uppercase">
                    {refund.currency}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLORS[refund.status] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {formatStatus(refund.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                    {formatReason(refund.reason)}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-400 whitespace-nowrap">
                    {refund.charge ? (
                      <span title={refund.charge} className="truncate block max-w-[120px]">
                        {refund.charge}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                    {refund.customerEmail ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px]">
                    {refund.description ? (
                      <span className="truncate block" title={refund.description}>
                        {refund.description}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://dashboard.stripe.com/refunds/${refund.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-300 hover:text-teal-500 transition-colors"
                      title="View in Stripe Dashboard"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
        <span>
          Showing {filtered.length} of {refunds.length} refunds
        </span>
        {(search || statusFilter || reasonFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setReasonFilter('');
            }}
            className="text-teal-500 hover:text-teal-600 font-medium transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

'use client';

import type { DashboardData } from '@/lib/types';
import DemoBanner from './DemoBanner';
import SummaryCards from './SummaryCards';
import DailyChart from './DailyChart';
import ReasonChart from './ReasonChart';
import RefundsTable from './RefundsTable';

interface RefundsDashboardProps {
  data: DashboardData;
}

export default function RefundsDashboard({ data }: RefundsDashboardProps) {
  const { refunds, summary, dailyData, reasonData, isDemo } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight tracking-tight font-display">
                Confidentist
              </h1>
              <p className="text-xs text-slate-400 leading-tight">Stripe Refunds</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            January 2026
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Demo banner */}
        {isDemo && <DemoBanner />}

        {/* Page title */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">Refunds Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            All refunds from January 1 – 31, 2026 · {summary.count} total
          </p>
        </div>

        {/* Summary cards */}
        <SummaryCards summary={summary} />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DailyChart data={dailyData} currency={summary.currency} />
          <ReasonChart data={reasonData} currency={summary.currency} />
        </div>

        {/* Refunds table */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-4 font-display">All Refunds</h2>
          <RefundsTable refunds={refunds} />
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-400">
        Confidentist · Stripe Refunds Dashboard · Data as of {new Date().toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })}
      </footer>
    </div>
  );
}

'use client';

import type { RefundSummary } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface SummaryCardsProps {
  summary: RefundSummary;
}

interface CardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}

function Card({ title, value, icon, accent }: CardProps) {
  return (
    <div
      className={`
        rounded-2xl p-6 bg-white border transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5
        ${accent ? 'border-teal-200 shadow-teal-50' : 'border-slate-100 shadow-sm'}
        animate-fade-in
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`
            w-10 h-10 rounded-xl flex items-center justify-center text-lg
            ${accent ? 'bg-teal-50 text-teal-600' : 'bg-slate-50 text-slate-500'}
          `}
        >
          {icon}
        </div>
      </div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <p className={`text-2xl font-bold tracking-tight ${accent ? 'text-teal-700' : 'text-slate-800'}`}>
        {value}
      </p>
    </div>
  );
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card
        title="Total Refunded"
        value={formatCurrency(summary.totalAmount, summary.currency)}
        accent
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <Card
        title="Refund Count"
        value={summary.count.toString()}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
      />
      <Card
        title="Average Refund"
        value={formatCurrency(summary.averageAmount, summary.currency)}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
      />
      <Card
        title="Largest Refund"
        value={formatCurrency(summary.largestAmount, summary.currency)}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        }
      />
    </div>
  );
}

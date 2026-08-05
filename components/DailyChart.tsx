'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { DailyData } from '@/lib/types';
import { formatCurrency, formatDateShort } from '@/lib/format';

interface DailyChartProps {
  data: DailyData[];
  currency: string;
}

interface TooltipPayload {
  value: number;
  payload: DailyData;
}

function CustomTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  currency: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{formatDateShort(entry.payload.date)}</p>
      <p className="text-teal-600 font-bold">{formatCurrency(entry.value, currency)}</p>
      <p className="text-slate-500">{entry.payload.count} refund{entry.payload.count !== 1 ? 's' : ''}</p>
    </div>
  );
}

export default function DailyChart({ data, currency }: DailyChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: formatDateShort(d.date),
    amountDollars: d.amount / 100,
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-fade-in">
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Daily Activity</h2>
      <p className="text-sm text-slate-400 mb-6">Refund amounts by day — January 2026</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${(v).toLocaleString()}`}
            />
            <Tooltip
              content={<CustomTooltip currency={currency} />}
              cursor={{ fill: '#f0fdfa', radius: 4 }}
            />
            <Bar
              dataKey="amountDollars"
              fill="#2DD4BF"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

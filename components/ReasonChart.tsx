'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import type { ReasonData } from '@/lib/types';
import { formatCurrency, formatReason } from '@/lib/format';

interface ReasonChartProps {
  data: ReasonData[];
  currency: string;
}

const COLORS = ['#2DD4BF', '#FDA4AF', '#86efac', '#fcd34d', '#a5b4fc'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ReasonData & { label: string } }>;
  currency: string;
}

function CustomTooltip({ active, payload, currency }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{entry.payload.label}</p>
      <p className="text-teal-600 font-bold">{formatCurrency(entry.value, currency)}</p>
      <p className="text-slate-500">{entry.payload.count} refund{entry.payload.count !== 1 ? 's' : ''}</p>
    </div>
  );
}

export default function ReasonChart({ data, currency }: ReasonChartProps) {
  const formatted = data.map((d, i) => ({
    ...d,
    label: formatReason(d.reason),
    amountDollars: d.amount / 100,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-fade-in">
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Refund Reasons</h2>
      <p className="text-sm text-slate-400 mb-6">Breakdown by reason type</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={formatted}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${v.toLocaleString()}`}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              width={120}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: '#f0fdfa' }} />
            <Bar dataKey="amountDollars" radius={[0, 6, 6, 0]} maxBarSize={32}>
              {formatted.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4">
        {formatted.map((entry) => (
          <div key={entry.reason} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            {entry.label} ({entry.count})
          </div>
        ))}
      </div>
    </div>
  );
}

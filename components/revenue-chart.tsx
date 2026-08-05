"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import type { RevenuePoint } from "@/lib/dashboard-data"
import { formatCurrency, formatDayLabel } from "@/lib/format"

type RevenueChartProps = {
  series: RevenuePoint[]
  currency: string
}

export function RevenueChart({ series, currency }: RevenueChartProps) {
  const hasVolume = series.some((point) => point.gross > 0)

  return (
    <div className="relative h-64 w-full md:h-80">
      {!hasVolume ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="numeric text-xs uppercase tracking-[0.14em] text-muted">Awaiting first payment</p>
        </div>
      ) : null}

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4c8dff" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#4c8dff" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#22262e" strokeDasharray="2 4" vertical={false} />

          <XAxis
            dataKey="date"
            tickFormatter={(value: number) => formatDayLabel(value)}
            tickLine={false}
            axisLine={{ stroke: "#22262e" }}
            tick={{ fill: "#767e8b", fontSize: 11, fontFamily: "var(--font-mono)" }}
            minTickGap={28}
            dy={8}
          />

          <YAxis
            tickFormatter={(value: number) => formatCurrency(value, currency, { compact: true })}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#767e8b", fontSize: 11, fontFamily: "var(--font-mono)" }}
            width={64}
          />

          <Tooltip
            cursor={{ stroke: "#4c8dff", strokeWidth: 1, strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const point = payload[0]?.payload as RevenuePoint

              return (
                <div className="rounded-md border border-border bg-surface-raised px-3 py-2">
                  <p className="numeric text-[11px] uppercase tracking-[0.14em] text-muted">
                    {formatDayLabel(point.date)}
                  </p>
                  <p className="numeric mt-1 text-sm text-foreground">{formatCurrency(point.gross, currency)}</p>
                  <p className="numeric text-[11px] text-muted">
                    {point.count} {point.count === 1 ? "payment" : "payments"}
                  </p>
                </div>
              )
            }}
          />

          <Area
            type="monotone"
            dataKey="gross"
            stroke="#4c8dff"
            strokeWidth={1.75}
            fill="url(#revenueFill)"
            dot={false}
            activeDot={{ r: 3, fill: "#4c8dff", stroke: "#08090b", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

"use client"

import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import type { RevenuePoint, RevenueSeries } from "@/lib/dashboard-data"
import { formatBucketLabel, formatCurrency } from "@/lib/format"

type RevenueChartProps = {
  series: RevenueSeries
  currency: string
  showComparison: boolean
}

export function RevenueChart({ series, currency, showComparison }: RevenueChartProps) {
  const { points, bucketSeconds } = series
  const hasVolume = points.some((point) => point.gross > 0)

  // Sparse windows read as a flat line unless each sample is marked.
  const activeBuckets = points.filter((point) => point.count > 0).length
  const showDots = hasVolume && activeBuckets <= 8

  return (
    <div className="relative h-72 w-full md:h-96">
      {!hasVolume ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <p className="numeric text-xs uppercase tracking-[0.14em] text-muted">No payments in this range</p>
        </div>
      ) : null}

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4c8dff" stopOpacity={0.34} />
              <stop offset="100%" stopColor="#4c8dff" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#22262e" strokeDasharray="2 4" vertical={false} />

          <XAxis
            dataKey="date"
            tickFormatter={(value: number) => formatBucketLabel(value, bucketSeconds)}
            tickLine={false}
            axisLine={{ stroke: "#22262e" }}
            tick={{ fill: "#767e8b", fontSize: 11, fontFamily: "var(--font-mono)" }}
            minTickGap={36}
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
                    {formatBucketLabel(point.date, bucketSeconds)}
                  </p>
                  <p className="numeric mt-1 text-sm text-foreground">{formatCurrency(point.gross, currency)}</p>
                  <p className="numeric text-[11px] text-muted">
                    {point.count} {point.count === 1 ? "payment" : "payments"}
                  </p>
                  {showComparison ? (
                    <p className="numeric mt-1.5 border-t border-border pt-1.5 text-[11px] text-muted">
                      prior {formatCurrency(point.previousGross, currency)}
                    </p>
                  ) : null}
                </div>
              )
            }}
          />

          {showComparison ? (
            <Line
              type="monotone"
              dataKey="previousGross"
              stroke="#767e8b"
              strokeWidth={1.25}
              strokeDasharray="3 3"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          ) : null}

          <Area
            type="monotone"
            dataKey="gross"
            stroke="#4c8dff"
            strokeWidth={1.75}
            fill="url(#revenueFill)"
            dot={showDots ? { r: 2.5, fill: "#4c8dff", stroke: "none" } : false}
            activeDot={{ r: 3, fill: "#4c8dff", stroke: "#08090b", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

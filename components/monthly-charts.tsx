"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
  Legend,
} from "recharts"

import type { MonthRow } from "@/lib/report-data"
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format"

/** Recharts paints SVG attributes directly, so these must be color values. */
const C = {
  signal: "var(--color-signal)",
  border: "var(--color-border)",
  muted: "var(--color-muted)",
  background: "var(--color-background)",
  warn: "var(--color-warn)",
  alert: "var(--color-alert)",
} as const

const AXIS_TICK = { fill: C.muted, fontSize: 11, fontFamily: "var(--font-mono)" } as const

/** One vivid color per calendar month position (0 = Jan, 11 = Dec). */
const MONTH_PALETTE = [
  "#4c8dff", // Jan — blue
  "#a78bfa", // Feb — violet
  "#34d399", // Mar — emerald
  "#fbbf24", // Apr — amber
  "#22d3ee", // May — cyan
  "#fb923c", // Jun — orange
  "#e879f9", // Jul — fuchsia
  "#f87171", // Aug — rose
  "#a3e635", // Sep — lime
  "#38bdf8", // Oct — sky
  "#fdba74", // Nov — peach
  "#c084fc", // Dec — purple
] as const

function monthColor(key: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(key)
  if (!match) return MONTH_PALETTE[0]
  return MONTH_PALETTE[(Number(match[2]) - 1) % 12]
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-1 rounded-md border border-border bg-surface p-5 md:p-6"
    >
      <h2 className="numeric text-[11px] uppercase tracking-[0.16em] text-muted">{title}</h2>
      <p className="text-xs leading-relaxed text-muted">{hint}</p>
      {children}
    </section>
  )
}

function TooltipShell({ heading, rows }: { heading: string; rows: [string, string][] }) {
  return (
    <div className="rounded-md border border-border bg-surface-raised px-3 py-2">
      <p className="numeric text-[11px] uppercase tracking-[0.14em] text-muted">{heading}</p>
      <dl className="mt-1.5 flex flex-col gap-0.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4">
            <dt className="text-[11px] text-muted">{label}</dt>
            <dd className="numeric text-[11px] text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Gross revenue bars with a cumulative line on a secondary axis. */
export function MonthlyRevenueChart({
  months,
  currency,
}: {
  months: MonthRow[]
  currency: string
}) {
  const hasVolume = months.some((month) => month.gross > 0)

  return (
    <Panel
      title="Monthly revenue"
      hint="Bars show gross revenue per calendar month. The dashed line tracks the cumulative total across the period."
    >
      <div className="relative mt-4 h-72 w-full md:h-80">
        {!hasVolume ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <p className="numeric text-xs uppercase tracking-[0.14em] text-muted">
              No payments in this range
            </p>
          </div>
        ) : null}

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={months} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="monthlyBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.signal} stopOpacity={0.95} />
                <stop offset="100%" stopColor={C.signal} stopOpacity={0.45} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke={C.border} strokeDasharray="2 4" vertical={false} />

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: C.border }}
              tick={AXIS_TICK}
              interval="preserveStartEnd"
              dy={8}
            />
            <YAxis
              yAxisId="gross"
              tickFormatter={(value: number) => formatCurrency(value, currency, { compact: true })}
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              width={64}
            />
            <YAxis
              yAxisId="cumulative"
              orientation="right"
              tickFormatter={(value: number) => formatCurrency(value, currency, { compact: true })}
              tickLine={false}
              axisLine={false}
              tick={{ ...AXIS_TICK, fill: C.warn }}
              width={64}
            />

            <Tooltip
              cursor={{ fill: "var(--color-surface-raised)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const row = payload[0]?.payload as MonthRow

                return (
                  <TooltipShell
                    heading={row.partial ? `${row.label} · partial` : row.label}
                    rows={[
                      ["Gross", formatCurrency(row.gross, currency)],
                      ["Net", formatCurrency(row.net, currency)],
                      ["Fees", formatCurrency(row.fees, currency)],
                      ["Refunded", formatCurrency(row.refunded, currency)],
                      ["Payments", formatNumber(row.payments)],
                      ["Avg order", formatCurrency(row.averageOrder, currency)],
                      ["Cumulative", formatCurrency(row.cumulative, currency)],
                      ["vs prior", row.momRatio === null ? "—" : formatPercent(row.momRatio)],
                    ]}
                  />
                )
              }}
            />

            <Bar
              yAxisId="gross"
              dataKey="gross"
              fill="url(#monthlyBar)"
              radius={[3, 3, 0, 0]}
              maxBarSize={56}
              isAnimationActive={false}
            >
              {/* Partial months are hatched down so they read as incomplete. */}
              {months.map((month) => (
                <Cell key={month.key} fillOpacity={month.partial ? 0.45 : 1} />
              ))}
            </Bar>

            <Line
              yAxisId="cumulative"
              type="monotone"
              dataKey="cumulative"
              stroke={C.warn}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={{ r: 2, fill: C.warn, stroke: "none" }}
              activeDot={{ r: 3.5, fill: C.warn, stroke: C.background, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}

/** Diverging month-over-month growth, green up / red down around a zero line. */
export function MonthOverMonthChart({
  months,
  currency,
}: {
  months: MonthRow[]
  currency: string
}) {
  // Months without a baseline cannot express growth, so they are left out.
  const data = months.filter((month) => month.momRatio !== null)

  return (
    <Panel
      title="Month over month"
      hint="Percentage change in gross revenue against the preceding calendar month. Bars above the line are growth."
    >
      <div className="relative mt-4 h-56 w-full">
        {data.length === 0 ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <p className="numeric text-center text-xs uppercase tracking-[0.14em] text-muted">
              Not enough history to compare
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={C.border} strokeDasharray="2 4" vertical={false} />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: C.border }}
                tick={AXIS_TICK}
                interval="preserveStartEnd"
                dy={8}
              />
              <YAxis
                tickFormatter={(value: number) => formatPercent(value)}
                tickLine={false}
                axisLine={false}
                tick={AXIS_TICK}
                width={56}
                /* Recharts' default padding stretched the axis far past the
                 * real extremes, flattening every bar. Hug the data instead. */
                domain={[
                  (min: number) => (min < 0 ? min * 1.2 : 0),
                  (max: number) => (max > 0 ? max * 1.2 : 0.05),
                ]}
              />

              <ReferenceLine y={0} stroke={C.muted} strokeWidth={1} />

              <Tooltip
                cursor={{ fill: "var(--color-surface-raised)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const row = payload[0]?.payload as MonthRow

                  return (
                    <TooltipShell
                      heading={row.label}
                      rows={[
                        ["Change", row.momRatio === null ? "—" : formatPercent(row.momRatio)],
                        [
                          "Difference",
                          row.momDelta === null
                            ? "—"
                            : `${row.momDelta >= 0 ? "+" : "−"}${formatCurrency(Math.abs(row.momDelta), currency)}`,
                        ],
                        ["Gross", formatCurrency(row.gross, currency)],
                      ]}
                    />
                  )
                }}
              />

              <Bar dataKey="momRatio" radius={[3, 3, 0, 0]} maxBarSize={44} isAnimationActive={false}>
                {data.map((month) => (
                  <Cell
                    key={month.key}
                    fill={(month.momRatio ?? 0) >= 0 ? C.signal : C.alert}
                    fillOpacity={month.partial ? 0.5 : 0.9}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Panel>
  )
}

// ---------------------------------------------------------------------------
// Fancy stacked chart: net (colored per month) + refunds (red overlay)
// MoM % badges rendered above each bar via a custom label.
// ---------------------------------------------------------------------------

interface MomLabelProps {
  x?: number
  y?: number
  width?: number
  value?: number | null
  index?: number
  months: MonthRow[]
}

function MomLabel({ x = 0, y = 0, width = 0, index = 0, months }: MomLabelProps) {
  const row = months[index]
  if (!row || row.momRatio === null) return null

  const up = row.momRatio > 0.0005
  const down = row.momRatio < -0.0005
  const color = up ? "#34d399" : down ? "#f87171" : "#767e8b"
  const arrow = up ? "▲" : down ? "▼" : "•"
  const text = `${arrow} ${formatPercent(row.momRatio)}`

  return (
    <text
      x={x + width / 2}
      y={y - 6}
      textAnchor="middle"
      fill={color}
      fontSize={9}
      fontFamily="var(--font-mono)"
      letterSpacing="-0.01em"
    >
      {text}
    </text>
  )
}

/**
 * Stacked bar chart where each month is a distinct colour.
 * Bottom stack = net revenue; top stack = refunds (red).
 * MoM % badge floats above every bar.
 */
export function StackedRevenueChart({
  months,
  currency,
}: {
  months: MonthRow[]
  currency: string
}) {
  const hasVolume = months.some((m) => m.gross > 0)

  return (
    <Panel
      title="Revenue breakdown · net + refunds"
      hint="Each month is a distinct colour. The dark-red top segment shows refunds deducted from gross. The badge above each bar shows month-over-month change."
    >
      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-5">
        <span className="flex items-center gap-1.5 text-[11px] text-muted">
          <span className="inline-block h-2.5 w-3 rounded-sm" style={{ background: MONTH_PALETTE[0] }} />
          Net revenue
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted">
          <span className="inline-block h-2.5 w-3 rounded-sm bg-alert opacity-75" />
          Refunds
        </span>
        <span className="flex items-center gap-1.5 gap-x-1 text-[11px] text-muted">
          <span className="text-[#34d399]">▲</span>
          <span className="text-[#f87171]">▼</span>
          MoM change
        </span>
      </div>

      <div className="relative mt-4 h-80 w-full md:h-96">
        {!hasVolume ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <p className="numeric text-xs uppercase tracking-[0.14em] text-muted">No payments in this range</p>
          </div>
        ) : null}

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={months} margin={{ top: 28, right: 8, bottom: 0, left: 0 }} barCategoryGap="30%">
            <CartesianGrid stroke={C.border} strokeDasharray="2 4" vertical={false} />

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: C.border }}
              tick={AXIS_TICK}
              interval="preserveStartEnd"
              dy={8}
            />
            <YAxis
              tickFormatter={(v: number) => formatCurrency(v, currency, { compact: true })}
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              width={64}
            />

            <Tooltip
              cursor={{ fill: "var(--color-surface-raised)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const row = payload[0]?.payload as MonthRow
                return (
                  <TooltipShell
                    heading={row.partial ? `${row.label} · partial` : row.label}
                    rows={[
                      ["Gross", formatCurrency(row.gross, currency)],
                      ["Refunds", formatCurrency(row.refunded, currency)],
                      ["Net", formatCurrency(row.net, currency)],
                      ["Fees", formatCurrency(row.fees, currency)],
                      ["Payments", formatNumber(row.payments)],
                      ["vs prior", row.momRatio === null ? "—" : formatPercent(row.momRatio)],
                    ]}
                  />
                )
              }}
            />

            {/* Net revenue — bottom stack, unique colour per month */}
            <Bar dataKey="net" stackId="rev" radius={[0, 0, 0, 0]} maxBarSize={52} isAnimationActive={false}>
              {months.map((month) => (
                <Cell key={month.key} fill={monthColor(month.key)} fillOpacity={month.partial ? 0.45 : 0.88} />
              ))}
            </Bar>

            {/* Refunds — top stack, alert-red; carries the MoM label */}
            <Bar
              dataKey="refunded"
              stackId="rev"
              radius={[3, 3, 0, 0]}
              maxBarSize={52}
              fill="#e5484d"
              fillOpacity={0.75}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="refunded"
                content={(props) => (
                  <MomLabel
                    {...(props as { x?: number; y?: number; width?: number; value?: number | null; index?: number })}
                    months={months}
                  />
                )}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}

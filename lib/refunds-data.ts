import type { DailyData, DashboardData, ReasonData, RefundRecord, RefundSummary } from './types';
import { demoRefunds } from './demo-data';
import { getStripeClient } from './stripe';

function computeSummary(refunds: RefundRecord[]): RefundSummary {
  if (refunds.length === 0) {
    return { totalAmount: 0, count: 0, averageAmount: 0, largestAmount: 0, currency: 'cad' };
  }

  // Use the most common currency
  const currencyCount: Record<string, number> = {};
  for (const r of refunds) {
    currencyCount[r.currency] = (currencyCount[r.currency] ?? 0) + 1;
  }
  const primaryCurrency = Object.entries(currencyCount).sort((a, b) => b[1] - a[1])[0][0];

  const totalAmount = refunds.reduce((sum, r) => sum + r.amount, 0);
  const largestAmount = Math.max(...refunds.map((r) => r.amount));

  return {
    totalAmount,
    count: refunds.length,
    averageAmount: Math.round(totalAmount / refunds.length),
    largestAmount,
    currency: primaryCurrency,
  };
}

function computeDailyData(refunds: RefundRecord[]): DailyData[] {
  const map: Record<string, { amount: number; count: number }> = {};

  for (const r of refunds) {
    const date = new Date(r.created * 1000).toISOString().slice(0, 10); // YYYY-MM-DD in UTC
    if (!map[date]) {
      map[date] = { amount: 0, count: 0 };
    }
    map[date].amount += r.amount;
    map[date].count += 1;
  }

  return Object.entries(map)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function computeReasonData(refunds: RefundRecord[]): ReasonData[] {
  const map: Record<string, { amount: number; count: number }> = {};

  for (const r of refunds) {
    const reason = r.reason ?? 'not_specified';
    if (!map[reason]) {
      map[reason] = { amount: 0, count: 0 };
    }
    map[reason].amount += r.amount;
    map[reason].count += 1;
  }

  return Object.entries(map)
    .map(([reason, data]) => ({ reason, ...data }))
    .sort((a, b) => b.amount - a.amount);
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const stripe = getStripeClient();

  if (!stripe) {
    // Demo mode
    const summary = computeSummary(demoRefunds);
    const dailyData = computeDailyData(demoRefunds);
    const reasonData = computeReasonData(demoRefunds);

    return {
      refunds: demoRefunds,
      summary,
      dailyData,
      reasonData,
      isDemo: true,
    };
  }

  // Real Stripe data
  const jan2026Start = Math.floor(new Date('2026-01-01T00:00:00Z').getTime() / 1000);
  const jan2026End = Math.floor(new Date('2026-02-01T00:00:00Z').getTime() / 1000);

  const allRefunds: RefundRecord[] = [];

  // Auto-paginate through all results
  for await (const refund of stripe.refunds.list({
    created: {
      gte: jan2026Start,
      lt: jan2026End,
    },
    limit: 100,
  })) {
    allRefunds.push({
      id: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status ?? 'unknown',
      reason: refund.reason ?? null,
      created: refund.created,
      charge: typeof refund.charge === 'string' ? refund.charge : (refund.charge?.id ?? null),
      description: refund.description ?? null,
      customerEmail: null, // Would need to fetch charge/customer separately
      failureReason: refund.failure_reason ?? null,
    });
  }

  const summary = computeSummary(allRefunds);
  const dailyData = computeDailyData(allRefunds);
  const reasonData = computeReasonData(allRefunds);

  return {
    refunds: allRefunds,
    summary,
    dailyData,
    reasonData,
    isDemo: false,
  };
}

export interface RefundRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reason: string | null;
  created: number;
  charge: string | null;
  description: string | null;
  customerEmail: string | null;
  failureReason: string | null;
}

export interface RefundSummary {
  totalAmount: number;
  count: number;
  averageAmount: number;
  largestAmount: number;
  currency: string;
}

export interface DailyData {
  date: string;
  amount: number;
  count: number;
}

export interface ReasonData {
  reason: string;
  amount: number;
  count: number;
}

export interface DashboardData {
  refunds: RefundRecord[];
  summary: RefundSummary;
  dailyData: DailyData[];
  reasonData: ReasonData[];
  isDemo: boolean;
}

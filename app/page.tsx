import { fetchDashboardData } from '@/lib/refunds-data';
import RefundsDashboard from '@/components/RefundsDashboard';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await fetchDashboardData();
  return <RefundsDashboard data={data} />;
}

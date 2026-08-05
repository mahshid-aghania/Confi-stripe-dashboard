import { NextResponse } from 'next/server';
import { fetchDashboardData } from '@/lib/refunds-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching refunds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch refunds data' },
      { status: 500 }
    );
  }
}

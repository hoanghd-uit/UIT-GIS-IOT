import { redirect } from 'next/navigation';
import { DASHBOARD_DEFAULT_PATH } from '@/config/dashboard-routes';
import { requireDashboardSession } from '@/lib/auth/session.server';

export default async function DashboardRootPage() {
  await requireDashboardSession('/dashboard');
  redirect(DASHBOARD_DEFAULT_PATH);
}

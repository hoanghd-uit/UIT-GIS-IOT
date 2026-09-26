import { redirect } from 'next/navigation';
import { DASHBOARD_DEFAULT_PATH } from '@/config/dashboard-routes';

export default function DashboardRootPage() {
  redirect(DASHBOARD_DEFAULT_PATH);
}

import { DashboardRouteItem } from '@/types/dashboard';

export const DASHBOARD_DEFAULT_PATH = '/dashboard/overview';
export const VIEWER_CAMPUS_PATH = '/viewer/campus';

/**
 * Exactly seven frozen in-scope Dashboard routes for Big Phase 02.
 * Pages 04, 05, 08, and 10 are strictly out of scope.
 */
export const DASHBOARD_ROUTES: readonly DashboardRouteItem[] = [
  {
    id: 'overview',
    pageNumber: '01',
    title: 'Tổng quan',
    shortTitle: 'Tổng quan',
    path: '/dashboard/overview',
    description: 'Tổng quan vận hành và các chỉ số trung tâm tòa nhà E',
    expectedMode: 'derived',
  },
  {
    id: 'energy-water',
    pageNumber: '02',
    title: 'Năng lượng & Nước',
    shortTitle: 'Năng lượng & Nước',
    path: '/dashboard/energy-water',
    description: 'Theo dõi tiêu thụ điện năng và lưu lượng nước',
    expectedMode: 'live',
  },
  {
    id: 'environment',
    pageNumber: '03',
    title: 'Môi trường (IAQ)',
    shortTitle: 'Môi trường',
    path: '/dashboard/environment',
    description: 'Chất lượng không khí trong nhà và điều kiện tiện nghi nhiệt',
    expectedMode: 'live',
  },
  {
    id: 'alerts',
    pageNumber: '06',
    title: 'Trung tâm cảnh báo',
    shortTitle: 'Cảnh báo',
    path: '/dashboard/alerts',
    description: 'Cảnh báo hệ thống, ngưỡng vượt và trạng thái phản hồi',
    expectedMode: 'derived',
  },
  {
    id: 'iot',
    pageNumber: '07',
    title: 'Hệ thống IoT',
    shortTitle: 'Hệ thống IoT',
    path: '/dashboard/iot',
    description: 'Trạng thái hoạt động, danh mục và sức khỏe thiết bị IoT',
    expectedMode: 'live',
  },
  {
    id: 'parking',
    pageNumber: '09',
    title: 'Bãi xe',
    shortTitle: 'Bãi xe',
    path: '/dashboard/parking',
    description: 'Quản lý sức chứa, lượt phương tiện và trạng thái bãi đỗ xe',
    expectedMode: 'demo',
  },
  {
    id: 'fire-safety',
    pageNumber: '11',
    title: 'PCCC',
    shortTitle: 'PCCC',
    path: '/dashboard/fire-safety',
    description: 'Hạ tầng phòng cháy chữa cháy và trạng thái thiết bị cứu hỏa',
    expectedMode: 'manual',
  },
] as const;

/**
 * Find route item by route path or return undefined
 */
export function getDashboardRouteByPath(pathname: string): DashboardRouteItem | undefined {
  if (!pathname) return undefined;
  const cleanPath = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  return DASHBOARD_ROUTES.find((r) => r.path === cleanPath);
}

/**
 * Check if a path belongs to the Dashboard area
 */
export function isDashboardRoute(pathname: string): boolean {
  if (!pathname) return false;
  return pathname.startsWith('/dashboard');
}

/**
 * Check if a specific route item is active for the given pathname
 */
export function isDashboardRouteActive(currentPathname: string, routePath: string): boolean {
  if (!currentPathname || !routePath) return false;
  const cleanCurrent = currentPathname.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  const cleanTarget = routePath.replace(/\/+$/, '') || '/';
  return cleanCurrent === cleanTarget;
}

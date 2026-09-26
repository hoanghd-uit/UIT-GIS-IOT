import React from 'react';
import type { Metadata } from 'next';
import { DashboardShell } from '@/components/dashboard/layout/DashboardShell';

export const metadata: Metadata = {
  title: 'Dashboard Giám Sát Tòa Nhà E — UIT Digital Twin',
  description: 'Trung tâm giám sát năng lượng, môi trường, IoT và hạ tầng kỹ thuật tòa nhà E',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}

import React from 'react';
import type { Metadata } from 'next';
import { requireDashboardSession } from '@/lib/auth/session.server';
import { DashboardAbilityProvider } from '@/components/auth/DashboardAbilityProvider';
import { DashboardShell } from '@/components/dashboard/layout/DashboardShell';

export const metadata: Metadata = {
  title: 'Dashboard Giám Sát Tòa Nhà E — UIT Digital Twin',
  description: 'Trung tâm giám sát năng lượng, môi trường, IoT và hạ tầng kỹ thuật tòa nhà E',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireDashboardSession();

  return (
    <DashboardAbilityProvider
      initialUser={session.user}
      initialRules={session.abilityRules}
    >
      <DashboardShell>{children}</DashboardShell>
    </DashboardAbilityProvider>
  );
}

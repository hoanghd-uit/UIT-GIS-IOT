import { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Đăng nhập · Dashboard Tòa E Digital Twin',
  description: 'Đăng nhập hệ thống giám sát và quản trị số Tòa E Digital Twin.',
};

export default function LoginPage() {
  return (
    <main
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6"
      style={{
        backgroundColor: '#080D11',
      }}
    >
      <Suspense
        fallback={
          <div className="w-full max-w-[420px] h-[360px] rounded-2xl border border-white/5 bg-[#0D171E] animate-pulse" />
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}

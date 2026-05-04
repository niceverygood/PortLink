import type { Metadata, Viewport } from 'next';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { BottomTabs } from '@/components/driver/BottomTabs';
import { ServiceWorkerRegister } from '@/components/driver/ServiceWorkerRegister';
import { NativeAppBridge } from '@/components/driver/NativeAppBridge';
import { PushRegistration } from '@/components/driver/PushRegistration';
import { NetworkWatcher } from '@/components/driver/NetworkWatcher';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: { default: 'PortLink Driver', template: '%s | PortLink Driver' },
  description: '차주 모바일 배차 앱',
  manifest: '/driver/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PortLink Driver',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FF6B35',
  viewportFit: 'cover',
};

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== UserRole.DRIVER && session.user.role !== UserRole.ADMIN)
  ) {
    redirect('/login?kind=driver');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 페이지가 자체적으로 max-w-md 적용 — hero가 viewport 전폭을 쓸 수 있게. */}
      <div className="pb-20">{children}</div>
      <BottomTabs />
      <ServiceWorkerRegister />
      <NativeAppBridge />
      <PushRegistration />
      <NetworkWatcher />
      <Toaster richColors position="top-center" />
    </div>
  );
}

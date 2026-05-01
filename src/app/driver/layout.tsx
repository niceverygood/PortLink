import type { Metadata, Viewport } from 'next';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { BottomTabs } from '@/components/driver/BottomTabs';
import { ServiceWorkerRegister } from '@/components/driver/ServiceWorkerRegister';

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
      <div className="mx-auto max-w-md pb-20">{children}</div>
      <BottomTabs />
      <ServiceWorkerRegister />
    </div>
  );
}

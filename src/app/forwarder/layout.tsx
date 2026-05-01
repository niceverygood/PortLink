import type { Metadata, Viewport } from 'next';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { QueryProvider } from '@/lib/query-client';
import { Sidebar } from '@/components/forwarder/Sidebar';
import { Topbar } from '@/components/forwarder/Topbar';

export const metadata: Metadata = {
  title: { default: 'PortLink', template: '%s | PortLink' },
  description: '컨테이너 운송 배차 관리',
  manifest: '/forwarder/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A2540',
};

const ALLOWED: ReadonlyArray<UserRole> = [UserRole.FORWARDER, UserRole.CARRIER, UserRole.ADMIN];

export default async function ForwarderLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || !session.user.role || !ALLOWED.includes(session.user.role)) {
    redirect('/login?kind=forwarder');
  }

  // 회사명 조회 (Topbar 표시용)
  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { forwarder: true, carrier: true },
  });
  const companyName = profile?.forwarder?.companyName ?? profile?.carrier?.companyName ?? null;

  return (
    <QueryProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar userName={session.user.name ?? ''} companyName={companyName} />
          <main className="flex-1 overflow-x-auto p-6">{children}</main>
        </div>
      </div>
    </QueryProvider>
  );
}

import type { Metadata, Viewport } from 'next';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { QueryProvider } from '@/lib/query-client';
import { Sidebar } from '@/components/forwarder/Sidebar';

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

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { forwarder: true, carrier: true },
  });
  const companyName = profile?.forwarder?.companyName ?? profile?.carrier?.companyName ?? null;

  return (
    <QueryProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar
          userName={session.user.name ?? ''}
          companyName={companyName}
          role={session.user.role as 'FORWARDER' | 'CARRIER' | 'ADMIN'}
        />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </QueryProvider>
  );
}

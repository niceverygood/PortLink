import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { QueryProvider } from '@/lib/query-client';
import { AdminSidebar } from '@/components/admin/Sidebar';

export const metadata: Metadata = {
  title: { default: 'PortLink Admin', template: '%s | PortLink Admin' },
  description: 'PortLink 관리자 백오피스',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    redirect('/login?kind=admin');
  }

  return (
    <QueryProvider>
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar userName={session.user.name ?? undefined} />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </QueryProvider>
  );
}

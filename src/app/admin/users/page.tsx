/**
 * /admin/users — 회원 관리 (DataTable + 인라인 승인/정지).
 */
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Topbar } from '@/components/forwarder/Topbar';
import { UsersTable, type UserRow } from './users-table';

export const dynamic = 'force-dynamic';
export const metadata = { title: '회원 관리' };

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?kind=admin');

  const users = await prisma.user.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 200,
    include: {
      forwarder: { select: { companyName: true } },
      carrier: { select: { companyName: true } },
      truckDriver: { select: { driverCode: true } },
    },
  });

  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.status,
    company:
      u.forwarder?.companyName ?? u.carrier?.companyName ?? u.truckDriver?.driverCode ?? null,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
  }));

  return (
    <>
      <Topbar
        title="회원 관리"
        subtitle={`전체 ${rows.length}명 (대기 ${rows.filter((r) => r.status === 'PENDING_APPROVAL').length} · 활성 ${rows.filter((r) => r.status === 'ACTIVE').length} · 정지 ${rows.filter((r) => r.status === 'SUSPENDED').length})`}
      />
      <div className="flex-1 overflow-y-auto p-8">
        <UsersTable rows={rows} currentUserId={session.user.id} />
      </div>
    </>
  );
}

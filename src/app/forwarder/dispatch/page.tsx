/**
 * /forwarder/dispatch — 본인 의뢰 목록 (DataTable).
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { Plus } from 'lucide-react';
import type { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { dispatchOrderScope } from '@/lib/forwarder-scope';
import { Topbar } from '@/components/forwarder/Topbar';
import { DispatchListTable, type DispatchRow } from './dispatch-list-table';

export const dynamic = 'force-dynamic';
export const metadata = { title: '배차 관리' };

/**
 * 데이터 쿼리만 30초 캐시. auth/redirect는 매 요청마다 정상 실행.
 * 같은 (userId, role) 조합으로 들어오면 30초 안에는 DB 안 침. 페이지 자체는 dynamic.
 */
const fetchDispatches = unstable_cache(
  async (userId: string, role: UserRole) =>
    prisma.dispatchOrder.findMany({
      where: dispatchOrderScope({ userId, role }),
      include: { trip: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  ['forwarder-dispatch-list-v1'],
  { revalidate: 30, tags: ['dispatch-list'] },
);

export default async function DispatchListPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect('/login?kind=forwarder');

  const orders = await fetchDispatches(session.user.id, session.user.role);

  const rows: DispatchRow[] = orders.map((o) => ({
    id: o.id,
    orderNo: o.orderNo,
    originRegion: o.originRegion,
    port: o.port,
    containerType: o.containerType,
    pickupAt: o.pickupAt.toISOString(),
    fare: o.fare,
    status: o.status,
    tripStatus: o.trip?.status ?? null,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <>
      <Topbar
        title="배차 관리"
        subtitle={`본인 의뢰 ${rows.length}건`}
        actions={
          <Link
            href="/forwarder/dispatch/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-navy-dark"
          >
            <Plus className="size-[15px]" strokeWidth={2.5} />
            배차 등록
          </Link>
        }
      />
      <div className="flex-1 overflow-y-auto p-8">
        <DispatchListTable rows={rows} />
      </div>
    </>
  );
}

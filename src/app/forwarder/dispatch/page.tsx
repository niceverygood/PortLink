/**
 * /forwarder/dispatch — 본인 의뢰 목록 (DataTable).
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { dispatchOrderScope } from '@/lib/forwarder-scope';
import { Topbar } from '@/components/forwarder/Topbar';
import { DispatchListTable, type DispatchRow } from './dispatch-list-table';

export const dynamic = 'force-dynamic';
export const metadata = { title: '배차 관리' };

export default async function DispatchListPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect('/login?kind=forwarder');

  const orders = await prisma.dispatchOrder.findMany({
    where: dispatchOrderScope({ userId: session.user.id, role: session.user.role }),
    include: { trip: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

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

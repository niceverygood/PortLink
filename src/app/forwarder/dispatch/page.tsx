/**
 * /forwarder/dispatch — 본인 의뢰 목록 (DataTable).
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { dispatchOrderScope } from '@/lib/forwarder-scope';
import { Button } from '@/components/ui/button';
import { DispatchListTable, type DispatchRow } from './dispatch-list-table';

export const dynamic = 'force-dynamic';
export const metadata = { title: '배차 목록' };

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 font-semibold text-slate-900">배차 목록</h1>
          <p className="mt-1 text-body-sm text-slate-500">본인 의뢰 {rows.length}건</p>
        </div>
        <Link href="/forwarder/dispatch/new">
          <Button className="bg-brand-navy hover:bg-brand-navy-dark">
            <Plus className="mr-1 size-4" /> 새 배차 등록
          </Button>
        </Link>
      </div>

      <DispatchListTable rows={rows} />
    </div>
  );
}

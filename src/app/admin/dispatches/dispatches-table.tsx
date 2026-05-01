'use client';

import { useMemo, useState, useTransition } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { ContainerType, DispatchOrderStatus, PortCode, TripStatus } from '@prisma/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DataTable, SortableHeader } from '@/components/forwarder/DataTable';
import { TripStatusBadge } from '@/components/portlink/TripStatusBadge';
import { PortBadge } from '@/components/portlink/PortBadge';
import { ContainerTypeIcon } from '@/components/portlink/ContainerTypeIcon';
import { formatKRW } from '@/lib/format';
import { forceCancelTripAction } from './actions';

export interface AdminDispatchRow {
  id: string;
  orderNo: string;
  forwarderName: string;
  originRegion: string;
  port: PortCode;
  containerType: ContainerType;
  fare: number;
  status: DispatchOrderStatus;
  tripId: string | null;
  tripStatus: TripStatus | null;
  driverName: string | null;
  createdAt: string;
}

const ORDER_LABEL: Record<DispatchOrderStatus, string> = {
  OPEN: '매칭 대기',
  ASSIGNED: '배정됨',
  COMPLETED: '완료',
  CANCELLED: '취소',
};

export function DispatchesTable({ rows }: { rows: AdminDispatchRow[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.orderNo} ${r.originRegion} ${r.forwarderName} ${r.driverName ?? ''}`
        .toLowerCase()
        .includes(q),
    );
  }, [rows, search]);

  const columns = useMemo<ColumnDef<AdminDispatchRow>[]>(
    () => [
      {
        accessorKey: 'orderNo',
        header: ({ column }) => <SortableHeader column={column} label="번호" />,
        cell: ({ row }) => <span className="font-mono text-[12px]">#{row.original.orderNo}</span>,
      },
      {
        accessorKey: 'forwarderName',
        header: '포워더',
      },
      {
        accessorKey: 'originRegion',
        header: '출발지',
      },
      {
        accessorKey: 'port',
        header: '항만',
        cell: ({ row }) => <PortBadge port={row.original.port} />,
      },
      {
        accessorKey: 'containerType',
        header: '차종',
        cell: ({ row }) => (
          <ContainerTypeIcon type={row.original.containerType} size="sm" withLabel />
        ),
      },
      {
        accessorKey: 'driverName',
        header: '차주',
        cell: ({ row }) => row.original.driverName ?? '-',
      },
      {
        accessorKey: 'status',
        header: '상태',
        cell: ({ row }) =>
          row.original.tripStatus ? (
            <TripStatusBadge status={row.original.tripStatus} />
          ) : (
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
              {ORDER_LABEL[row.original.status]}
            </span>
          ),
      },
      {
        accessorKey: 'fare',
        header: ({ column }) => <SortableHeader column={column} label="운임" />,
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">{formatKRW(row.original.fare)}</span>
        ),
      },
      {
        id: 'actions',
        header: '액션',
        cell: ({ row }) => <ForceCancelCell row={row.original} />,
      },
    ],
    [],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="번호 / 포워더 / 출발지 / 차주 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72"
        />
      </div>

      <DataTable columns={columns} data={filtered} emptyMessage="조건에 해당하는 배차가 없습니다" />
    </div>
  );
}

const CANCELLABLE_STATUSES: TripStatus[] = [
  'PENDING',
  'DEPARTED',
  'LOADED',
  'IN_TRANSIT',
  'UNLOADED',
];

function ForceCancelCell({ row }: { row: AdminDispatchRow }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  if (!row.tripId || !row.tripStatus || !CANCELLABLE_STATUSES.includes(row.tripStatus)) {
    return <span className="text-[11px] text-slate-400">-</span>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 border-brand-error/40 px-3 text-[11px] text-brand-error hover:bg-brand-error/10"
        >
          강제 취소
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>운송 강제 취소 — #{row.orderNo}</DialogTitle>
          <DialogDescription>
            배차 정보를 변경하고 차주에게 통지됩니다. 사유를 명확히 기재하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">취소 사유</Label>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="예: 화주 요청, 차량 점검 등"
          />
        </div>
        {err && <p className="text-[12px] text-brand-error">{err}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            돌아가기
          </Button>
          <Button
            disabled={pending || !reason.trim()}
            className="bg-brand-error text-white hover:bg-brand-error/90"
            onClick={() =>
              startTransition(async () => {
                setErr(null);
                const res = await forceCancelTripAction({ tripId: row.tripId!, reason });
                if (!res.ok) {
                  setErr(res.message ?? '취소 실패');
                  return;
                }
                setOpen(false);
              })
            }
          >
            {pending ? '취소 중…' : '강제 취소'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

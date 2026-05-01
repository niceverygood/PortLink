'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import type { ContainerType, DispatchOrderStatus, PortCode, TripStatus } from '@prisma/client';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable, SortableHeader } from '@/components/forwarder/DataTable';
import { TripStatusBadge } from '@/components/portlink/TripStatusBadge';
import { PortBadge } from '@/components/portlink/PortBadge';
import { ContainerTypeIcon } from '@/components/portlink/ContainerTypeIcon';
import { formatKRW } from '@/lib/format';

export interface DispatchRow {
  id: string;
  orderNo: string;
  originRegion: string;
  port: PortCode;
  containerType: ContainerType;
  pickupAt: string;
  fare: number;
  status: DispatchOrderStatus;
  tripStatus: TripStatus | null;
  createdAt: string;
}

const STATUS_LABEL: Record<DispatchOrderStatus, string> = {
  OPEN: '매칭 대기',
  ASSIGNED: '배정됨',
  COMPLETED: '완료',
  CANCELLED: '취소',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DispatchListTable({ rows }: { rows: DispatchRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | DispatchOrderStatus>('ALL');
  const [portFilter, setPortFilter] = useState<'ALL' | PortCode>('ALL');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (portFilter !== 'ALL' && r.port !== portFilter) return false;
      if (q && !r.orderNo.toLowerCase().includes(q) && !r.originRegion.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [rows, search, statusFilter, portFilter]);

  const columns = useMemo<ColumnDef<DispatchRow>[]>(
    () => [
      {
        accessorKey: 'orderNo',
        header: ({ column }) => <SortableHeader column={column} label="번호" />,
        cell: ({ row }) => <span className="font-mono text-caption">{row.original.orderNo}</span>,
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
        accessorKey: 'pickupAt',
        header: ({ column }) => <SortableHeader column={column} label="상차" />,
        cell: ({ row }) => (
          <span className="tabular-nums">{formatDate(row.original.pickupAt)}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: '상태',
        cell: ({ row }) =>
          row.original.tripStatus ? (
            <TripStatusBadge status={row.original.tripStatus} />
          ) : (
            <span className="text-caption text-slate-500">{STATUS_LABEL[row.original.status]}</span>
          ),
      },
      {
        accessorKey: 'fare',
        header: ({ column }) => <SortableHeader column={column} label="운임" />,
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">{formatKRW(row.original.fare)}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="번호 또는 출발지 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as 'ALL' | DispatchOrderStatus)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">상태 전체</SelectItem>
            <SelectItem value="OPEN">매칭 대기</SelectItem>
            <SelectItem value="ASSIGNED">배정됨</SelectItem>
            <SelectItem value="COMPLETED">완료</SelectItem>
            <SelectItem value="CANCELLED">취소</SelectItem>
          </SelectContent>
        </Select>
        <Select value={portFilter} onValueChange={(v) => setPortFilter(v as 'ALL' | PortCode)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">항만 전체</SelectItem>
            <SelectItem value="BUSAN">부산항</SelectItem>
            <SelectItem value="BUSAN_NEW">부산신항</SelectItem>
            <SelectItem value="INCHEON">인천항</SelectItem>
            <SelectItem value="GWANGYANG">광양항</SelectItem>
            <SelectItem value="PYEONGTAEK">평택항</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="조건에 해당하는 배차가 없습니다"
        onRowClick={(row) => router.push(`/forwarder/dispatch/${row.id}`)}
      />
    </div>
  );
}

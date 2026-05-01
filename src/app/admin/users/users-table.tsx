'use client';

import { useMemo, useState, useTransition } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { type UserRole, type UserStatus, UserStatus as UserStatusEnum } from '@prisma/client';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DataTable, SortableHeader } from '@/components/forwarder/DataTable';
import { updateUserStatusAction } from './actions';

export interface UserRow {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: UserRole;
  status: UserStatus;
  company: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

const ROLE_LABEL: Record<UserRole, string> = {
  DRIVER: '차주',
  CARRIER: '운송사',
  FORWARDER: '포워더',
  ADMIN: '관리자',
};

const STATUS_LABEL: Record<UserStatus, string> = {
  PENDING_APPROVAL: '승인 대기',
  ACTIVE: '활성',
  SUSPENDED: '정지',
};

const STATUS_BADGE: Record<UserStatus, string> = {
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700',
  ACTIVE: 'bg-emerald-50 text-brand-success',
  SUSPENDED: 'bg-rose-50 text-brand-error',
};

function formatDate(iso: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function UsersTable({ rows, currentUserId }: { rows: UserRow[]; currentUserId: string }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (roleFilter !== 'ALL' && r.role !== roleFilter) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (q) {
        const hay = `${r.name} ${r.email ?? ''} ${r.phone} ${r.company ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, roleFilter, statusFilter]);

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <SortableHeader column={column} label="이름" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{row.original.name}</span>
            {row.original.company && (
              <span className="text-[11px] text-slate-500">{row.original.company}</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: '역할',
        cell: ({ row }) => (
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
            {ROLE_LABEL[row.original.role]}
          </span>
        ),
      },
      {
        accessorKey: 'phone',
        header: '연락처',
        cell: ({ row }) => (
          <div className="flex flex-col tabular-nums">
            <span className="text-slate-900">{row.original.phone}</span>
            {row.original.email && (
              <span className="text-[11px] text-slate-500">{row.original.email}</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: '상태',
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[row.original.status]}`}
          >
            {STATUS_LABEL[row.original.status]}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <SortableHeader column={column} label="가입" />,
        cell: ({ row }) => (
          <span className="text-[11.5px] tabular-nums text-slate-500">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: 'lastLoginAt',
        header: '마지막 로그인',
        cell: ({ row }) => (
          <span className="text-[11.5px] tabular-nums text-slate-500">
            {formatDate(row.original.lastLoginAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '액션',
        cell: ({ row }) => <UserActionCell row={row.original} currentUserId={currentUserId} />,
      },
    ],
    [currentUserId],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="이름 / 이메일 / 휴대폰 / 회사 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as 'ALL' | UserRole)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">역할 전체</SelectItem>
            <SelectItem value="DRIVER">차주</SelectItem>
            <SelectItem value="CARRIER">운송사</SelectItem>
            <SelectItem value="FORWARDER">포워더</SelectItem>
            <SelectItem value="ADMIN">관리자</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as 'ALL' | UserStatus)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">상태 전체</SelectItem>
            <SelectItem value="PENDING_APPROVAL">승인 대기</SelectItem>
            <SelectItem value="ACTIVE">활성</SelectItem>
            <SelectItem value="SUSPENDED">정지</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="조건에 해당하는 사용자가 없습니다"
      />
    </div>
  );
}

function UserActionCell({ row, currentUserId }: { row: UserRow; currentUserId: string }) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  if (row.id === currentUserId) {
    return <span className="text-[11px] text-slate-400">본인</span>;
  }

  const handleAction = (next: UserStatus) => {
    setErr(null);
    startTransition(async () => {
      const res = await updateUserStatusAction(row.id, next);
      if (!res.ok) setErr(res.message);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        {row.status === UserStatusEnum.PENDING_APPROVAL && (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => handleAction(UserStatusEnum.ACTIVE)}
            className="h-7 bg-brand-success px-3 text-[11px] hover:bg-brand-success/90"
          >
            승인
          </Button>
        )}
        {row.status === UserStatusEnum.ACTIVE && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => handleAction(UserStatusEnum.SUSPENDED)}
            className="h-7 border-brand-error/40 px-3 text-[11px] text-brand-error hover:bg-brand-error/10"
          >
            정지
          </Button>
        )}
        {row.status === UserStatusEnum.SUSPENDED && (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => handleAction(UserStatusEnum.ACTIVE)}
            className="h-7 bg-brand-info px-3 text-[11px] hover:bg-brand-info/90"
          >
            재활성
          </Button>
        )}
      </div>
      {err && <span className="text-[10px] text-brand-error">{err}</span>}
    </div>
  );
}

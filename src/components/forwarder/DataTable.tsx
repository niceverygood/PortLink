'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
  pageSize?: number;
  /** 행 클릭 시 호출 (행 데이터 전달). */
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = '데이터가 없습니다',
  pageSize = 20,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-caption uppercase tracking-wide text-slate-500"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-body-sm text-slate-500"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(onRowClick && 'cursor-pointer hover:bg-slate-50')}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-body-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-body-sm text-slate-500">
          <div>
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()} 페이지 (총{' '}
            {table.getFilteredRowModel().rows.length}건)
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              이전
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              다음
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** 정렬 가능한 컬럼 헤더 */
export function SortableHeader({
  column,
  label,
}: {
  column: { toggleSorting: (asc: boolean) => void; getIsSorted: () => false | 'asc' | 'desc' };
  label: string;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 hover:text-slate-700"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      <ArrowUpDown className="size-3" />
    </button>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Truck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin/dashboard', label: '대시보드', Icon: LayoutDashboard },
  { href: '/admin/users', label: '회원 관리', Icon: Users },
  { href: '/admin/dispatches', label: '배차 모니터링', Icon: Truck },
  { href: '/admin/anomaly', label: '이상 거래', Icon: AlertTriangle },
] as const;

interface Props {
  userName?: string;
}

export function AdminSidebar({ userName }: Props) {
  const pathname = usePathname();
  const initial = (userName ?? '관').slice(0, 1);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-100 bg-white lg:flex">
      <div className="border-b border-slate-100 px-5 py-5">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-navy">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="5" r="3" />
              <line x1="12" y1="22" x2="12" y2="8" />
              <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
            </svg>
          </span>
          <span className="text-[17px] font-bold tracking-tight text-brand-navy">PortLink</span>
          <span className="ml-1 rounded bg-brand-error px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white">
            ADMIN
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-3">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] transition-colors',
                active
                  ? 'bg-brand-navy font-semibold text-white'
                  : 'font-medium text-slate-700 hover:bg-slate-50',
              )}
            >
              <Icon className="size-[17px]" strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-brand-error text-[13px] font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold text-brand-navy">관리자</p>
            <p className="truncate text-[11px] text-slate-500">{userName ?? '시스템'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

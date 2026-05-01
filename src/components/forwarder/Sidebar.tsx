'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Truck, Users, CircleDollarSign, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  userName?: string;
  companyName?: string | null;
  role?: 'FORWARDER' | 'CARRIER' | 'ADMIN';
}

const NAV = [
  { href: '/forwarder/dashboard', label: '대시보드', Icon: Home },
  { href: '/forwarder/dispatch', label: '배차 관리', Icon: Truck },
  { href: '/forwarder/drivers', label: '차주 풀', Icon: Users },
  { href: '/forwarder/settlement', label: '정산', Icon: CircleDollarSign },
  { href: '/forwarder/documents', label: '서류', Icon: FileText },
  { href: '/forwarder/settings', label: '설정', Icon: Settings },
] as const;

const ROLE_LABEL = { FORWARDER: '포워더', CARRIER: '운송사', ADMIN: '관리자' } as const;

export function Sidebar({ userName, companyName, role }: Props) {
  const pathname = usePathname();
  const initial = (companyName ?? userName ?? '한').slice(0, 1);
  const roleLabel = role ? ROLE_LABEL[role] : '담당자';

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-100 bg-white lg:flex">
      <div className="border-b border-slate-100 px-5 py-5">
        <Link href="/forwarder/dashboard" className="flex items-center gap-2">
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
        </Link>
      </div>

      <nav className="flex-1 p-3">
        {NAV.map(({ href, label, Icon }) => {
          const active =
            href === '/forwarder/dispatch'
              ? pathname === href || pathname.startsWith('/forwarder/dispatch/')
              : pathname === href;
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
          <div className="flex size-9 items-center justify-center rounded-full bg-brand-navy text-[13px] font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold text-brand-navy">
              {companyName ?? userName ?? '담당자'}
            </p>
            <p className="truncate text-[11px] text-slate-500">
              {userName && companyName ? `${userName} · ${roleLabel}` : roleLabel}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

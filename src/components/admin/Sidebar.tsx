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

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-brand-navy-dark text-white lg:flex lg:flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <Link href="/admin/dashboard" className="text-h2 font-bold tracking-tight">
          PortLink
        </Link>
        <span className="rounded bg-brand-error px-1.5 py-0.5 text-caption font-bold tracking-wider text-white">
          ADMIN
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-body-sm transition-colors',
                active
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-5 py-4 text-caption text-white/40">
        © PortLink · 관리자 백오피스
      </div>
    </aside>
  );
}

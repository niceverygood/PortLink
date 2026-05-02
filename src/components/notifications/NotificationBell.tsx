'use client';

/**
 * 인앱 알림 종 + 드롭다운 패널.
 *
 * - 마운트 시 + 30초마다 fetch (간단한 폴링; WebSocket은 Phase 2).
 * - 미읽음 카운트 배지 표시.
 * - 패널 열면 fresh fetch.
 * - 항목 클릭 → markAsRead + (link 있으면) navigate.
 * - "모두 읽음" 버튼.
 *
 * 변형:
 *   variant="dark"  → 차주 헤더 (네이비 배경, 흰 종)
 *   variant="light" → 포워더/admin Topbar (흰 배경, 슬레이트 종)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  ok: true;
  data: { items: NotificationItem[]; unreadCount: number };
}

const POLL_INTERVAL_MS = 30_000;

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return '방금';
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

const TYPE_DOT_COLOR: Record<string, string> = {
  DISPATCH_NEW: 'bg-brand-orange',
  DISPATCH_ACCEPTED: 'bg-emerald-500',
  TRIP_DEPARTED: 'bg-sky-500',
  TRIP_LOADED: 'bg-sky-500',
  TRIP_UNLOADED: 'bg-sky-500',
  TRIP_COMPLETED: 'bg-emerald-500',
  TRIP_CANCELLED: 'bg-rose-500',
  SETTLEMENT_READY: 'bg-amber-500',
  SETTLEMENT_PAID: 'bg-emerald-500',
  ADMIN_APPROVAL: 'bg-amber-500',
  ANOMALY_DETECTED: 'bg-rose-500',
  SYSTEM: 'bg-slate-400',
};

export function NotificationBell({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (!res.ok) return;
      const json = (await res.json()) as NotificationsResponse;
      if (!json.ok) return;
      setItems(json.data.items);
      setUnread(json.data.unreadCount);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    const t = setInterval(() => void fetchData(), POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [fetchData]);

  // 외부 클릭 닫기
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  async function onItemClick(n: NotificationItem) {
    if (!n.readAt) {
      // optimistic
      setItems((prev) =>
        prev.map((it) => (it.id === n.id ? { ...it, readAt: new Date().toISOString() } : it)),
      );
      setUnread((c) => Math.max(0, c - 1));
      void fetch(`/api/notifications/${n.id}/read`, { method: 'POST' });
    }
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  }

  async function onReadAll() {
    if (unread === 0) return;
    setItems((prev) =>
      prev.map((it) => ({ ...it, readAt: it.readAt ?? new Date().toISOString() })),
    );
    setUnread(0);
    await fetch('/api/notifications/read-all', { method: 'POST' });
  }

  const isDark = variant === 'dark';

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label={`알림 ${unread}건`}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void fetchData();
        }}
        className={cn(
          'relative inline-flex size-9 items-center justify-center rounded-md transition-colors',
          isDark ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-50',
        )}
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold leading-none text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-[320px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg',
            // 위치: 차주(다크 hero)는 좌측 여유가 부족하니 right-0
            'right-0',
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-[13px] font-bold text-brand-navy">알림</p>
            <button
              type="button"
              onClick={() => void onReadAll()}
              disabled={unread === 0}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-brand-navy disabled:opacity-40"
            >
              <CheckCheck className="size-3" />
              모두 읽음
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="px-4 py-10 text-center text-[12px] text-slate-400">불러오는 중…</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center text-[12px] text-slate-400">
                알림이 없습니다
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((n) => {
                  const dot = TYPE_DOT_COLOR[n.type] ?? 'bg-slate-400';
                  const unreadStyle = !n.readAt;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => void onItemClick(n)}
                        className={cn(
                          'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50',
                          unreadStyle && 'bg-amber-50/40',
                        )}
                      >
                        <span className="mt-1.5 flex size-2 shrink-0 rounded-full">
                          <span className={cn('size-2 rounded-full', dot)} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'truncate text-[13px]',
                              unreadStyle
                                ? 'font-bold text-brand-navy'
                                : 'font-medium text-slate-700',
                            )}
                          >
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="mt-0.5 line-clamp-2 text-[12px] text-slate-500">
                              {n.body}
                            </p>
                          )}
                          <p className="mt-1 text-[11px] text-slate-400">
                            {formatRelative(n.createdAt)}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

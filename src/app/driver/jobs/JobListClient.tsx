'use client';

/**
 * 차주 가용 배차 리스트 — 클라이언트 측 거리 정렬 wrapper.
 *
 * 마운트 시 navigator.geolocation 1회 호출 (B 위치 기반 매칭):
 * - 권한 허용 → 각 배차 출발지/항만과 Haversine 거리 계산 → "가까운 순" 정렬
 * - 거부/타임아웃 → 원래 pickupAt 순서 그대로
 *
 * 좌표 사전(REGION_COORDS, PORT_COORDS)은 server에서 props로 내려옴.
 * 위치는 메모리에만 유지, 서버 전송 X.
 */
import { useEffect, useMemo, useState } from 'react';
import type { ContainerType, PortCode } from '@prisma/client';
import { captureLocationOnce } from '@/lib/geolocation';
import { formatDistance, haversineMeters } from '@/lib/distance';
import { JobCard } from './job-card';

interface JobItem {
  id: string;
  orderNo: string;
  originRegion: string;
  port: PortCode;
  containerType: ContainerType;
  pickupAt: string;
  fare: number;
  urgent: boolean;
  /** 출발지 좌표 (server에서 주입). 없으면 거리 정렬 대상 X. */
  originCoord: { lat: number; lng: number } | null;
}

interface Props {
  items: JobItem[];
}

type SortMode = 'distance' | 'pickup';

export function JobListClient({ items }: Props) {
  const [myLoc, setMyLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [permState, setPermState] = useState<'idle' | 'asking' | 'granted' | 'denied'>('idle');
  const [sortMode, setSortMode] = useState<SortMode>('pickup');

  useEffect(() => {
    setPermState('asking');
    void captureLocationOnce().then((loc) => {
      if (loc) {
        setMyLoc({ lat: loc.latitude, lng: loc.longitude });
        setPermState('granted');
        setSortMode('distance');
      } else {
        setPermState('denied');
      }
    });
  }, []);

  const enriched = useMemo(() => {
    return items.map((it) => {
      const distM =
        myLoc && it.originCoord
          ? haversineMeters(myLoc.lat, myLoc.lng, it.originCoord.lat, it.originCoord.lng)
          : null;
      return { ...it, distM };
    });
  }, [items, myLoc]);

  const sorted = useMemo(() => {
    if (sortMode !== 'distance' || !myLoc) return enriched;
    return [...enriched].sort((a, b) => {
      if (a.distM === null && b.distM === null) return 0;
      if (a.distM === null) return 1;
      if (b.distM === null) return -1;
      return a.distM - b.distM;
    });
  }, [enriched, sortMode, myLoc]);

  return (
    <>
      {permState === 'granted' && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11.5px]">
          <span className="text-slate-600">가까운 배차부터 정렬됨</span>
          <button
            type="button"
            onClick={() => setSortMode((m) => (m === 'distance' ? 'pickup' : 'distance'))}
            className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700"
          >
            {sortMode === 'distance' ? '시간 순으로' : '거리 순으로'}
          </button>
        </div>
      )}
      {permState === 'denied' && (
        <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10.5px] text-slate-500">
          위치 권한 없음 — 시간 순으로 정렬됩니다 (위치 허용 시 가까운 배차가 위로)
        </div>
      )}
      <div className="space-y-3">
        {sorted.map((it) => (
          <JobCard
            key={it.id}
            id={it.id}
            orderNo={it.orderNo}
            originRegion={it.originRegion}
            port={it.port}
            containerType={it.containerType}
            pickupAt={it.pickupAt}
            fare={it.fare}
            urgent={it.urgent}
            distanceLabel={it.distM !== null ? formatDistance(it.distM) : undefined}
          />
        ))}
      </div>
    </>
  );
}

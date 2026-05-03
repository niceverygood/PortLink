'use client';

/**
 * Trip 완료 직후 — 차주 현재 위치에서 가장 가까운 OPEN 배차 1건 추천.
 *
 * 마운트 시:
 * 1) navigator.geolocation으로 현재 좌표 capture
 * 2) /api/driver/nearby-open?lat=&lng=&excludeTripId=tripId 호출
 * 3) 결과 있으면 카드 표시 (없으면 미노출)
 *
 * 가치: Trip 종료 직후 빈 차로 멀리 가지 않게 가까운 다음 배차 즉시 안내.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin, Sparkles } from 'lucide-react';
import { captureLocationOnce } from '@/lib/geolocation';
import { formatDistance } from '@/lib/distance';

interface Recommendation {
  id: string;
  orderNo: string;
  originRegion: string;
  port: string;
  containerType: string;
  fare: number;
  pickupAt: string;
  distanceM: number;
}

export function NearbyOpenRecommendation({ tripId }: { tripId: string }) {
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loc = await captureLocationOnce();
      if (!loc || cancelled) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/driver/nearby-open?lat=${loc.latitude}&lng=${loc.longitude}&excludeTripId=${tripId}`,
          { cache: 'no-store' },
        );
        if (!res.ok) return;
        const json = await res.json();
        if (!json.ok || cancelled) return;
        setRec(json.data?.recommendation ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  if (loading) return null;
  if (!rec) return null;

  const fareManwon = Math.round(rec.fare / 10_000);
  const originShort = rec.originRegion.split(' ').pop() ?? rec.originRegion;

  return (
    <section className="mx-4 mt-4 rounded-3xl border-2 border-brand-orange bg-orange-50/60 p-4">
      <div className="mb-2 flex items-center gap-1.5">
        <Sparkles className="size-3.5 text-brand-orange" />
        <p className="text-[11px] font-bold uppercase text-brand-orange">가까운 다음 배차 추천</p>
      </div>
      <div className="mb-2 flex items-end justify-between">
        <div>
          <p className="text-[11px] text-slate-500">
            {originShort} → {rec.port}
          </p>
          <p className="text-[24px] font-black tabular-nums leading-none text-brand-navy">
            {fareManwon}
            <span className="ml-1 text-[14px]">만원</span>
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5">
          <MapPin className="size-3 text-emerald-700" />
          <span className="text-[11px] font-bold text-emerald-700">
            {formatDistance(rec.distanceM)}
          </span>
        </div>
      </div>
      <Link
        href={`/driver/jobs/${rec.id}`}
        className="flex items-center justify-center gap-1 rounded-2xl bg-brand-orange py-2.5 text-[13px] font-bold text-white"
      >
        지금 보기 <ArrowRight className="size-4" />
      </Link>
      <p className="mt-1.5 text-center text-[10px] text-slate-500">
        빈 차로 돌아가지 마세요 · 공차 운행 비용 절감
      </p>
    </section>
  );
}

'use client';

/**
 * 공차 운행 §14 안내 카드 — Stage 9-prep.
 *
 * 카피 원칙 (법적 안전):
 * - PortLink는 자동 청구 X
 * - 차주가 권리 행사 여부 직접 결정
 * - "청구 가능액"이 아니라 "법정 보상 권리" 안내
 *
 * 동작:
 * 1) 마운트 시 1회 POST /notice-shown (status DETECTED → NOTICE_SHOWN)
 * 2) "청구서 양식 다운로드" 버튼 → GET /pdf (응답 시 status PDF_DOWNLOADED 자동)
 */
import { useEffect, useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';

interface Props {
  chargeId: string;
  distanceKm: number;
  chargeKrw: number;
  orderNo: string;
}

export function EmptyRunNoticeCard({ chargeId, distanceKm, chargeKrw, orderNo }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 마운트 시 NOTICE_SHOWN 1회 (fire-and-forget)
  useEffect(() => {
    void fetch(`/api/driver/empty-run/${chargeId}/notice-shown`, { method: 'POST' });
  }, [chargeId]);

  async function onDownload() {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(`/api/driver/empty-run/${chargeId}/pdf`);
      if (!res.ok) {
        let msg = `양식 생성 실패 (${res.status})`;
        try {
          const j = await res.json();
          msg = j?.error?.message ?? msg;
        } catch {
          /* noop */
        }
        setError(msg);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `empty-run-claim-${orderNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section className="mb-4 rounded-3xl border-2 border-emerald-300 bg-emerald-50/60 p-4">
      <div className="mb-1.5 flex items-center gap-1.5">
        <FileText className="size-3.5 text-emerald-700" />
        <span className="text-[10.5px] font-bold uppercase text-emerald-700">
          💡 안전운임 제14조 안내
        </span>
      </div>
      <p className="text-[13px] font-bold leading-snug text-emerald-900">
        직전 운송지에서 {distanceKm.toFixed(1)}km 빈 차로 이동하셨네요.
      </p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-emerald-900">
        안전운임 §14에 따라 화주 또는 운수사업자에게{' '}
        <span className="text-[14px] font-black tabular-nums">
          {chargeKrw.toLocaleString('ko-KR')}원
        </span>
        의 공차 보상을 청구하실 권리가 있습니다.{' '}
        <strong>청구 여부는 차주님이 직접 판단하셔서 진행하세요.</strong>
      </p>
      <button
        type="button"
        onClick={() => void onDownload()}
        disabled={downloading}
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-[12px] font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {downloading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Download className="size-3.5" />
        )}
        {downloading ? '양식 생성 중…' : '청구서 양식 다운로드'}
      </button>
      {error && <p className="mt-1 text-[11px] text-rose-700">{error}</p>}
      <p className="mt-2 text-[10px] leading-relaxed text-emerald-700/80">
        ※ PortLink는 청구를 대신 발송하지 않습니다. 양식만 제공하며, 청구 여부와 내용에 대한 책임은
        차주 본인에게 있습니다.
      </p>
    </section>
  );
}

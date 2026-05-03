'use client';

/**
 * 포워더 청구서 PDF 다운로드 버튼.
 *
 * - POST /api/freight/invoice/[id] { format: 'pdf' } 호출
 * - 응답 blob을 <a download>로 트리거
 * - 파일명: portlink-invoice-{orderNo}-{YYYYMMDD}.pdf
 * - disabled 상태면 회색 + 툴팁 (예: 환적 컨테이너)
 *
 * 권한 가드는 API에 위임 (forwarder 본인 발주만 통과). 클라에선 처리 X.
 */
import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface Props {
  orderId: string;
  orderNo: string;
  /** outline=Topbar 우상단 작은 버튼, primary=운임 카드 옆 본문 버튼 */
  variant?: 'outline' | 'primary';
  disabled?: boolean;
  disabledReason?: string;
}

function todayStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

export function InvoiceDownloadButton({
  orderId,
  orderNo,
  variant = 'primary',
  disabled = false,
  disabledReason,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (disabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/freight/invoice/${orderId}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ format: 'pdf' }),
      });
      if (!res.ok) {
        // JSON 에러 메시지 시도
        let msg = `청구서 생성 실패 (${res.status})`;
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
      a.download = `portlink-invoice-${orderNo}-${todayStamp()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  const baseDisabled = disabled || loading;
  const className =
    variant === 'outline'
      ? 'inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
      : 'inline-flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2 text-[13px] font-bold text-white hover:bg-brand-navy-dark disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={baseDisabled}
        title={disabled ? disabledReason : undefined}
        className={className}
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Download className="size-3.5" />
        )}
        {loading ? '생성 중…' : '청구서 다운로드'}
      </button>
      {error && <p className="text-[11px] text-rose-700">{error}</p>}
    </div>
  );
}

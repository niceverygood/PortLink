'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

export function ReportDownloadButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/freight/report/${orderId}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ format: 'pdf' }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(`PDF 생성 실패 (${res.status})`);
        console.error(text);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-4 text-[15px] font-bold text-white hover:bg-rose-700 disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        {loading ? '생성 중…' : '신고서 PDF 다운로드'}
      </button>
      {error && <p className="text-center text-[12px] text-rose-700">{error}</p>}
    </>
  );
}

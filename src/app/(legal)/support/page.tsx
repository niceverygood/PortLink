import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '지원·문의 | PortLink',
  description: 'PortLink 고객지원 — 연락 채널, 자주 묻는 질문, 응답 가이드.',
  robots: { index: true, follow: true },
};

export const dynamic = 'force-static';

export default function SupportPage() {
  return (
    <div className="space-y-8 text-slate-700 leading-relaxed">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-h1 font-bold text-slate-900">지원·문의</h1>
        <p className="mt-2 text-body-md text-slate-500">
          차주님과 담당자님의 문의를 평일 09:00 ~ 18:00(KST) 사이에 응대해 드립니다.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-h2 font-bold text-slate-900">고객지원 이메일</h2>
          <p className="mt-2 text-body-sm">
            서비스 문의·계정·정산 등 일반 문의는 이메일로 부탁드립니다.
          </p>
          <p className="mt-3">
            <a className="font-mono text-brand-orange underline" href="mailto:support@portlink.kr">
              support@portlink.kr
            </a>
          </p>
          <p className="mt-1 text-[11px] text-slate-500">평균 응답 4시간 이내 (영업일 기준)</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-h2 font-bold text-slate-900">개인정보 문의</h2>
          <p className="mt-2 text-body-sm">
            개인정보 열람·정정·삭제·처리정지 요청은 별도 이메일로 받습니다.
          </p>
          <p className="mt-3">
            <a className="font-mono text-brand-orange underline" href="mailto:privacy@portlink.kr">
              privacy@portlink.kr
            </a>
          </p>
          <p className="mt-1 text-[11px] text-slate-500">「개인정보 보호법」 §35~37</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-h2 font-bold text-slate-900">자주 묻는 질문</h2>

        <details className="group rounded-lg border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer font-semibold text-slate-900">
            차주 회원 가입 후 바로 배차를 받을 수 있나요?
          </summary>
          <p className="mt-2 text-body-sm">
            가입 후 운영팀의 자격 확인을 거쳐 영업일 기준 1일 이내에 승인됩니다. 화물운송종사자
            자격증 사본과 차량 등록증을 정확하게 등록해 주세요.
          </p>
        </details>

        <details className="group rounded-lg border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer font-semibold text-slate-900">
            안전운임 §14 공차 운행 청구는 PortLink가 대신 해 주나요?
          </summary>
          <p className="mt-2 text-body-sm">
            아닙니다. PortLink는 청구에 필요한 PDF 양식을 자동으로 생성해 드릴 뿐이며, 실제
            청구 여부와 청구 내용, 발송 방법은 차주님께서 직접 결정하셔서 진행하셔야 합니다.
            청구 결과에 대한 책임은 청구인 본인에게 있습니다.
          </p>
        </details>

        <details className="group rounded-lg border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer font-semibold text-slate-900">
            위치 권한을 거부하면 앱이 작동하지 않나요?
          </summary>
          <p className="mt-2 text-body-sm">
            아닙니다. 위치 권한을 거부하셔도 운송은 정상적으로 진행되며, 좌표만 기록되지
            않습니다. 좌표가 없으면 §14 공차 운행 자동 안내가 누락될 수 있으나, 그 외 기능은
            영향을 받지 않습니다. PortLink는 백그라운드에서 위치를 추적하지 않습니다.
          </p>
        </details>

        <details className="group rounded-lg border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer font-semibold text-slate-900">
            정산이 늦거나 미지급된 경우 어떻게 하나요?
          </summary>
          <p className="mt-2 text-body-sm">
            앱 내 “신고서” 메뉴에서 미지급 운임 신고서 PDF를 자동 생성하실 수 있습니다.
            발급된 PDF를 포워더·운수사 또는 관할 관청에 제출하시거나, support@portlink.kr로
            문의 주시면 안내해 드립니다.
          </p>
        </details>

        <details className="group rounded-lg border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer font-semibold text-slate-900">
            iOS/Android 앱은 어디서 다운로드 받나요?
          </summary>
          <p className="mt-2 text-body-sm">
            iOS App Store에서 “PortLink Driver” 검색으로 설치하실 수 있습니다. 출시 일정은
            준비 중이며, 출시 시점에 본 페이지를 통해 안내해 드립니다.
          </p>
        </details>

        <details className="group rounded-lg border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer font-semibold text-slate-900">
            계정을 탈퇴하고 싶습니다.
          </summary>
          <p className="mt-2 text-body-sm">
            앱 내 “내 정보 → 회원 탈퇴”에서 직접 진행하실 수 있습니다. 탈퇴 시 개인정보는
            즉시 파기되며, 법령상 보관 의무가 있는 일부 거래 기록만 정해진 기간 동안 보관됩니다.
            자세한 내용은 <a className="underline" href="/privacy">개인정보 처리방침</a>을 참고해
            주세요.
          </p>
        </details>
      </section>

      <section className="rounded-xl bg-slate-100 p-5 text-body-sm">
        <h2 className="font-bold text-slate-900">App Store 심사 검토자 안내 (English)</h2>
        <p className="mt-2 text-slate-600">
          For App Store reviewers — this support page is publicly accessible without login.
          Demo account: phone <code className="font-mono">010-3000-0001</code>, OTP{' '}
          <code className="font-mono">999999</code> (review-only fixed code, see App Review Notes).
          For any review-related questions, please email{' '}
          <a className="underline" href="mailto:support@portlink.kr">
            support@portlink.kr
          </a>{' '}
          — typical response within 4 hours during 09:00–22:00 KST.
        </p>
      </section>

      <section className="text-[11px] text-slate-500">
        <p>
          PortLink는 운송 거래의 직접 당사자가 아니며, 차주와 포워더 사이의 중개·정보
          제공·서식 자동 생성을 담당합니다. 본 서비스가 발급하는 모든 PDF 서식은 참고
          자료이며, 실제 청구·신고에 따른 책임은 청구인 본인에게 있습니다.
        </p>
      </section>
    </div>
  );
}

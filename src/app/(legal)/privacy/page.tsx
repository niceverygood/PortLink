import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보 처리방침 | PortLink',
  description:
    'PortLink가 수집·이용하는 개인정보 항목, 보유 기간, 위탁 현황 및 정보주체 권리.',
  robots: { index: true, follow: true },
};

export const dynamic = 'force-static';

const EFFECTIVE_DATE = '2026-05-04';

export default function PrivacyPage() {
  return (
    <div className="space-y-6 text-slate-700 leading-relaxed">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-h1 font-bold text-slate-900">개인정보 처리방침</h1>
        <p className="mt-2 text-body-sm text-slate-500">
          시행일: {EFFECTIVE_DATE} · 한국어 (ko-KR)
        </p>
      </header>

      <section>
        <p>
          PortLink(이하 “회사”)는 정보주체의 개인정보를 중요시하며, 「개인정보 보호법」 및
          관계 법령을 준수하기 위해 노력하고 있습니다. 본 개인정보 처리방침은 회사가
          운영하는 PortLink 웹/모바일 서비스(이하 “서비스”)에 적용됩니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">1. 수집하는 개인정보 항목</h2>
        <p>회사는 서비스 제공을 위해 아래 항목을 수집합니다.</p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-body-sm">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border border-slate-200 px-3 py-2">구분</th>
                <th className="border border-slate-200 px-3 py-2">항목</th>
                <th className="border border-slate-200 px-3 py-2">수집 시점</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-200 px-3 py-2">필수 (회원)</td>
                <td className="border border-slate-200 px-3 py-2">
                  이름, 휴대폰 번호, 역할(차주/포워더/운송사/관리자)
                </td>
                <td className="border border-slate-200 px-3 py-2">회원가입</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2">필수 (차주)</td>
                <td className="border border-slate-200 px-3 py-2">
                  화물운송종사자 자격증 번호, 차량번호, 차종, 입금 계좌(은행명·계좌번호)
                </td>
                <td className="border border-slate-200 px-3 py-2">차주 가입 단계</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2">필수 (포워더/운송사)</td>
                <td className="border border-slate-200 px-3 py-2">
                  사업자등록번호, 회사명, 대표자, 연락처
                </td>
                <td className="border border-slate-200 px-3 py-2">법인 가입 단계</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2">선택</td>
                <td className="border border-slate-200 px-3 py-2">이메일 주소</td>
                <td className="border border-slate-200 px-3 py-2">로그인/알림 수신</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2">자동 수집</td>
                <td className="border border-slate-200 px-3 py-2">
                  접속 IP, 접속 일시, 기기 식별값, 푸시 토큰(APNs/FCM), 서비스 이용 기록,
                  오류 진단 데이터
                </td>
                <td className="border border-slate-200 px-3 py-2">서비스 이용 시</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2">자동 수집 (정확한 위치)</td>
                <td className="border border-slate-200 px-3 py-2">
                  GPS 좌표 (위도/경도/정확도)
                </td>
                <td className="border border-slate-200 px-3 py-2">
                  차주가 “출발/상차/하차/완료” 등 운송 단계 액션 버튼을 직접 탭한 시점에 1회
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-3 rounded-lg bg-amber-50 p-3 text-body-sm text-amber-900">
          <p className="font-semibold">위치 정보 사용 원칙</p>
          <ul className="mt-1 list-disc pl-5">
            <li>백그라운드에서는 위치를 추적하지 않습니다.</li>
            <li>액션 시점 1회 캡처에 한해 좌표를 저장합니다.</li>
            <li>
              위치 권한을 거부하셔도 운송은 정상적으로 진행되며, 좌표만 기록되지 않습니다.
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">2. 개인정보 수집·이용 목적</h2>
        <ul className="list-disc pl-5">
          <li>회원 식별, 본인 인증(휴대폰 OTP), 부정 이용 방지</li>
          <li>배차 매칭, 안전운임 자동 검증, 정산 처리, 세금계산서 발급</li>
          <li>안전운임 §14 공차 운행에 따른 보상 청구 양식 제공</li>
          <li>미지급 운임 신고서 양식 제공</li>
          <li>서비스 알림(푸시·앱 내 알림) 발송</li>
          <li>서비스 운영, 서비스 개선, 통계 분석</li>
          <li>보안 사고 대응, 법령상 의무 이행</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">3. 개인정보 보유 및 이용 기간</h2>
        <ul className="list-disc pl-5">
          <li>회원 정보: 회원 탈퇴 시 즉시 파기 (단, 아래 법령상 의무 보관 제외)</li>
          <li>전자상거래법 — 표시·광고 기록 6개월</li>
          <li>전자상거래법 — 계약·청약철회·대금결제·재화공급 기록 5년</li>
          <li>전자상거래법 — 소비자 불만·분쟁처리 기록 3년</li>
          <li>국세기본법 — 세금계산서 등 거래 증빙 5년</li>
          <li>통신비밀보호법 — 로그인 기록 3개월</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">4. 개인정보 제3자 제공</h2>
        <p>
          회사는 정보주체의 동의 없이 개인정보를 외부에 제공하지 않습니다. 단, 다음의 경우는
          예외입니다.
        </p>
        <ul className="list-disc pl-5">
          <li>법령에 의해 요구되는 경우 (수사·재판 등)</li>
          <li>
            배차 매칭의 본질적 목적상 거래 상대방(화주↔차주)에게 필요한 최소 정보(이름,
            휴대폰 번호, 차량번호 등)가 노출되는 경우. 이 경우에도 계좌번호 등 결제 관련
            정보는 거래 당사자에게만 표시됩니다.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">5. 개인정보 처리 위탁</h2>
        <p>회사는 서비스 운영을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다.</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-body-sm">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border border-slate-200 px-3 py-2">수탁자</th>
                <th className="border border-slate-200 px-3 py-2">위탁 업무</th>
                <th className="border border-slate-200 px-3 py-2">개인정보 보유 지역</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-200 px-3 py-2">Vercel Inc.</td>
                <td className="border border-slate-200 px-3 py-2">
                  웹 호스팅, CDN, 서버 실행 환경
                </td>
                <td className="border border-slate-200 px-3 py-2">Seoul (icn1)</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2">Supabase Inc.</td>
                <td className="border border-slate-200 px-3 py-2">데이터베이스 운영</td>
                <td className="border border-slate-200 px-3 py-2">Seoul (ap-northeast-2)</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2">Apple Inc.</td>
                <td className="border border-slate-200 px-3 py-2">iOS 푸시 알림 발송</td>
                <td className="border border-slate-200 px-3 py-2">국외 (Apple APNs)</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2">Functional Software, Inc. (Sentry)</td>
                <td className="border border-slate-200 px-3 py-2">오류 진단</td>
                <td className="border border-slate-200 px-3 py-2">국외 (US)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">6. 정보주체의 권리</h2>
        <p>
          정보주체는 회사에 대해 언제든지 다음 권리를 행사할 수 있습니다. 행사 방법은 본
          처리방침 §10의 연락처로 요청하시기 바랍니다.
        </p>
        <ul className="list-disc pl-5">
          <li>개인정보 열람 요구</li>
          <li>오류 등이 있을 경우 정정 요구</li>
          <li>삭제 요구 (단, 법령상 보관 의무 항목은 제외)</li>
          <li>처리 정지 요구</li>
          <li>회원 탈퇴 (앱 내 “내 정보 → 탈퇴”에서 직접 가능)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">7. 개인정보의 안전성 확보 조치</h2>
        <ul className="list-disc pl-5">
          <li>전송 구간 암호화 (HTTPS/TLS 1.2 이상)</li>
          <li>비밀번호 단방향 해시 저장 (Argon2id)</li>
          <li>관리자 권한 분리 및 접근 로그 기록 (AuditLog)</li>
          <li>이상 거래 감지(룰 기반)와 모니터링</li>
          <li>저장 매체 암호화 (Supabase 디스크 레벨 AES-256)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">8. 광고 식별자·외부 추적 사용 여부</h2>
        <p>
          회사는 IDFA 등 광고 식별자나 외부 광고 SDK, Google Analytics 등 추적 목적의 분석
          SDK를 사용하지 않습니다. App Tracking Transparency(ATT) 프롬프트 또한 노출하지
          않습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">9. 만 14세 미만 아동의 개인정보</h2>
        <p>
          본 서비스는 화물운송 사업자 및 사업체를 위한 B2B 서비스로, 만 14세 미만 아동의
          가입을 받지 않습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">10. 개인정보 보호책임자 및 연락처</h2>
        <p>
          개인정보 관련 문의·열람·정정·삭제·처리정지·이의 제기는 아래 연락처로 부탁드립니다.
        </p>
        <ul className="list-disc pl-5">
          <li>이메일: <a className="underline" href="mailto:privacy@portlink.kr">privacy@portlink.kr</a></li>
          <li>고객지원: <a className="underline" href="mailto:support@portlink.kr">support@portlink.kr</a></li>
        </ul>
        <p className="mt-2">
          기타 개인정보 침해 신고는 다음 기관에 문의하실 수 있습니다.
        </p>
        <ul className="list-disc pl-5">
          <li>개인정보침해신고센터 — privacy.kisa.or.kr / 국번없이 118</li>
          <li>개인정보분쟁조정위원회 — kopico.go.kr / 1833-6972</li>
          <li>대검찰청 사이버수사과 — spo.go.kr / 02-3480-3573</li>
          <li>경찰청 사이버수사국 — ecrm.cyber.go.kr / 국번없이 182</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">11. 변경 이력</h2>
        <ul className="list-disc pl-5">
          <li>{EFFECTIVE_DATE} — 최초 시행</li>
        </ul>
      </section>
    </div>
  );
}

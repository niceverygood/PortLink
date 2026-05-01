# 011 — 정산 발행은 포워더 1-Click DRAFT → CONFIRMED + TaxInvoice

- **Context**: 정산 워크플로 후보 — (a) 자동 즉시 CONFIRMED, (b) 포워더 수동 검토 후 발행, (c) 차주 수령 확인 후 발행. CLAUDE.md §12 시연 시나리오 7번 "차주 1-탭 컨펌 → 세금계산서 역발행"이 있지만 차주 화면 인터랙션은 Stage 6 admin 도입 후 간소화 가능.
- **Decision**: Stage 5는 (b) 채택. `/forwarder/settlement`에서 DRAFT 정산 한 행마다 "확정 발행" 버튼. 클릭 시 트랜잭션으로 `Settlement.status=CONFIRMED` + `TaxInvoice` 자동 생성(invoiceNo 시퀀셜). PAID 상태는 Stage 6/7에서 결제 통합.
- **Consequences**: 시연 시나리오 7번을 차주 1-탭 대신 포워더 1-탭으로 단순화. 도메인 lib(`src/lib/settlement-issue.ts`) 분리로 추후 차주 액션·관리자 액션에서 동일 함수 재사용 가능. 트랜잭션이 invoice unique 위반 시 자동 retry 미구현(`generateInvoiceNo`가 timestamp 기반이라 충돌 가능성 극히 낮음).

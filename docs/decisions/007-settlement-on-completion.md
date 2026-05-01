# 007 — Settlement은 Trip COMPLETED 트랜잭션 안에서 즉시 생성

- **Context**: 정산 시점 후보 — (a) 매일 배치 잡으로 모아서, (b) Trip COMPLETED 시 즉시. (a)는 하루치 한 번 모아 보내는 정형 운영, (b)는 시연·UI에서 차주가 완료 직후 정산 화면에서 바로 확인 가능.
- **Decision**: 즉시 생성. PATCH `/api/trips/:id/status`가 COMPLETED 전환 시 같은 `prisma.$transaction`에서 `Settlement.create({status: DRAFT})` + `DispatchOrder.status = COMPLETED` 일괄 처리. CHECK 제약(`driverPayout + platformFee = fare`)이 정합성 보장.
- **Consequences**: 시연 시나리오 8번이 자연스러움(완료 즉시 정산 노출). 일일 배치 코드 불필요. 단점 — 대량 일괄 정정 시 (a) 패턴이 나았겠지만 MVP 6주 범위에선 발생 가능성 낮음. Phase 2에서 batch reissue 기능이 필요하면 그때 별 잡 추가.

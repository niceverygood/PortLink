# 012 — 관리자 권한 모델

- **Context**: 관리자가 (1) 회원 가입 승인/정지, (2) 모든 배차 모니터링, (3) Trip 강제 취소, (4) 이상 거래 탐지를 수행해야 함. 별도 권한 테이블·세분화된 RBAC vs 단일 ADMIN 역할 중 선택.
- **Decision**: 단일 `UserRole.ADMIN`이 모든 admin 액션 수행. 권한 체크는 Server Action/route 진입 시 `session.user.role === ADMIN` 단일 검증. 모든 admin mutation은 `AuditLog`에 actor + before/after JSON 자동 기록. 강제 취소는 `updateTripStatus(isAdmin: true)` 위임으로 grace 검증 우회.
- **Consequences**: MVP 단순함, 추가 테이블 0. Phase 2에서 부분 권한(예: 정산 전용 회계담당자)이 필요하면 `UserRole`에 enum 추가 + `hasAdminPower(roles[])` 헬퍼 도입. 현재는 `admin@portlink.kr` 1계정만 운영하지만, 추가 ADMIN 사용자도 시드/가입으로 즉시 활성 가능.

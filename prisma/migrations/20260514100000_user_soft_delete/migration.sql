-- App Store 5.1.1(v) 계정 삭제 대응 — soft delete 패턴.
-- 탈퇴 시점만 별도 컬럼으로 기록하고, PII(name/email/phone/passwordHash 등)는
-- 애플리케이션 레이어에서 익명화 후 status를 SUSPENDED로 전환한다.
-- Trip/Settlement 등 세법 5년 보관 의무 row는 유지(Restrict FK 정책 그대로).

ALTER TABLE "users" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- 탈퇴 회원 조회용. status=SUSPENDED + deleted_at IS NOT NULL을 사용한다.
CREATE INDEX "users_deleted_at_idx" ON "users" ("deleted_at");

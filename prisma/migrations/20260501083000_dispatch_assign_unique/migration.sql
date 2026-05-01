-- 한 배차 의뢰에 대해 활성 배정(cancelled_at IS NULL)은 1건만 허용.
-- 취소 후 재배정 가능하도록 partial unique index 사용.

CREATE UNIQUE INDEX "dispatch_assigns_active_uniq"
  ON "dispatch_assigns" ("dispatch_order_id")
  WHERE "cancelled_at" IS NULL;

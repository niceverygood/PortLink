-- 도메인 무결성 CHECK 제약
-- CLAUDE.md §3 — 돈은 정수, 정산 합계는 항상 일치

-- safe_rates: 운임 양수
ALTER TABLE "safe_rates"
  ADD CONSTRAINT "chk_safe_rate_positive_fare" CHECK ("base_fare" > 0);

-- dispatch_orders: 운임 양수
ALTER TABLE "dispatch_orders"
  ADD CONSTRAINT "chk_dispatch_order_positive_fare" CHECK ("fare" > 0);

-- settlements: 양수 + 합계 일치 + 수수료 비음수
ALTER TABLE "settlements"
  ADD CONSTRAINT "chk_settlement_positive_fare" CHECK ("fare" > 0),
  ADD CONSTRAINT "chk_settlement_nonneg_platform_fee" CHECK ("platform_fee" >= 0),
  ADD CONSTRAINT "chk_settlement_nonneg_driver_payout" CHECK ("driver_payout" >= 0),
  ADD CONSTRAINT "chk_settlement_sum" CHECK ("driver_payout" + "platform_fee" = "fare");

-- vehicles: driver 또는 carrier 중 하나는 반드시 owner
ALTER TABLE "vehicles"
  ADD CONSTRAINT "chk_vehicle_owner_present"
  CHECK ("driver_id" IS NOT NULL OR "carrier_id" IS NOT NULL);

-- tax_invoices: 공급가액 양수, 세액 비음수
ALTER TABLE "tax_invoices"
  ADD CONSTRAINT "chk_tax_invoice_positive_amount" CHECK ("amount" > 0),
  ADD CONSTRAINT "chk_tax_invoice_nonneg_tax" CHECK ("tax_amount" >= 0);

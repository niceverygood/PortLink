-- CreateEnum
CREATE TYPE "RateType" AS ENUM ('CONSIGNMENT', 'INTER_CARRIER', 'TRANSPORT');

-- CreateEnum
CREATE TYPE "ShipmentType" AS ENUM ('EXPORT_IMPORT', 'TRANSSHIPMENT');

-- AlterEnum
ALTER TYPE "ContainerType" ADD VALUE '45FT';

-- AlterTable
ALTER TABLE "dispatch_orders" ADD COLUMN     "shipment_type" "ShipmentType" NOT NULL DEFAULT 'EXPORT_IMPORT';

-- CreateTable
CREATE TABLE "safe_freight_yearly_snapshots" (
    "id" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "notice_number" TEXT NOT NULL,
    "notice_date" TIMESTAMP(3) NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safe_freight_yearly_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safe_freight_rates" (
    "id" TEXT NOT NULL,
    "yearly_snapshot_id" TEXT NOT NULL,
    "distance_km" INTEGER NOT NULL,
    "container_type" "ContainerType" NOT NULL,
    "rate_type" "RateType" NOT NULL,
    "amount_krw" INTEGER NOT NULL,

    CONSTRAINT "safe_freight_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surcharge_rules" (
    "id" TEXT NOT NULL,
    "yearly_snapshot_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rate" DECIMAL(5,4) NOT NULL,

    CONSTRAINT "surcharge_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_price_adjustments" (
    "id" TEXT NOT NULL,
    "yearly_snapshot_id" TEXT NOT NULL,
    "quarter_start_date" TIMESTAMP(3) NOT NULL,
    "quarter_end_date" TIMESTAMP(3) NOT NULL,
    "average_diesel_price" INTEGER NOT NULL,
    "baseline_price" INTEGER NOT NULL,
    "adjustment_rate" DECIMAL(6,5) NOT NULL,
    "applied_from" TIMESTAMP(3) NOT NULL,
    "applied_to" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuel_price_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freight_calculations" (
    "id" TEXT NOT NULL,
    "dispatch_order_id" TEXT NOT NULL,
    "container_type" "ContainerType" NOT NULL,
    "origin_port_code" TEXT,
    "origin_address" TEXT NOT NULL,
    "destination_address" TEXT NOT NULL,
    "total_distance_km" DECIMAL(7,2) NOT NULL,
    "base_consignment_rate_krw" INTEGER NOT NULL,
    "base_inter_carrier_rate_krw" INTEGER NOT NULL,
    "base_transport_rate_krw" INTEGER NOT NULL,
    "applied_surcharges" JSONB NOT NULL,
    "effective_surcharge_rate" DECIMAL(5,4) NOT NULL,
    "surcharge_amount_krw" INTEGER NOT NULL,
    "waiting_fee_krw" INTEGER NOT NULL DEFAULT 0,
    "empty_return_fee_krw" INTEGER NOT NULL DEFAULT 0,
    "additional_fees_krw" INTEGER NOT NULL DEFAULT 0,
    "final_consignment_rate_krw" INTEGER NOT NULL,
    "final_inter_carrier_rate_krw" INTEGER NOT NULL,
    "final_transport_rate_krw" INTEGER NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rule_version_snapshot" JSONB NOT NULL,

    CONSTRAINT "freight_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "safe_freight_yearly_snapshots_fiscal_year_key" ON "safe_freight_yearly_snapshots"("fiscal_year");

-- CreateIndex
CREATE INDEX "safe_freight_rates_distance_km_container_type_rate_type_idx" ON "safe_freight_rates"("distance_km", "container_type", "rate_type");

-- CreateIndex
CREATE UNIQUE INDEX "safe_freight_rates_yearly_snapshot_id_distance_km_container_key" ON "safe_freight_rates"("yearly_snapshot_id", "distance_km", "container_type", "rate_type");

-- CreateIndex
CREATE INDEX "surcharge_rules_yearly_snapshot_id_idx" ON "surcharge_rules"("yearly_snapshot_id");

-- CreateIndex
CREATE UNIQUE INDEX "surcharge_rules_yearly_snapshot_id_code_key" ON "surcharge_rules"("yearly_snapshot_id", "code");

-- CreateIndex
CREATE INDEX "fuel_price_adjustments_applied_from_applied_to_idx" ON "fuel_price_adjustments"("applied_from", "applied_to");

-- CreateIndex
CREATE UNIQUE INDEX "freight_calculations_dispatch_order_id_key" ON "freight_calculations"("dispatch_order_id");

-- CreateIndex
CREATE INDEX "freight_calculations_calculated_at_idx" ON "freight_calculations"("calculated_at");

-- AddForeignKey
ALTER TABLE "safe_freight_rates" ADD CONSTRAINT "safe_freight_rates_yearly_snapshot_id_fkey" FOREIGN KEY ("yearly_snapshot_id") REFERENCES "safe_freight_yearly_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surcharge_rules" ADD CONSTRAINT "surcharge_rules_yearly_snapshot_id_fkey" FOREIGN KEY ("yearly_snapshot_id") REFERENCES "safe_freight_yearly_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_price_adjustments" ADD CONSTRAINT "fuel_price_adjustments_yearly_snapshot_id_fkey" FOREIGN KEY ("yearly_snapshot_id") REFERENCES "safe_freight_yearly_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freight_calculations" ADD CONSTRAINT "freight_calculations_dispatch_order_id_fkey" FOREIGN KEY ("dispatch_order_id") REFERENCES "dispatch_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

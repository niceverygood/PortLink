-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('DRIVER', 'CARRIER', 'FORWARDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ContainerType" AS ENUM ('20FT', '40FT', '40FT_HC');

-- CreateEnum
CREATE TYPE "PortCode" AS ENUM ('BUSAN', 'BUSAN_NEW', 'INCHEON', 'GWANGYANG', 'PYEONGTAEK');

-- CreateEnum
CREATE TYPE "DispatchOrderStatus" AS ENUM ('OPEN', 'ASSIGNED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('PENDING', 'DEPARTED', 'LOADED', 'IN_TRANSIT', 'UNLOADED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'LOGIN', 'PERMISSION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "password_hash" TEXT,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "truck_drivers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "driver_code" TEXT NOT NULL,
    "license_no" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "bank_account" TEXT NOT NULL,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 5.0,
    "total_trips" INTEGER NOT NULL DEFAULT 0,
    "carrier_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "truck_drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carriers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "business_reg_no" TEXT NOT NULL,
    "representative" TEXT NOT NULL,
    "is_inhouse" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forwarders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "business_reg_no" TEXT NOT NULL,
    "representative" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forwarders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "plate_no" TEXT NOT NULL,
    "type" "ContainerType" NOT NULL,
    "driver_id" TEXT,
    "carrier_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safe_rates" (
    "id" SERIAL NOT NULL,
    "origin_region" TEXT NOT NULL,
    "port" "PortCode" NOT NULL,
    "container_type" "ContainerType" NOT NULL,
    "base_fare" INTEGER NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safe_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatch_orders" (
    "id" TEXT NOT NULL,
    "order_no" TEXT NOT NULL,
    "forwarder_user_id" TEXT NOT NULL,
    "origin_region" TEXT NOT NULL,
    "origin_address" TEXT NOT NULL,
    "port" "PortCode" NOT NULL,
    "container_type" "ContainerType" NOT NULL,
    "container_no" TEXT,
    "pickup_at" TIMESTAMP(3) NOT NULL,
    "fare" INTEGER NOT NULL,
    "status" "DispatchOrderStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispatch_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatch_assigns" (
    "id" TEXT NOT NULL,
    "dispatch_order_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,

    CONSTRAINT "dispatch_assigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "dispatch_order_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'PENDING',
    "departed_at" TIMESTAMP(3),
    "loaded_at" TIMESTAMP(3),
    "unloaded_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "fare" INTEGER NOT NULL,
    "platform_fee" INTEGER NOT NULL,
    "driver_payout" INTEGER NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'DRAFT',
    "confirmed_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_invoices" (
    "id" TEXT NOT NULL,
    "settlement_id" TEXT NOT NULL,
    "invoice_no" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "tax_amount" INTEGER NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "external_ref" TEXT,

    CONSTRAINT "tax_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "actor_user_id" TEXT,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "truck_drivers_user_id_key" ON "truck_drivers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "truck_drivers_driver_code_key" ON "truck_drivers"("driver_code");

-- CreateIndex
CREATE UNIQUE INDEX "truck_drivers_license_no_key" ON "truck_drivers"("license_no");

-- CreateIndex
CREATE INDEX "truck_drivers_carrier_id_idx" ON "truck_drivers"("carrier_id");

-- CreateIndex
CREATE UNIQUE INDEX "carriers_user_id_key" ON "carriers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "carriers_business_reg_no_key" ON "carriers"("business_reg_no");

-- CreateIndex
CREATE UNIQUE INDEX "forwarders_user_id_key" ON "forwarders"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "forwarders_business_reg_no_key" ON "forwarders"("business_reg_no");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_no_key" ON "vehicles"("plate_no");

-- CreateIndex
CREATE INDEX "vehicles_driver_id_idx" ON "vehicles"("driver_id");

-- CreateIndex
CREATE INDEX "vehicles_carrier_id_idx" ON "vehicles"("carrier_id");

-- CreateIndex
CREATE INDEX "safe_rates_port_container_type_idx" ON "safe_rates"("port", "container_type");

-- CreateIndex
CREATE UNIQUE INDEX "safe_rates_origin_region_port_container_type_effective_from_key" ON "safe_rates"("origin_region", "port", "container_type", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "dispatch_orders_order_no_key" ON "dispatch_orders"("order_no");

-- CreateIndex
CREATE INDEX "dispatch_orders_status_pickup_at_idx" ON "dispatch_orders"("status", "pickup_at");

-- CreateIndex
CREATE INDEX "dispatch_orders_forwarder_user_id_idx" ON "dispatch_orders"("forwarder_user_id");

-- CreateIndex
CREATE INDEX "dispatch_orders_port_container_type_idx" ON "dispatch_orders"("port", "container_type");

-- CreateIndex
CREATE INDEX "dispatch_assigns_dispatch_order_id_idx" ON "dispatch_assigns"("dispatch_order_id");

-- CreateIndex
CREATE INDEX "dispatch_assigns_driver_id_idx" ON "dispatch_assigns"("driver_id");

-- CreateIndex
CREATE UNIQUE INDEX "trips_dispatch_order_id_key" ON "trips"("dispatch_order_id");

-- CreateIndex
CREATE INDEX "trips_driver_id_status_idx" ON "trips"("driver_id", "status");

-- CreateIndex
CREATE INDEX "trips_status_idx" ON "trips"("status");

-- CreateIndex
CREATE UNIQUE INDEX "settlements_trip_id_key" ON "settlements"("trip_id");

-- CreateIndex
CREATE INDEX "settlements_status_idx" ON "settlements"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tax_invoices_settlement_id_key" ON "tax_invoices"("settlement_id");

-- CreateIndex
CREATE UNIQUE INDEX "tax_invoices_invoice_no_key" ON "tax_invoices"("invoice_no");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "truck_drivers" ADD CONSTRAINT "truck_drivers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "truck_drivers" ADD CONSTRAINT "truck_drivers_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carriers" ADD CONSTRAINT "carriers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forwarders" ADD CONSTRAINT "forwarders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "truck_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_orders" ADD CONSTRAINT "dispatch_orders_forwarder_user_id_fkey" FOREIGN KEY ("forwarder_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_assigns" ADD CONSTRAINT "dispatch_assigns_dispatch_order_id_fkey" FOREIGN KEY ("dispatch_order_id") REFERENCES "dispatch_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_assigns" ADD CONSTRAINT "dispatch_assigns_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "truck_drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_dispatch_order_id_fkey" FOREIGN KEY ("dispatch_order_id") REFERENCES "dispatch_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "truck_drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_invoices" ADD CONSTRAINT "tax_invoices_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "settlements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

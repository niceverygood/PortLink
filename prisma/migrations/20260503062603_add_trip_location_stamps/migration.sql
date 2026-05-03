-- CreateEnum
CREATE TYPE "TripStampAction" AS ENUM ('DEPARTED', 'LOADED', 'UNLOADED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "trip_location_stamps" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "action" "TripStampAction" NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "accuracy_m" DECIMAL(8,2),
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_location_stamps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trip_location_stamps_trip_id_idx" ON "trip_location_stamps"("trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "trip_location_stamps_trip_id_action_key" ON "trip_location_stamps"("trip_id", "action");

-- AddForeignKey
ALTER TABLE "trip_location_stamps" ADD CONSTRAINT "trip_location_stamps_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

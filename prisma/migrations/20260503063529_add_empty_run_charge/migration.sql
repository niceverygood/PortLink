-- CreateTable
CREATE TABLE "empty_run_charges" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "based_on_trip_id" TEXT NOT NULL,
    "distance_km" DECIMAL(7,2) NOT NULL,
    "charge_krw" INTEGER NOT NULL,
    "container_type" "ContainerType" NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empty_run_charges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empty_run_charges_trip_id_key" ON "empty_run_charges"("trip_id");

-- CreateIndex
CREATE INDEX "empty_run_charges_based_on_trip_id_idx" ON "empty_run_charges"("based_on_trip_id");

-- AddForeignKey
ALTER TABLE "empty_run_charges" ADD CONSTRAINT "empty_run_charges_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

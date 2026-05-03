-- CreateEnum
CREATE TYPE "EmptyRunChargeStatus" AS ENUM ('DETECTED', 'NOTICE_SHOWN', 'PDF_DOWNLOADED');

-- AlterTable
ALTER TABLE "empty_run_charges" ADD COLUMN     "notice_shown_at" TIMESTAMP(3),
ADD COLUMN     "pdf_downloaded_at" TIMESTAMP(3),
ADD COLUMN     "status" "EmptyRunChargeStatus" NOT NULL DEFAULT 'DETECTED';

-- CreateIndex
CREATE INDEX "empty_run_charges_status_idx" ON "empty_run_charges"("status");

-- TruckDriver: 회원가입 즉시 가입 + onboarding에서 후입력 위해 nullable로 전환
ALTER TABLE "truck_drivers" ALTER COLUMN "license_no" DROP NOT NULL;
ALTER TABLE "truck_drivers" ALTER COLUMN "bank_name" DROP NOT NULL;
ALTER TABLE "truck_drivers" ALTER COLUMN "bank_account" DROP NOT NULL;

-- driverCode 자동 발급용 시퀀스. 기존 시드(D-0001~D-0058) 충돌 회피를 위해 1000부터 시작
CREATE SEQUENCE IF NOT EXISTS "driver_code_seq" START 1000 INCREMENT 1;

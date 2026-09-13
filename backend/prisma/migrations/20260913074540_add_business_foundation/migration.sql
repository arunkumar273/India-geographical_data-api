-- CreateTable
CREATE TABLE "countries" (
    "id" SERIAL NOT NULL,
    "country_code" VARCHAR(3) NOT NULL,
    "country_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "price_monthly" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "daily_request_limit" INTEGER NOT NULL,
    "burst_limit" INTEGER NOT NULL,
    "state_limit" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_country_code_key"
ON "countries"("country_code");

-- CreateIndex
CREATE UNIQUE INDEX "countries_country_name_key"
ON "countries"("country_name");

-- CreateIndex
CREATE INDEX "countries_country_code_idx"
ON "countries"("country_code");

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key"
ON "plans"("code");

-- CreateIndex
CREATE INDEX "plans_is_active_idx"
ON "plans"("is_active");

-- Insert required country before linking existing states
INSERT INTO "countries" ("id", "country_code", "country_name")
VALUES (1, 'IND', 'India')
ON CONFLICT ("id") DO NOTHING;

-- Insert required plans before linking existing users
INSERT INTO "plans"
    ("id", "code", "name", "price_monthly", "daily_request_limit", "burst_limit", "state_limit", "updated_at")
VALUES
    (1, 'FREE', 'Free', 0, 5000, 100, NULL, CURRENT_TIMESTAMP),
    (2, 'PREMIUM', 'Premium', 49, 50000, 500, NULL, CURRENT_TIMESTAMP),
    (3, 'PRO', 'Pro', 199, 300000, 2000, NULL, CURRENT_TIMESTAMP),
    (4, 'UNLIMITED', 'Unlimited', 499, 1000000, 5000, NULL, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- AlterTable
ALTER TABLE "states"
ADD COLUMN "country_id" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "users"
ADD COLUMN "approval_status" VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL',
ADD COLUMN "approved_at" TIMESTAMP(6),
ADD COLUMN "business_name" VARCHAR(200),
ADD COLUMN "gst_number" VARCHAR(20),
ADD COLUMN "phone_number" VARCHAR(30),
ADD COLUMN "plan_id" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "rejected_at" TIMESTAMP(6),
ADD COLUMN "rejection_reason" VARCHAR(500);

-- CreateIndex
CREATE INDEX "states_country_id_idx"
ON "states"("country_id");

-- CreateIndex
CREATE INDEX "users_approval_status_idx"
ON "users"("approval_status");

-- CreateIndex
CREATE INDEX "users_plan_id_idx"
ON "users"("plan_id");

-- CreateIndex
CREATE INDEX "users_business_name_idx"
ON "users"("business_name");

-- AddForeignKey
ALTER TABLE "states"
ADD CONSTRAINT "states_country_id_fkey"
FOREIGN KEY ("country_id")
REFERENCES "countries"("id")
ON DELETE NO ACTION
ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users"
ADD CONSTRAINT "users_plan_id_fkey"
FOREIGN KEY ("plan_id")
REFERENCES "plans"("id")
ON DELETE NO ACTION
ON UPDATE NO ACTION;
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "api_keys" (
    "id" SERIAL NOT NULL,
    "key_hash" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "states" (
    "id" SERIAL NOT NULL,
    "state_code" VARCHAR(2) NOT NULL,
    "state_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" SERIAL NOT NULL,
    "district_code" VARCHAR(3) NOT NULL,
    "district_name" VARCHAR(150) NOT NULL,
    "state_id" INTEGER NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_districts" (
    "id" SERIAL NOT NULL,
    "sub_district_code" VARCHAR(5) NOT NULL,
    "sub_district_name" VARCHAR(150) NOT NULL,
    "district_id" INTEGER NOT NULL,

    CONSTRAINT "sub_districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "villages" (
    "id" BIGSERIAL NOT NULL,
    "village_code" VARCHAR(6) NOT NULL,
    "village_name" VARCHAR(200) NOT NULL,
    "sub_district_id" INTEGER NOT NULL,

    CONSTRAINT "villages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE UNIQUE INDEX "states_state_code_key" ON "states"("state_code");

-- CreateIndex
CREATE INDEX "idx_districts_state_id" ON "districts"("state_id");

-- CreateIndex
CREATE UNIQUE INDEX "districts_state_id_district_code_key" ON "districts"("state_id", "district_code");

-- CreateIndex
CREATE INDEX "idx_sub_districts_district_id" ON "sub_districts"("district_id");

-- CreateIndex
CREATE UNIQUE INDEX "sub_districts_district_id_sub_district_code_key" ON "sub_districts"("district_id", "sub_district_code");

-- CreateIndex
CREATE INDEX "idx_villages_name" ON "villages"("village_name");

-- CreateIndex
CREATE INDEX "idx_villages_sub_district_id" ON "villages"("sub_district_id");

-- CreateIndex
CREATE UNIQUE INDEX "villages_sub_district_id_village_code_key" ON "villages"("sub_district_id", "village_code");

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sub_districts" ADD CONSTRAINT "sub_districts_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "villages" ADD CONSTRAINT "villages_sub_district_id_fkey" FOREIGN KEY ("sub_district_id") REFERENCES "sub_districts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

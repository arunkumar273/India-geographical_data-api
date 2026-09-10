-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'B2B',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys_new" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "key_hash" VARCHAR(255) NOT NULL,
    "secret_hash" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6),

    CONSTRAINT "api_keys_new_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_state_access" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "state_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_state_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_logs" (
    "id" BIGSERIAL NOT NULL,
    "api_key_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "endpoint" VARCHAR(255) NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "status_code" INTEGER NOT NULL,
    "response_time" DOUBLE PRECISION,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_new_key_hash_key" ON "api_keys_new"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_new_user_id_idx" ON "api_keys_new"("user_id");

-- CreateIndex
CREATE INDEX "api_keys_new_key_hash_idx" ON "api_keys_new"("key_hash");

-- CreateIndex
CREATE INDEX "user_state_access_state_id_idx" ON "user_state_access"("state_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_state_access_user_id_state_id_key" ON "user_state_access"("user_id", "state_id");

-- CreateIndex
CREATE INDEX "api_logs_created_at_idx" ON "api_logs"("created_at");

-- CreateIndex
CREATE INDEX "api_logs_user_id_idx" ON "api_logs"("user_id");

-- CreateIndex
CREATE INDEX "api_logs_api_key_id_idx" ON "api_logs"("api_key_id");

-- AddForeignKey
ALTER TABLE "api_keys_new" ADD CONSTRAINT "api_keys_new_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_state_access" ADD CONSTRAINT "user_state_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_state_access" ADD CONSTRAINT "user_state_access_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_logs" ADD CONSTRAINT "api_logs_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys_new"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_logs" ADD CONSTRAINT "api_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

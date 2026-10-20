-- CreateTable
CREATE TABLE "impersonacao_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "alvo_id" TEXT NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "impersonacao_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "impersonacao_logs_created_at_idx" ON "impersonacao_logs"("created_at");

-- AddForeignKey
ALTER TABLE "impersonacao_logs" ADD CONSTRAINT "impersonacao_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impersonacao_logs" ADD CONSTRAINT "impersonacao_logs_alvo_id_fkey" FOREIGN KEY ("alvo_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

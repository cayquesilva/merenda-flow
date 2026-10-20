-- AlterTable
ALTER TABLE "configuracoes" ADD COLUMN "openai_key_enc" TEXT,
ADD COLUMN "openai_key_final" TEXT,
ADD COLUMN "assistente_modelo" TEXT NOT NULL DEFAULT 'gpt-4o-mini';

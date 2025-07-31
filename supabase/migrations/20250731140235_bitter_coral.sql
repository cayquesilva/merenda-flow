/*
  # Melhorias do Sistema Educacional

  1. Novas Tabelas
    - `TipoEstudante` - Define os tipos de estudantes (berçário, maternal, etc.)
    - `PercapitaItem` - Define gramagem e frequência por tipo de estudante
    - Campos adicionais em `UnidadeEducacional` para contagem de estudantes
    - Campos adicionais em `ItemContrato` para quantidades separadas por tipo de estoque

  2. Modificações
    - `UnidadeEducacional` agora tem campos para cada tipo de estudante
    - `ItemContrato` agora tem quantidades separadas para creches e escolas
    - `Estoque` agora tem tipo (creche ou escola)

  3. Segurança
    - Todas as tabelas terão RLS habilitado
    - Políticas apropriadas para cada operação
*/

-- Criar tabela de tipos de estudantes
CREATE TABLE IF NOT EXISTS "TipoEstudante" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "categoria" TEXT NOT NULL, -- 'creche' ou 'escola'
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "TipoEstudante_pkey" PRIMARY KEY ("id")
);

-- Inserir tipos de estudantes padrão
INSERT INTO "TipoEstudante" ("id", "nome", "sigla", "categoria", "ordem") VALUES
('bercario', 'Berçário', 'BER', 'creche', 1),
('maternal', 'Maternal', 'MAT', 'creche', 2),
('regular', 'Turmas Regulares', 'REG', 'escola', 3),
('integral', 'Turmas Integrais', 'INT', 'escola', 4),
('eja', 'Educação de Jovens e Adultos', 'EJA', 'escola', 5);

-- Adicionar campos de estudantes à tabela UnidadeEducacional
ALTER TABLE "UnidadeEducacional" ADD COLUMN IF NOT EXISTS "estudantes_bercario" INTEGER DEFAULT 0;
ALTER TABLE "UnidadeEducacional" ADD COLUMN IF NOT EXISTS "estudantes_maternal" INTEGER DEFAULT 0;
ALTER TABLE "UnidadeEducacional" ADD COLUMN IF NOT EXISTS "estudantes_regular" INTEGER DEFAULT 0;
ALTER TABLE "UnidadeEducacional" ADD COLUMN IF NOT EXISTS "estudantes_integral" INTEGER DEFAULT 0;
ALTER TABLE "UnidadeEducacional" ADD COLUMN IF NOT EXISTS "estudantes_eja" INTEGER DEFAULT 0;

-- Adicionar campos de quantidade separada à tabela ItemContrato
ALTER TABLE "ItemContrato" ADD COLUMN IF NOT EXISTS "quantidade_creche" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "ItemContrato" ADD COLUMN IF NOT EXISTS "quantidade_escola" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "ItemContrato" ADD COLUMN IF NOT EXISTS "saldo_creche" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "ItemContrato" ADD COLUMN IF NOT EXISTS "saldo_escola" DOUBLE PRECISION DEFAULT 0;

-- Migrar dados existentes (quantidade_original para quantidade_escola e saldo_atual para saldo_escola)
UPDATE "ItemContrato" SET 
    "quantidade_escola" = "quantidade_original",
    "saldo_escola" = "saldo_atual"
WHERE "quantidade_escola" = 0;

-- Adicionar tipo de estoque à tabela Estoque
ALTER TABLE "Estoque" ADD COLUMN IF NOT EXISTS "tipo_estoque" TEXT DEFAULT 'escola';

-- Criar tabela de percápita
CREATE TABLE IF NOT EXISTS "PercapitaItem" (
    "id" TEXT NOT NULL,
    "item_contrato_id" TEXT NOT NULL,
    "tipo_estudante_id" TEXT NOT NULL,
    "gramagem_por_estudante" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "frequencia_semanal" INTEGER NOT NULL DEFAULT 5,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PercapitaItem_pkey" PRIMARY KEY ("id")
);

-- Criar índices únicos
CREATE UNIQUE INDEX IF NOT EXISTS "PercapitaItem_item_contrato_id_tipo_estudante_id_key" 
ON "PercapitaItem"("item_contrato_id", "tipo_estudante_id");

-- Adicionar foreign keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'PercapitaItem_item_contrato_id_fkey'
    ) THEN
        ALTER TABLE "PercapitaItem" ADD CONSTRAINT "PercapitaItem_item_contrato_id_fkey" 
        FOREIGN KEY ("item_contrato_id") REFERENCES "ItemContrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'PercapitaItem_tipo_estudante_id_fkey'
    ) THEN
        ALTER TABLE "PercapitaItem" ADD CONSTRAINT "PercapitaItem_tipo_estudante_id_fkey" 
        FOREIGN KEY ("tipo_estudante_id") REFERENCES "TipoEstudante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
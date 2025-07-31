/*
  Warnings:

  - A unique constraint covering the columns `[unidade_educacional_id,item_contrato_id,tipo_estoque]` on the table `Estoque` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Estoque_unidade_educacional_id_item_contrato_id_key";

-- AlterTable
ALTER TABLE "Estoque" ADD COLUMN     "tipo_estoque" TEXT NOT NULL DEFAULT 'escola';

-- AlterTable
ALTER TABLE "ItemContrato" ADD COLUMN     "quantidade_creche" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "quantidade_escola" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "saldo_creche" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "saldo_escola" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "UnidadeEducacional" ADD COLUMN     "estudantes_bercario" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "estudantes_eja" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "estudantes_integral" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "estudantes_maternal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "estudantes_regular" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TipoEstudante" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "TipoEstudante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PercapitaItem" (
    "id" TEXT NOT NULL,
    "gramagem_por_estudante" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "frequencia_semanal" INTEGER NOT NULL DEFAULT 5,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "item_contrato_id" TEXT NOT NULL,
    "tipo_estudante_id" TEXT NOT NULL,

    CONSTRAINT "PercapitaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipoEstudante_sigla_key" ON "TipoEstudante"("sigla");

-- CreateIndex
CREATE UNIQUE INDEX "PercapitaItem_item_contrato_id_tipo_estudante_id_key" ON "PercapitaItem"("item_contrato_id", "tipo_estudante_id");

-- CreateIndex
CREATE UNIQUE INDEX "Estoque_unidade_educacional_id_item_contrato_id_tipo_estoqu_key" ON "Estoque"("unidade_educacional_id", "item_contrato_id", "tipo_estoque");

-- AddForeignKey
ALTER TABLE "PercapitaItem" ADD CONSTRAINT "PercapitaItem_item_contrato_id_fkey" FOREIGN KEY ("item_contrato_id") REFERENCES "ItemContrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PercapitaItem" ADD CONSTRAINT "PercapitaItem_tipo_estudante_id_fkey" FOREIGN KEY ("tipo_estudante_id") REFERENCES "TipoEstudante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

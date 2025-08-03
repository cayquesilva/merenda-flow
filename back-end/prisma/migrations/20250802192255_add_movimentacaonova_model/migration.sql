/*
  Warnings:

  - You are about to drop the column `fotoDescarte` on the `MovimentacaoEstoque` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[foto_descarte_id]` on the table `MovimentacaoEstoque` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "MovimentacaoEstoque" DROP COLUMN "fotoDescarte",
ADD COLUMN     "foto_descarte_id" TEXT,
ADD COLUMN     "unidade_destino_id" TEXT;

-- CreateTable
CREATE TABLE "FotoDescarte" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FotoDescarte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MovimentacaoEstoque_foto_descarte_id_key" ON "MovimentacaoEstoque"("foto_descarte_id");

-- AddForeignKey
ALTER TABLE "MovimentacaoEstoque" ADD CONSTRAINT "MovimentacaoEstoque_unidade_destino_id_fkey" FOREIGN KEY ("unidade_destino_id") REFERENCES "UnidadeEducacional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoEstoque" ADD CONSTRAINT "MovimentacaoEstoque_foto_descarte_id_fkey" FOREIGN KEY ("foto_descarte_id") REFERENCES "FotoDescarte"("id") ON DELETE SET NULL ON UPDATE CASCADE;

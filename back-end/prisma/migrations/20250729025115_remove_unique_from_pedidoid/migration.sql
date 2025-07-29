/*
  Warnings:

  - A unique constraint covering the columns `[pedido_id,unidade_educacional_id]` on the table `Recibo` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Recibo_pedido_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "Recibo_pedido_id_unidade_educacional_id_key" ON "Recibo"("pedido_id", "unidade_educacional_id");

/*
  Warnings:

  - You are about to drop the `estoques_almoxarifado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `itens_almoxarifado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `itens_pedido_almoxarifado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `itens_recibo_almoxarifado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `movimentacoes_estoque_almoxarifado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pedidos_almoxarifado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `recibos_almoxarifado` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "estoques_almoxarifado" DROP CONSTRAINT "estoques_almoxarifado_item_almoxarifado_id_fkey";

-- DropForeignKey
ALTER TABLE "estoques_almoxarifado" DROP CONSTRAINT "estoques_almoxarifado_unidade_educacional_id_fkey";

-- DropForeignKey
ALTER TABLE "itens_almoxarifado" DROP CONSTRAINT "itens_almoxarifado_contrato_id_fkey";

-- DropForeignKey
ALTER TABLE "itens_almoxarifado" DROP CONSTRAINT "itens_almoxarifado_unidade_medida_id_fkey";

-- DropForeignKey
ALTER TABLE "itens_pedido_almoxarifado" DROP CONSTRAINT "itens_pedido_almoxarifado_item_almoxarifado_id_fkey";

-- DropForeignKey
ALTER TABLE "itens_pedido_almoxarifado" DROP CONSTRAINT "itens_pedido_almoxarifado_pedido_id_fkey";

-- DropForeignKey
ALTER TABLE "itens_pedido_almoxarifado" DROP CONSTRAINT "itens_pedido_almoxarifado_unidade_educacional_id_fkey";

-- DropForeignKey
ALTER TABLE "itens_recibo_almoxarifado" DROP CONSTRAINT "itens_recibo_almoxarifado_item_pedido_id_fkey";

-- DropForeignKey
ALTER TABLE "itens_recibo_almoxarifado" DROP CONSTRAINT "itens_recibo_almoxarifado_recibo_id_fkey";

-- DropForeignKey
ALTER TABLE "movimentacoes_estoque_almoxarifado" DROP CONSTRAINT "movimentacoes_estoque_almoxarifado_estoque_id_fkey";

-- DropForeignKey
ALTER TABLE "movimentacoes_estoque_almoxarifado" DROP CONSTRAINT "movimentacoes_estoque_almoxarifado_recibo_id_fkey";

-- DropForeignKey
ALTER TABLE "pedidos_almoxarifado" DROP CONSTRAINT "pedidos_almoxarifado_contrato_id_fkey";

-- DropForeignKey
ALTER TABLE "recibos_almoxarifado" DROP CONSTRAINT "recibos_almoxarifado_pedido_id_fkey";

-- DropForeignKey
ALTER TABLE "recibos_almoxarifado" DROP CONSTRAINT "recibos_almoxarifado_unidade_educacional_id_fkey";

-- DropTable
DROP TABLE "estoques_almoxarifado";

-- DropTable
DROP TABLE "itens_almoxarifado";

-- DropTable
DROP TABLE "itens_pedido_almoxarifado";

-- DropTable
DROP TABLE "itens_recibo_almoxarifado";

-- DropTable
DROP TABLE "movimentacoes_estoque_almoxarifado";

-- DropTable
DROP TABLE "pedidos_almoxarifado";

-- DropTable
DROP TABLE "recibos_almoxarifado";

-- CreateTable
CREATE TABLE "almoxarifado_insumos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "unidade_medida_id" TEXT NOT NULL,

    CONSTRAINT "almoxarifado_insumos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "almoxarifado_entradas_estoque" (
    "id" TEXT NOT NULL,
    "nota_fiscal" TEXT NOT NULL,
    "data_entrada" TIMESTAMP(3) NOT NULL,
    "fornecedor_id" TEXT NOT NULL,
    "valor_total" DOUBLE PRECISION,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "almoxarifado_entradas_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "almoxarifado_itens_entrada_estoque" (
    "id" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "valor_unitario" DOUBLE PRECISION,
    "entrada_id" TEXT NOT NULL,
    "insumo_id" TEXT NOT NULL,

    CONSTRAINT "almoxarifado_itens_entrada_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "almoxarifado_estoque_central" (
    "id" TEXT NOT NULL,
    "quantidade_atual" DOUBLE PRECISION NOT NULL,
    "insumo_id" TEXT NOT NULL,

    CONSTRAINT "almoxarifado_estoque_central_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "almoxarifado_movimentacoes_central" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "quantidade_anterior" DOUBLE PRECISION NOT NULL,
    "quantidade_nova" DOUBLE PRECISION NOT NULL,
    "responsavel" TEXT NOT NULL,
    "data_movimentacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estoque_id" TEXT NOT NULL,
    "entrada_estoque_id" TEXT,
    "guia_de_remessa_id" TEXT,

    CONSTRAINT "almoxarifado_movimentacoes_central_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "almoxarifado_guias_remessa" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "data_emissao" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "unidade_educacional_id" TEXT NOT NULL,

    CONSTRAINT "almoxarifado_guias_remessa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "almoxarifado_itens_guia_remessa" (
    "id" TEXT NOT NULL,
    "quantidade_enviada" DOUBLE PRECISION NOT NULL,
    "guia_de_remessa_id" TEXT NOT NULL,
    "insumo_id" TEXT NOT NULL,

    CONSTRAINT "almoxarifado_itens_guia_remessa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "almoxarifado_insumos_nome_key" ON "almoxarifado_insumos"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "almoxarifado_estoque_central_insumo_id_key" ON "almoxarifado_estoque_central"("insumo_id");

-- CreateIndex
CREATE UNIQUE INDEX "almoxarifado_guias_remessa_numero_key" ON "almoxarifado_guias_remessa"("numero");

-- AddForeignKey
ALTER TABLE "almoxarifado_insumos" ADD CONSTRAINT "almoxarifado_insumos_unidade_medida_id_fkey" FOREIGN KEY ("unidade_medida_id") REFERENCES "UnidadeMedida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "almoxarifado_entradas_estoque" ADD CONSTRAINT "almoxarifado_entradas_estoque_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "Fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "almoxarifado_itens_entrada_estoque" ADD CONSTRAINT "almoxarifado_itens_entrada_estoque_entrada_id_fkey" FOREIGN KEY ("entrada_id") REFERENCES "almoxarifado_entradas_estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "almoxarifado_itens_entrada_estoque" ADD CONSTRAINT "almoxarifado_itens_entrada_estoque_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "almoxarifado_insumos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "almoxarifado_estoque_central" ADD CONSTRAINT "almoxarifado_estoque_central_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "almoxarifado_insumos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "almoxarifado_movimentacoes_central" ADD CONSTRAINT "almoxarifado_movimentacoes_central_estoque_id_fkey" FOREIGN KEY ("estoque_id") REFERENCES "almoxarifado_estoque_central"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "almoxarifado_movimentacoes_central" ADD CONSTRAINT "almoxarifado_movimentacoes_central_entrada_estoque_id_fkey" FOREIGN KEY ("entrada_estoque_id") REFERENCES "almoxarifado_entradas_estoque"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "almoxarifado_movimentacoes_central" ADD CONSTRAINT "almoxarifado_movimentacoes_central_guia_de_remessa_id_fkey" FOREIGN KEY ("guia_de_remessa_id") REFERENCES "almoxarifado_guias_remessa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "almoxarifado_guias_remessa" ADD CONSTRAINT "almoxarifado_guias_remessa_unidade_educacional_id_fkey" FOREIGN KEY ("unidade_educacional_id") REFERENCES "UnidadeEducacional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "almoxarifado_itens_guia_remessa" ADD CONSTRAINT "almoxarifado_itens_guia_remessa_guia_de_remessa_id_fkey" FOREIGN KEY ("guia_de_remessa_id") REFERENCES "almoxarifado_guias_remessa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "almoxarifado_itens_guia_remessa" ADD CONSTRAINT "almoxarifado_itens_guia_remessa_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "almoxarifado_insumos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

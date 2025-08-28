-- AlterTable
ALTER TABLE "Contrato" ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'nutricao';

-- CreateTable
CREATE TABLE "itens_almoxarifado" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valor_unitario" DOUBLE PRECISION NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "saldo" DOUBLE PRECISION NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "unidade_medida_id" TEXT NOT NULL,

    CONSTRAINT "itens_almoxarifado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_almoxarifado" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "data_pedido" TIMESTAMP(3) NOT NULL,
    "data_entrega_prevista" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "valor_total" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contrato_id" TEXT NOT NULL,

    CONSTRAINT "pedidos_almoxarifado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido_almoxarifado" (
    "id" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "item_almoxarifado_id" TEXT NOT NULL,
    "unidade_educacional_id" TEXT NOT NULL,

    CONSTRAINT "itens_pedido_almoxarifado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recibos_almoxarifado" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "data_entrega" TIMESTAMP(3) NOT NULL,
    "responsavel_recebimento" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "qrcode" TEXT,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pedido_id" TEXT NOT NULL,
    "unidade_educacional_id" TEXT NOT NULL,

    CONSTRAINT "recibos_almoxarifado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_recibo_almoxarifado" (
    "id" TEXT NOT NULL,
    "quantidade_solicitada" DOUBLE PRECISION NOT NULL,
    "quantidade_recebida" DOUBLE PRECISION NOT NULL,
    "conforme" BOOLEAN NOT NULL,
    "observacoes" TEXT,
    "recibo_id" TEXT NOT NULL,
    "item_pedido_id" TEXT NOT NULL,

    CONSTRAINT "itens_recibo_almoxarifado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estoques_almoxarifado" (
    "id" TEXT NOT NULL,
    "quantidade_atual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantidade_minima" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ultima_atualizacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unidade_educacional_id" TEXT NOT NULL,
    "item_almoxarifado_id" TEXT NOT NULL,

    CONSTRAINT "estoques_almoxarifado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_estoque_almoxarifado" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "quantidade_anterior" DOUBLE PRECISION NOT NULL,
    "quantidade_nova" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "data_movimentacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estoque_id" TEXT NOT NULL,
    "recibo_id" TEXT,

    CONSTRAINT "movimentacoes_estoque_almoxarifado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_almoxarifado_numero_key" ON "pedidos_almoxarifado"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "recibos_almoxarifado_numero_key" ON "recibos_almoxarifado"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "estoques_almoxarifado_unidade_educacional_id_item_almoxarif_key" ON "estoques_almoxarifado"("unidade_educacional_id", "item_almoxarifado_id");

-- AddForeignKey
ALTER TABLE "itens_almoxarifado" ADD CONSTRAINT "itens_almoxarifado_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_almoxarifado" ADD CONSTRAINT "itens_almoxarifado_unidade_medida_id_fkey" FOREIGN KEY ("unidade_medida_id") REFERENCES "UnidadeMedida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_almoxarifado" ADD CONSTRAINT "pedidos_almoxarifado_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_almoxarifado" ADD CONSTRAINT "itens_pedido_almoxarifado_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos_almoxarifado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_almoxarifado" ADD CONSTRAINT "itens_pedido_almoxarifado_item_almoxarifado_id_fkey" FOREIGN KEY ("item_almoxarifado_id") REFERENCES "itens_almoxarifado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_almoxarifado" ADD CONSTRAINT "itens_pedido_almoxarifado_unidade_educacional_id_fkey" FOREIGN KEY ("unidade_educacional_id") REFERENCES "UnidadeEducacional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recibos_almoxarifado" ADD CONSTRAINT "recibos_almoxarifado_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos_almoxarifado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recibos_almoxarifado" ADD CONSTRAINT "recibos_almoxarifado_unidade_educacional_id_fkey" FOREIGN KEY ("unidade_educacional_id") REFERENCES "UnidadeEducacional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_recibo_almoxarifado" ADD CONSTRAINT "itens_recibo_almoxarifado_recibo_id_fkey" FOREIGN KEY ("recibo_id") REFERENCES "recibos_almoxarifado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_recibo_almoxarifado" ADD CONSTRAINT "itens_recibo_almoxarifado_item_pedido_id_fkey" FOREIGN KEY ("item_pedido_id") REFERENCES "itens_pedido_almoxarifado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoques_almoxarifado" ADD CONSTRAINT "estoques_almoxarifado_unidade_educacional_id_fkey" FOREIGN KEY ("unidade_educacional_id") REFERENCES "UnidadeEducacional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoques_almoxarifado" ADD CONSTRAINT "estoques_almoxarifado_item_almoxarifado_id_fkey" FOREIGN KEY ("item_almoxarifado_id") REFERENCES "itens_almoxarifado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque_almoxarifado" ADD CONSTRAINT "movimentacoes_estoque_almoxarifado_estoque_id_fkey" FOREIGN KEY ("estoque_id") REFERENCES "estoques_almoxarifado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque_almoxarifado" ADD CONSTRAINT "movimentacoes_estoque_almoxarifado_recibo_id_fkey" FOREIGN KEY ("recibo_id") REFERENCES "recibos_almoxarifado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

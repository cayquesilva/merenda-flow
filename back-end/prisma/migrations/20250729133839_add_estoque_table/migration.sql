-- CreateTable
CREATE TABLE "Estoque" (
    "id" TEXT NOT NULL,
    "quantidade_atual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantidade_minima" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ultima_atualizacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unidade_educacional_id" TEXT NOT NULL,
    "item_contrato_id" TEXT NOT NULL,

    CONSTRAINT "Estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentacaoEstoque" (
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

    CONSTRAINT "MovimentacaoEstoque_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Estoque_unidade_educacional_id_item_contrato_id_key" ON "Estoque"("unidade_educacional_id", "item_contrato_id");

-- AddForeignKey
ALTER TABLE "Estoque" ADD CONSTRAINT "Estoque_unidade_educacional_id_fkey" FOREIGN KEY ("unidade_educacional_id") REFERENCES "UnidadeEducacional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estoque" ADD CONSTRAINT "Estoque_item_contrato_id_fkey" FOREIGN KEY ("item_contrato_id") REFERENCES "ItemContrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoEstoque" ADD CONSTRAINT "MovimentacaoEstoque_estoque_id_fkey" FOREIGN KEY ("estoque_id") REFERENCES "Estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoEstoque" ADD CONSTRAINT "MovimentacaoEstoque_recibo_id_fkey" FOREIGN KEY ("recibo_id") REFERENCES "Recibo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

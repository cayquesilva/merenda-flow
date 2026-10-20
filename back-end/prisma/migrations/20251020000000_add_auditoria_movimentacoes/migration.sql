-- AlterTable
ALTER TABLE "MovimentacaoEstoque" ADD COLUMN "origem" TEXT,
ADD COLUMN "usuario_id" TEXT,
ADD COLUMN "impersonado_por_id" TEXT,
ADD COLUMN "transcricao" TEXT;

-- AlterTable
ALTER TABLE "almoxarifado_movimentacoes_central" ADD COLUMN "usuario_id" TEXT,
ADD COLUMN "impersonado_por_id" TEXT;

-- CreateIndex
CREATE INDEX "MovimentacaoEstoque_data_movimentacao_idx" ON "MovimentacaoEstoque"("data_movimentacao");

-- CreateIndex
CREATE INDEX "almoxarifado_movimentacoes_central_data_movimentacao_idx" ON "almoxarifado_movimentacoes_central"("data_movimentacao");

-- CreateTable
CREATE TABLE "almoxarifado_estoques_unidades" (
    "id" TEXT NOT NULL,
    "quantidade_atual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unidade_educacional_id" TEXT NOT NULL,
    "insumo_id" TEXT NOT NULL,

    CONSTRAINT "almoxarifado_estoques_unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "almoxarifado_movimentacoes_unidades" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "quantidade_anterior" DOUBLE PRECISION NOT NULL,
    "quantidade_nova" DOUBLE PRECISION NOT NULL,
    "responsavel" TEXT NOT NULL,
    "data_movimentacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estoque_id" TEXT NOT NULL,

    CONSTRAINT "almoxarifado_movimentacoes_unidades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "almoxarifado_estoques_unidades_unidade_educacional_id_insum_key" ON "almoxarifado_estoques_unidades"("unidade_educacional_id", "insumo_id");

-- AddForeignKey
ALTER TABLE "almoxarifado_estoques_unidades" ADD CONSTRAINT "almoxarifado_estoques_unidades_unidade_educacional_id_fkey" FOREIGN KEY ("unidade_educacional_id") REFERENCES "UnidadeEducacional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "almoxarifado_estoques_unidades" ADD CONSTRAINT "almoxarifado_estoques_unidades_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "almoxarifado_insumos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "almoxarifado_movimentacoes_unidades" ADD CONSTRAINT "almoxarifado_movimentacoes_unidades_estoque_id_fkey" FOREIGN KEY ("estoque_id") REFERENCES "almoxarifado_estoques_unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "UnidadeMedida" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,

    CONSTRAINT "UnidadeMedida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT NOT NULL,
    "endereco" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnidadeEducacional" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "endereco" TEXT,
    "telefone" TEXT,
    "email" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UnidadeEducacional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3) NOT NULL,
    "valor_total" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fornecedor_id" TEXT NOT NULL,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemContrato" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valor_unitario" DOUBLE PRECISION NOT NULL,
    "quantidade_original" DOUBLE PRECISION NOT NULL,
    "saldo_atual" DOUBLE PRECISION NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "unidade_medida_id" TEXT NOT NULL,

    CONSTRAINT "ItemContrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "data_pedido" TIMESTAMP(3) NOT NULL,
    "data_entrega_prevista" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "valor_total" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contrato_id" TEXT NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPedido" (
    "id" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "item_contrato_id" TEXT NOT NULL,
    "unidade_educacional_id" TEXT NOT NULL,

    CONSTRAINT "ItemPedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recibo" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "data_entrega" TIMESTAMP(3) NOT NULL,
    "responsavel_entrega" TEXT NOT NULL,
    "responsavel_recebimento" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "qrcode" TEXT,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pedido_id" TEXT NOT NULL,
    "unidade_educacional_id" TEXT NOT NULL,

    CONSTRAINT "Recibo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemRecibo" (
    "id" TEXT NOT NULL,
    "quantidade_solicitada" DOUBLE PRECISION NOT NULL,
    "quantidade_recebida" DOUBLE PRECISION NOT NULL,
    "conforme" BOOLEAN NOT NULL,
    "observacoes" TEXT,
    "recibo_id" TEXT NOT NULL,
    "item_pedido_id" TEXT NOT NULL,

    CONSTRAINT "ItemRecibo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UnidadeMedida_sigla_key" ON "UnidadeMedida"("sigla");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_cnpj_key" ON "Fornecedor"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_email_key" ON "Fornecedor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadeEducacional_codigo_key" ON "UnidadeEducacional"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadeEducacional_email_key" ON "UnidadeEducacional"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_numero_key" ON "Contrato"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_numero_key" ON "Pedido"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Recibo_numero_key" ON "Recibo"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Recibo_pedido_id_key" ON "Recibo"("pedido_id");

-- CreateIndex
CREATE UNIQUE INDEX "ItemRecibo_item_pedido_id_key" ON "ItemRecibo"("item_pedido_id");

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "Fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemContrato" ADD CONSTRAINT "ItemContrato_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemContrato" ADD CONSTRAINT "ItemContrato_unidade_medida_id_fkey" FOREIGN KEY ("unidade_medida_id") REFERENCES "UnidadeMedida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_item_contrato_id_fkey" FOREIGN KEY ("item_contrato_id") REFERENCES "ItemContrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_unidade_educacional_id_fkey" FOREIGN KEY ("unidade_educacional_id") REFERENCES "UnidadeEducacional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recibo" ADD CONSTRAINT "Recibo_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recibo" ADD CONSTRAINT "Recibo_unidade_educacional_id_fkey" FOREIGN KEY ("unidade_educacional_id") REFERENCES "UnidadeEducacional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemRecibo" ADD CONSTRAINT "ItemRecibo_recibo_id_fkey" FOREIGN KEY ("recibo_id") REFERENCES "Recibo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemRecibo" ADD CONSTRAINT "ItemRecibo_item_pedido_id_fkey" FOREIGN KEY ("item_pedido_id") REFERENCES "ItemPedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

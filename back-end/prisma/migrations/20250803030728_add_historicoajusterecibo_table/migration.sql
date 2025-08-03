-- CreateTable
CREATE TABLE "HistoricoAjusteRecibo" (
    "id" TEXT NOT NULL,
    "recibo_id" TEXT NOT NULL,
    "data_ajuste" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responsavel" TEXT NOT NULL,
    "observacoes" TEXT,
    "mudancas" JSONB NOT NULL,

    CONSTRAINT "HistoricoAjusteRecibo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HistoricoAjusteRecibo" ADD CONSTRAINT "HistoricoAjusteRecibo_recibo_id_fkey" FOREIGN KEY ("recibo_id") REFERENCES "Recibo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

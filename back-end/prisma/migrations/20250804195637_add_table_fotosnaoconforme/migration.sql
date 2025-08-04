-- CreateTable
CREATE TABLE "fotos_nao_conforme" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "item_recibo_id" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotos_nao_conforme_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fotos_nao_conforme" ADD CONSTRAINT "fotos_nao_conforme_item_recibo_id_fkey" FOREIGN KEY ("item_recibo_id") REFERENCES "ItemRecibo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

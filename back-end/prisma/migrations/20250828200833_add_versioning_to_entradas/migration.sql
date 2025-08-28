-- AlterTable
ALTER TABLE "almoxarifado_entradas_estoque" ADD COLUMN     "entrada_original_id" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ativo';

-- AddForeignKey
ALTER TABLE "almoxarifado_entradas_estoque" ADD CONSTRAINT "almoxarifado_entradas_estoque_entrada_original_id_fkey" FOREIGN KEY ("entrada_original_id") REFERENCES "almoxarifado_entradas_estoque"("id") ON DELETE SET NULL ON UPDATE CASCADE;

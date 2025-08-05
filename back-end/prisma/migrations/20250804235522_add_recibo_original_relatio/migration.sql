-- AlterTable
ALTER TABLE "Recibo" ADD COLUMN     "recibo_original_id" TEXT;

-- AddForeignKey
ALTER TABLE "Recibo" ADD CONSTRAINT "Recibo_recibo_original_id_fkey" FOREIGN KEY ("recibo_original_id") REFERENCES "Recibo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

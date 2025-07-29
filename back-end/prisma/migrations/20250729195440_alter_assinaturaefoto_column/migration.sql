/*
  Warnings:

  - A unique constraint covering the columns `[assinaturaDigitalId]` on the table `Recibo` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fotoReciboAssinadoId]` on the table `Recibo` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Recibo_assinaturaDigitalId_key" ON "Recibo"("assinaturaDigitalId");

-- CreateIndex
CREATE UNIQUE INDEX "Recibo_fotoReciboAssinadoId_key" ON "Recibo"("fotoReciboAssinadoId");

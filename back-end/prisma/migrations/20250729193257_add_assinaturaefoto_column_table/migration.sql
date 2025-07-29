/*
  Warnings:

  - You are about to drop the column `assinaturaDigital` on the `Recibo` table. All the data in the column will be lost.
  - You are about to drop the column `fotoReciboAssinado` on the `Recibo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Recibo" DROP COLUMN "assinaturaDigital",
DROP COLUMN "fotoReciboAssinado",
ADD COLUMN     "assinaturaDigitalId" TEXT,
ADD COLUMN     "fotoReciboAssinadoId" TEXT;

-- CreateTable
CREATE TABLE "AssinaturaDigital" (
    "id" TEXT NOT NULL,
    "imagemBase64" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssinaturaDigital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FotoReciboAssinado" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FotoReciboAssinado_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Recibo" ADD CONSTRAINT "Recibo_assinaturaDigitalId_fkey" FOREIGN KEY ("assinaturaDigitalId") REFERENCES "AssinaturaDigital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recibo" ADD CONSTRAINT "Recibo_fotoReciboAssinadoId_fkey" FOREIGN KEY ("fotoReciboAssinadoId") REFERENCES "FotoReciboAssinado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

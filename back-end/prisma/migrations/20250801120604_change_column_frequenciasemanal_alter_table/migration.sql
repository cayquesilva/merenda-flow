/*
  Warnings:

  - You are about to drop the column `frequencia_semanal` on the `PercapitaItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PercapitaItem" DROP COLUMN "frequencia_semanal",
ADD COLUMN     "frequencia_mensal" INTEGER NOT NULL DEFAULT 5;

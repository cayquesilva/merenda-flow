/*
  Warnings:

  - Added the required column `motivo` to the `almoxarifado_movimentacoes_central` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "almoxarifado_movimentacoes_central" ADD COLUMN     "motivo" TEXT NOT NULL;

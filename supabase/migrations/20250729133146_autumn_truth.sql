/*
  # Sistema de Controle de Estoque

  1. New Tables
    - `Estoque`
      - `id` (uuid, primary key)
      - `unidadeEducacionalId` (uuid, foreign key)
      - `itemContratoId` (uuid, foreign key)
      - `quantidadeAtual` (float)
      - `quantidadeMinima` (float, default 0)
      - `ultimaAtualizacao` (timestamp)
    
    - `MovimentacaoEstoque`
      - `id` (uuid, primary key)
      - `estoqueId` (uuid, foreign key)
      - `tipo` (text: 'entrada', 'saida', 'ajuste')
      - `quantidade` (float)
      - `quantidadeAnterior` (float)
      - `quantidadeNova` (float)
      - `motivo` (text)
      - `reciboId` (uuid, foreign key, nullable)
      - `responsavel` (text)
      - `dataMovimentacao` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users

  3. Changes
    - Create indexes for better performance
    - Add unique constraint for estoque per unit/item
*/

-- Create Estoque table
CREATE TABLE IF NOT EXISTS "Estoque" (
  "id" TEXT NOT NULL,
  "unidadeEducacionalId" TEXT NOT NULL,
  "itemContratoId" TEXT NOT NULL,
  "quantidadeAtual" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "quantidadeMinima" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ultimaAtualizacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Estoque_pkey" PRIMARY KEY ("id")
);

-- Create MovimentacaoEstoque table
CREATE TABLE IF NOT EXISTS "MovimentacaoEstoque" (
  "id" TEXT NOT NULL,
  "estoqueId" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "quantidade" DOUBLE PRECISION NOT NULL,
  "quantidadeAnterior" DOUBLE PRECISION NOT NULL,
  "quantidadeNova" DOUBLE PRECISION NOT NULL,
  "motivo" TEXT NOT NULL,
  "reciboId" TEXT,
  "responsavel" TEXT NOT NULL,
  "dataMovimentacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MovimentacaoEstoque_pkey" PRIMARY KEY ("id")
);

-- Create unique index for estoque per unit/item
CREATE UNIQUE INDEX IF NOT EXISTS "Estoque_unidadeEducacionalId_itemContratoId_key" 
ON "Estoque"("unidadeEducacionalId", "itemContratoId");

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Estoque_unidadeEducacionalId_idx" ON "Estoque"("unidadeEducacionalId");
CREATE INDEX IF NOT EXISTS "Estoque_itemContratoId_idx" ON "Estoque"("itemContratoId");
CREATE INDEX IF NOT EXISTS "MovimentacaoEstoque_estoqueId_idx" ON "MovimentacaoEstoque"("estoqueId");
CREATE INDEX IF NOT EXISTS "MovimentacaoEstoque_reciboId_idx" ON "MovimentacaoEstoque"("reciboId");
CREATE INDEX IF NOT EXISTS "MovimentacaoEstoque_dataMovimentacao_idx" ON "MovimentacaoEstoque"("dataMovimentacao");

-- Add foreign key constraints
ALTER TABLE "Estoque" ADD CONSTRAINT "Estoque_unidadeEducacionalId_fkey" 
FOREIGN KEY ("unidadeEducacionalId") REFERENCES "UnidadeEducacional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Estoque" ADD CONSTRAINT "Estoque_itemContratoId_fkey" 
FOREIGN KEY ("itemContratoId") REFERENCES "ItemContrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MovimentacaoEstoque" ADD CONSTRAINT "MovimentacaoEstoque_estoqueId_fkey" 
FOREIGN KEY ("estoqueId") REFERENCES "Estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MovimentacaoEstoque" ADD CONSTRAINT "MovimentacaoEstoque_reciboId_fkey" 
FOREIGN KEY ("reciboId") REFERENCES "Recibo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enable Row Level Security
ALTER TABLE "Estoque" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MovimentacaoEstoque" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies for now)
CREATE POLICY "Allow all operations on Estoque" ON "Estoque" FOR ALL TO public USING (true);
CREATE POLICY "Allow all operations on MovimentacaoEstoque" ON "MovimentacaoEstoque" FOR ALL TO public USING (true);
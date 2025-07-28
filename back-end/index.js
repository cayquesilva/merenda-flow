import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

// Inicializa o Prisma Client
const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// ROTA DE EXEMPLO: Buscar todos os fornecedores
app.get("/api/fornecedores", async (req, res) => {
  try {
    const fornecedores = await prisma.fornecedor.findMany({
      include: {
        contratos: true, // Inclui os contratos relacionados a cada fornecedor
      },
    });
    res.json(fornecedores);
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error);
    res.status(500).json({ error: "Não foi possível buscar os fornecedores." });
  }
});

// ROTA DE EXEMPLO: Buscar todos os contratos com seus itens
app.get("/api/contratos", async (req, res) => {
  try {
    const contratos = await prisma.contrato.findMany({
      include: {
        fornecedor: true, // Inclui os dados do fornecedor
        itens: {
          // Inclui os itens do contrato
          include: {
            unidadeMedida: true, // E a unidade de medida de cada item
          },
        },
      },
    });
    res.json(contratos);
  } catch (error) {
    console.error("Erro ao buscar contratos:", error);
    res.status(500).json({ error: "Não foi possível buscar os contratos." });
  }
});

const server = app.listen(3001, () =>
  console.log(`🚀 Servidor pronto em: http://localhost:3001`)
);

// Garante que a conexão com o banco é fechada ao encerrar o processo
process.on("SIGTERM", () => {
  server.close(() => {
    prisma.$disconnect();
  });
});

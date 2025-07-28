import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

// Inicializa o Prisma Client
const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// --- INÍCIO DAS ROTAS DE FORNECEDORES (CRUD) --- //

// ROTA 1: Listar todos os fornecedores (com busca)
// GET /api/fornecedores?q=...
// Corresponde à tabela principal e à barra de busca da sua página.
app.get("/api/fornecedores", async (req, res) => {
  // O 'q' vem da query string da URL, usado para a busca
  const { q } = req.query;

  try {
    const fornecedores = await prisma.fornecedor.findMany({
      // A cláusula 'where' é usada para a filtragem
      where: q
        ? {
            // 'OR' permite buscar em múltiplos campos
            OR: [
              {
                nome: {
                  contains: q,
                  mode: "insensitive", // Ignora maiúsculas/minúsculas
                },
              },
              {
                cnpj: {
                  contains: q,
                },
              },
              {
                email: {
                  contains: q,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}, // Se não houver 'q', retorna todos os fornecedores
      orderBy: {
        nome: "asc", // Ordena por nome em ordem alfabética
      },
    });
    res.json(fornecedores);
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error);
    res.status(500).json({ error: "Não foi possível buscar os fornecedores." });
  }
});

// ROTA DE CONSULTA 1: Listar Fornecedores (apenas ID e Nome)
// GET /api/fornecedores/lista
// Otimizada para preencher um <select> no formulário de criação de contrato.
app.get("/api/fornecedores/lista", async (req, res) => {
  try {
    const fornecedores = await prisma.fornecedor.findMany({
      where: { ativo: true }, // Busca apenas fornecedores ativos
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: "asc",
      },
    });
    res.json(fornecedores);
  } catch (error) {
    console.error("Erro ao buscar lista de fornecedores:", error);
    res
      .status(500)
      .json({ error: "Não foi possível buscar a lista de fornecedores." });
  }
});

// ROTA 2: Buscar um único fornecedor pelo ID
// GET /api/fornecedores/:id
// Usado para carregar os dados no dialog de edição.
app.get("/api/fornecedores/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const fornecedor = await prisma.fornecedor.findUnique({
      where: { id },
    });
    if (fornecedor) {
      res.json(fornecedor);
    } else {
      res.status(404).json({ error: "Fornecedor não encontrado." });
    }
  } catch (error) {
    console.error("Erro ao buscar fornecedor:", error);
    res.status(500).json({ error: "Não foi possível buscar o fornecedor." });
  }
});

// ROTA 3: Criar um novo fornecedor
// POST /api/fornecedores
// Chamado pelo FornecedorDialog quando está criando um novo.
app.post("/api/fornecedores", async (req, res) => {
  const { nome, cnpj, email, telefone, endereco, ativo } = req.body;
  try {
    const novoFornecedor = await prisma.fornecedor.create({
      data: {
        nome,
        cnpj,
        email,
        telefone,
        endereco,
        ativo,
      },
    });
    res.status(201).json(novoFornecedor);
  } catch (error) {
    // Trata erros comuns, como CNPJ ou email duplicado
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: `O ${error.meta.target.join(", ")} já está em uso.` });
    }
    console.error("Erro ao criar fornecedor:", error);
    res.status(500).json({ error: "Não foi possível criar o fornecedor." });
  }
});

// ROTA 4: Atualizar um fornecedor existente
// PUT /api/fornecedores/:id
// Chamado pelo FornecedorDialog quando está editando.
app.put("/api/fornecedores/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, cnpj, email, telefone, endereco, ativo } = req.body;
  try {
    const fornecedorAtualizado = await prisma.fornecedor.update({
      where: { id },
      data: {
        nome,
        cnpj,
        email,
        telefone,
        endereco,
        ativo,
      },
    });
    res.json(fornecedorAtualizado);
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: `O ${error.meta.target.join(", ")} já está em uso.` });
    }
    console.error("Erro ao atualizar fornecedor:", error);
    res.status(500).json({ error: "Não foi possível atualizar o fornecedor." });
  }
});

// ROTA 5: Deletar um fornecedor
// DELETE /api/fornecedores/:id
// Pode ser conectada a um novo botão de "excluir" no futuro.
app.delete("/api/fornecedores/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.fornecedor.delete({
      where: { id },
    });
    res.status(204).send(); // 204 No Content - sucesso, sem conteúdo para retornar
  } catch (error) {
    console.error("Erro ao deletar fornecedor:", error);
    res.status(500).json({ error: "Não foi possível deletar o fornecedor." });
  }
});

// ROTA DE CONSULTA 2: Listar Unidades de Medida
// GET /api/unidades-medida
// Usada no formulário para adicionar itens a um contrato.
app.get("/api/unidades-medida", async (req, res) => {
  try {
    const unidades = await prisma.unidadeMedida.findMany({
      orderBy: {
        nome: "asc",
      },
    });
    res.json(unidades);
  } catch (error) {
    console.error("Erro ao buscar unidades de medida:", error);
    res
      .status(500)
      .json({ error: "Não foi possível buscar as unidades de medida." });
  }
});

// --- INÍCIO DAS ROTAS DE CONTRATOS (CRUD) ---

// ROTA 1: Listar todos os Contratos (com busca)
// GET /api/contratos?q=...
app.get("/api/contratos", async (req, res) => {
  const { q } = req.query;

  try {
    const contratos = await prisma.contrato.findMany({
      where: q
        ? {
            OR: [
              { numero: { contains: q, mode: "insensitive" } },
              { fornecedor: { nome: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {},
      include: {
        // Inclui o nome do fornecedor para exibição na tabela
        fornecedor: {
          select: { nome: true },
        },
        // Inclui a contagem de itens para a coluna "Itens"
        _count: {
          select: { itens: true },
        },
      },
      orderBy: {
        dataInicio: "desc",
      },
    });
    res.json(contratos);
  } catch (error) {
    console.error("Erro ao buscar contratos:", error);
    res.status(500).json({ error: "Não foi possível buscar os contratos." });
  }
});

// ROTA 2: Buscar um único Contrato pelo ID (com todos os detalhes)
// GET /api/contratos/:id
// Alimenta o Dialog de detalhes.
app.get("/api/contratos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const contrato = await prisma.contrato.findUnique({
      where: { id },
      include: {
        fornecedor: true, // Inclui todos os dados do fornecedor
        itens: {
          // Inclui todos os itens do contrato
          include: {
            unidadeMedida: true, // E a unidade de medida de cada item
          },
          orderBy: {
            nome: "asc",
          },
        },
      },
    });

    if (contrato) {
      res.json(contrato);
    } else {
      res.status(404).json({ error: "Contrato não encontrado." });
    }
  } catch (error) {
    console.error(`Erro ao buscar contrato ${id}:`, error);
    res.status(500).json({ error: "Não foi possível buscar o contrato." });
  }
});

// ROTA 3: Criar um novo Contrato (com seus itens)
// POST /api/contratos
app.post("/api/contratos", async (req, res) => {
  // O frontend deve enviar os dados do contrato e um array 'itens'
  const { itens, ...dadosContrato } = req.body;

  try {
    const novoContrato = await prisma.contrato.create({
      data: {
        ...dadosContrato,
        itens: {
          create: itens, // O Prisma cria os itens relacionados em uma única operação
        },
      },
    });
    res.status(201).json(novoContrato);
  } catch (error) {
    console.error("Erro ao criar contrato:", error);
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: `O ${error.meta.target.join(", ")} já está em uso.` });
    }
    res.status(500).json({ error: "Não foi possível criar o contrato." });
  }
});

// ROTA 4: Atualizar um Contrato
// PUT /api/contratos/:id
// NOTA: Esta versão atualiza os dados principais do contrato. A atualização
// de itens (adicionar/remover/editar) é uma operação mais complexa.
app.put("/api/contratos/:id", async (req, res) => {
  const { id } = req.params;
  // Por enquanto, não vamos processar os itens na atualização para simplificar
  const { itens, ...dadosContrato } = req.body;

  try {
    const contratoAtualizado = await prisma.contrato.update({
      where: { id },
      data: dadosContrato,
    });
    res.json(contratoAtualizado);
  } catch (error) {
    console.error(`Erro ao atualizar contrato ${id}:`, error);
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: `O ${error.meta.target.join(", ")} já está em uso.` });
    }
    res.status(500).json({ error: "Não foi possível atualizar o contrato." });
  }
});

// ROTA 5: Deletar um Contrato
// DELETE /api/contratos/:id
app.delete("/api/contratos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // O Prisma precisa deletar os registros que dependem do contrato primeiro.
    // Usamos uma transação para garantir que tudo seja deletado corretamente.
    await prisma.$transaction([
      prisma.itemPedido.deleteMany({
        where: { itemContrato: { contratoId: id } },
      }), // Deleta itens de pedido
      prisma.itemContrato.deleteMany({ where: { contratoId: id } }), // Deleta itens de contrato
      prisma.pedido.deleteMany({ where: { contratoId: id } }), // Deleta pedidos
      prisma.contrato.delete({ where: { id } }), // Finalmente deleta o contrato
    ]);
    res.status(204).send();
  } catch (error) {
    console.error(`Erro ao deletar contrato ${id}:`, error);
    res.status(500).json({ error: "Não foi possível deletar o contrato." });
  }
});

// Rota de teste para verificar a conexão com o banco de dados
app.get("/api/test-db", async (req, res) => {
  try {
    // O comando `prisma.$queryRaw` permite executar SQL puro de forma segura.
    // `SELECT 1` é uma consulta muito leve, ideal para um "ping" no banco.
    await prisma.$queryRaw`SELECT 1`;

    // Se a primeira consulta funcionou, buscamos o horário atual do banco.
    const result = await prisma.$queryRaw`SELECT NOW()`;
    const currentTime = result[0].now;

    res.json({
      status: "sucesso",
      message: "Conexão com o banco de dados via Prisma bem-sucedida!",
      horario_do_banco: currentTime,
    });
  } catch (error) {
    // Se qualquer uma das chamadas ao banco falhar, o bloco catch será executado.
    console.error("Erro ao testar a conexão com o banco via Prisma:", error);
    res.status(500).json({
      status: "erro",
      message: "Falha ao se comunicar com o banco de dados.",
      detalhes: error.message,
    });
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

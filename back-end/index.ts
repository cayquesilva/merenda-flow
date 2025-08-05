import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import puppeteer from "puppeteer";

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(cors());
// NOVO: Aumenta o limite de tamanho do corpo da requisição para 10MB
app.use(express.json({ limit: "10mb" }));

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";

// Interface estendida para incluir userId no request
interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Define a tipagem esperada do payload JWT
interface JwtPayload {
  userId: string;
}

// Middleware para autenticação com tipagem correta
const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token de acesso requerido" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (
      err ||
      !decoded ||
      typeof decoded !== "object" ||
      !("userId" in decoded)
    ) {
      return res.status(403).json({ error: "Token inválido" });
    }

    const { userId } = decoded as JwtPayload;
    req.userId = userId;
    next();
  });
};

interface DadosAtualizacaoUsuario {
  nome?: string;
  email?: string;
  senha?: string;
  categoria?: string;
  ativo?: boolean;
}
// --- ROTAS DE AUTENTICAÇÃO ---

// Login
app.post("/api/auth/login", async (req: Request, res: Response) => {
  const { email, senha } = req.body;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario || !usuario.ativo) {
      return res
        .status(401)
        .json({ error: "Credenciais inválidas, User Inativo" });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res
        .status(401)
        .json({ error: "Credenciais inválidas, Senha Inválida" });
    }

    const token = jwt.sign(
      {
        userId: usuario.id,
        email: usuario.email,
        categoria: usuario.categoria,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        categoria: usuario.categoria,
        ativo: usuario.ativo,
        createdAt: usuario.createdAt,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Verificar token
app.get(
  "/api/auth/me",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          nome: true,
          email: true,
          categoria: true,
          ativo: true,
          createdAt: true,
        },
      });

      if (!usuario) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json(usuario);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

// --- ROTAS DE USUÁRIOS ---

// Listar usuários
app.get(
  "/api/usuarios",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { q } = req.query;
    try {
      const usuarios = await prisma.usuario.findMany({
        where: q
          ? {
              OR: [
                { nome: { contains: q as string, mode: "insensitive" } },
                { email: { contains: q as string, mode: "insensitive" } },
              ],
            }
          : {},
        select: {
          id: true,
          nome: true,
          email: true,
          categoria: true,
          ativo: true,
          createdAt: true,
        },
        orderBy: { nome: "asc" },
      });
      res.json(usuarios);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ error: "Não foi possível buscar os usuários." });
    }
  }
);

// Buscar usuário por ID
app.get(
  "/api/usuarios/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id },
        select: {
          id: true,
          nome: true,
          email: true,
          categoria: true,
          ativo: true,
          createdAt: true,
        },
      });

      if (usuario) {
        res.json(usuario);
      } else {
        res.status(404).json({ error: "Usuário não encontrado." });
      }
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      res.status(500).json({ error: "Não foi possível buscar o usuário." });
    }
  }
);

// Criar usuário
app.post(
  "/api/usuarios",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { nome, email, senha, categoria, ativo } = req.body;

    try {
      const senhaHash = await bcrypt.hash(senha, 10);

      const novoUsuario = await prisma.usuario.create({
        data: {
          nome,
          email,
          senha: senhaHash,
          categoria,
          ativo: ativo ?? true,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          categoria: true,
          ativo: true,
          createdAt: true,
        },
      });

      res.status(201).json(novoUsuario);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return res.status(409).json({ error: "Este email já está em uso." });
        }
      }
      console.error("Erro ao criar usuário:", error);
      res.status(500).json({ error: "Não foi possível criar o usuário." });
    }
  }
);

// Atualizar usuário
app.put(
  "/api/usuarios/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nome, email, senha, categoria, ativo } = req.body;

    try {
      const dadosAtualizacao: DadosAtualizacaoUsuario = {
        nome,
        email,
        categoria,
        ativo,
      };

      if (senha) {
        dadosAtualizacao.senha = await bcrypt.hash(senha, 10);
      }

      const usuarioAtualizado = await prisma.usuario.update({
        where: { id },
        data: dadosAtualizacao,
        select: {
          id: true,
          nome: true,
          email: true,
          categoria: true,
          ativo: true,
          createdAt: true,
        },
      });

      res.json(usuarioAtualizado);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return res.status(409).json({ error: "Este email já está em uso." });
        }
      }
      console.error("Erro ao atualizar usuário:", error);
      res.status(500).json({ error: "Não foi possível atualizar o usuário." });
    }
  }
);

// Deletar usuário
app.delete(
  "/api/usuarios/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      await prisma.usuario.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      res.status(500).json({ error: "Não foi possível deletar o usuário." });
    }
  }
);

// COMENTÁRIO: Lista todos os fornecedores.
app.get("/api/fornecedores", async (req: Request, res: Response) => {
  const { q } = req.query;
  try {
    const fornecedores = await prisma.fornecedor.findMany({
      where: q
        ? {
            OR: [
              { nome: { contains: q as string, mode: "insensitive" } },
              { cnpj: { contains: q as string } },
              { email: { contains: q as string, mode: "insensitive" } },
            ],
          }
        : {},
      orderBy: { nome: "asc" },
    });
    res.json(fornecedores);
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error);
    res.status(500).json({ error: "Não foi possível buscar os fornecedores." });
  }
});

// COMENTÁRIO: Retorna uma lista simplificada de fornecedores ativos.
app.get("/api/fornecedores/lista", async (req: Request, res: Response) => {
  try {
    const fornecedores = await prisma.fornecedor.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });
    res.json(fornecedores);
  } catch (error) {
    console.error("Erro ao buscar lista de fornecedores:", error);
    res
      .status(500)
      .json({ error: "Não foi possível buscar a lista de fornecedores." });
  }
});

// COMENTÁRIO: Busca os dados completos de um único fornecedor.
app.get("/api/fornecedores/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const fornecedor = await prisma.fornecedor.findUnique({ where: { id } });
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

// COMENTÁRIO: Cria um novo fornecedor.
app.post("/api/fornecedores", async (req: Request, res: Response) => {
  try {
    const novoFornecedor = await prisma.fornecedor.create({ data: req.body });
    res.status(201).json(novoFornecedor);
  } catch (error) {
    // ALTERAÇÃO: Removido ': any'
    // ALTERAÇÃO: Adicionada verificação de tipo para o erro do Prisma.
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res
          .status(409)
          .json({ error: `O campo ${error.meta?.target} já está em uso.` });
      }
    }
    console.error("Erro ao criar fornecedor:", error);
    res.status(500).json({ error: "Não foi possível criar o fornecedor." });
  }
});

// COMENTÁRIO: Atualiza os dados de um fornecedor existente.
app.put("/api/fornecedores/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const fornecedorAtualizado = await prisma.fornecedor.update({
      where: { id },
      data: req.body,
    });
    res.json(fornecedorAtualizado);
  } catch (error) {
    // ALTERAÇÃO: Removido ': any'
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res
          .status(409)
          .json({ error: `O campo ${error.meta?.target} já está em uso.` });
      }
    }
    console.error("Erro ao atualizar fornecedor:", error);
    res.status(500).json({ error: "Não foi possível atualizar o fornecedor." });
  }
});

// COMENTÁRIO: Deleta um fornecedor.
app.delete("/api/fornecedores/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.fornecedor.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar fornecedor:", error);
    res.status(500).json({ error: "Não foi possível deletar o fornecedor." });
  }
});

// --- ROTAS DE UNIDADES DE MEDIDA ---

// COMENTÁRIO: Retorna todas as unidades de medida cadastradas.
app.get("/api/unidades-medida", async (req: Request, res: Response) => {
  try {
    const unidades = await prisma.unidadeMedida.findMany({
      orderBy: { nome: "asc" },
    });
    res.json(unidades);
  } catch (error) {
    console.error("Erro ao buscar unidades de medida:", error);
    res
      .status(500)
      .json({ error: "Não foi possível buscar as unidades de medida." });
  }
});

// --- ROTAS DE CONTRATOS ---

// COMENTÁRIO: Lista todos os contratos.
app.get("/api/contratos", async (req: Request, res: Response) => {
  const { q } = req.query;
  try {
    const contratos = await prisma.contrato.findMany({
      where: q
        ? {
            OR: [
              { numero: { contains: q as string, mode: "insensitive" } },
              {
                fornecedor: {
                  nome: { contains: q as string, mode: "insensitive" },
                },
              },
            ],
          }
        : {},
      include: {
        fornecedor: { select: { nome: true } },
        _count: { select: { itens: true } },
      },
      orderBy: { dataInicio: "desc" },
    });
    res.json(contratos);
  } catch (error) {
    console.error("Erro ao buscar contratos:", error);
    res.status(500).json({ error: "Não foi possível buscar os contratos." });
  }
});

// COMENTÁRIO: Busca os dados completos de um único contrato.
app.get("/api/contratos/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const contrato = await prisma.contrato.findUnique({
      where: { id },
      include: {
        fornecedor: true,
        itens: { include: { unidadeMedida: true }, orderBy: { nome: "asc" } },
      },
    });
    if (contrato) res.json(contrato);
    else res.status(404).json({ error: "Contrato não encontrado." });
  } catch (error) {
    console.error("Erro ao buscar contrato:", error);
    res.status(500).json({ error: "Não foi possível buscar o contrato." });
  }
});

// NOVO: Interface para o payload do item de contrato na requisição POST
interface ItemContratoPayload {
  nome: string;
  unidadeMedidaId: string;
  valorUnitario: number;
  quantidadeOriginal: number;
  quantidadeCreche: number;
  quantidadeEscola: number;
  saldoAtual: number;
  saldoCreche: number;
  saldoEscola: number;
}

// COMENTÁRIO: Cria um novo contrato e os seus itens.
app.post("/api/contratos", async (req: Request, res: Response) => {
  const { itens, ...dadosContrato } = req.body;

  try {
    const novoContrato = await prisma.contrato.create({
      data: {
        ...dadosContrato,
        itens: {
          create: (itens as ItemContratoPayload[]).map((item) => ({
            ...item,
            // Cálculo do saldo total do contrato a partir das quantidades de creche e escola
            quantidadeOriginal: item.quantidadeCreche + item.quantidadeEscola,
            saldoAtual: item.quantidadeCreche + item.quantidadeEscola,
            saldoCreche: item.quantidadeCreche,
            saldoEscola: item.quantidadeEscola,
          })),
        },
      },
    });
    res.status(201).json(novoContrato);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res
          .status(409)
          .json({ error: `O campo ${error.meta?.target} já está em uso.` });
      }
    }
    console.error("Erro ao criar contrato:", error);
    res.status(500).json({ error: "Não foi possível criar o contrato." });
  }
});

// COMENTÁRIO: Atualiza os dados principais de um contrato.
app.put("/api/contratos/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { itens, ...dadosContrato } = req.body;
  try {
    const contratoAtualizado = await prisma.contrato.update({
      where: { id },
      data: dadosContrato,
    });
    res.json(contratoAtualizado);
  } catch (error) {
    // ALTERAÇÃO: Removido ': any'
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res
          .status(409)
          .json({ error: `O campo ${error.meta?.target} já está em uso.` });
      }
    }
    console.error("Erro ao atualizar contrato:", error);
    res.status(500).json({ error: "Não foi possível atualizar o contrato." });
  }
});

// COMENTÁRIO: Deleta um contrato e os seus itens.
app.delete("/api/contratos/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.$transaction([
      prisma.itemContrato.deleteMany({ where: { contratoId: id } }),
      prisma.contrato.delete({ where: { id } }),
    ]);
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar contrato:", error);
    res.status(500).json({ error: "Não foi possível deletar o contrato." });
  }
});

// --- ROTAS DE UNIDADES EDUCACIONAIS ---

// ROTA 1: Listar todas as Unidades (com busca)
app.get("/api/unidades", async (req: Request, res: Response) => {
  const { q } = req.query;
  try {
    const unidades = await prisma.unidadeEducacional.findMany({
      where: q
        ? {
            OR: [
              { nome: { contains: q as string, mode: "insensitive" } },
              { codigo: { contains: q as string, mode: "insensitive" } },
              { email: { contains: q as string, mode: "insensitive" } },
            ],
          }
        : {},
      orderBy: {
        nome: "asc",
      },
    });
    res.json(unidades);
  } catch (error) {
    console.error("Erro ao buscar unidades educacionais:", error);
    res.status(500).json({ error: "Não foi possível buscar as unidades." });
  }
});

// ROTA 2: Buscar uma única Unidade pelo ID
// GET /api/unidades/:id
app.get("/api/unidades/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const unidade = await prisma.unidadeEducacional.findUnique({
      where: { id },
    });
    if (unidade) {
      res.json(unidade);
    } else {
      res.status(404).json({ error: "Unidade Educacional não encontrada." });
    }
  } catch (error) {
    console.error("Erro ao buscar unidade:", error);
    res.status(500).json({ error: "Não foi possível buscar a unidade." });
  }
});

// ROTA 3: Criar uma nova Unidade
// POST /api/unidades
app.post("/api/unidades", async (req: Request, res: Response) => {
  const { nome, codigo, email, telefone, endereco, ativo, ...estudantes } =
    req.body;
  try {
    const novaUnidade = await prisma.unidadeEducacional.create({
      data: { nome, codigo, email, telefone, endereco, ativo, ...estudantes },
    });
    res.status(201).json(novaUnidade);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({
          error: `O campo ${error.meta?.target} já está em uso.`,
        });
      }
    }
    console.error("Erro ao criar unidade:", error);
    res.status(500).json({ error: "Não foi possível criar a unidade." });
  }
});

// ROTA 4: Atualizar uma Unidade existente
// PUT /api/unidades/:id
app.put("/api/unidades/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, codigo, email, telefone, endereco, ativo, ...estudantes } =
    req.body;
  try {
    const unidadeAtualizada = await prisma.unidadeEducacional.update({
      where: { id },
      data: { nome, codigo, email, telefone, endereco, ativo, ...estudantes },
    });
    res.json(unidadeAtualizada);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({
          error: `O campo ${error.meta?.target} já está em uso.`,
        });
      }
    }
    console.error("Erro ao atualizar unidade:", error);
    res.status(500).json({ error: "Não foi possível atualizar a unidade." });
  }
});

// ROTA 5: Deletar uma Unidade
// DELETE /api/unidades/:id
app.delete("/api/unidades/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Adicionar lógica para deletar dependências se houver (ex: recibos, etc)
    await prisma.unidadeEducacional.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar unidade:", error);
    res.status(500).json({ error: "Não foi possível deletar a unidade." });
  }
});

// --- FIM DAS ROTAS DE UNIDADES EDUCACIONAIS ---

// --- INÍCIO DAS ROTAS DE CONSULTA PARA PEDIDOS ---

// COMENTÁRIO: Retorna uma lista simplificada de contratos ativos.
// UTILIZAÇÃO: Usada para preencher o campo de seleção (<Select>) de contratos no `NovoPedidoDialog.tsx`.
app.get("/api/contratos-ativos", async (req: Request, res: Response) => {
  try {
    const contratos = await prisma.contrato.findMany({
      where: { status: "ativo" },
      select: {
        id: true,
        numero: true,
        fornecedor: {
          select: { nome: true },
        },
      },
      orderBy: { numero: "asc" },
    });
    res.json(contratos);
  } catch (error) {
    console.error("Erro ao buscar contratos ativos:", error);
    res.status(500).json({ error: "Não foi possível buscar os contratos." });
  }
});

// COMENTÁRIO: Retorna uma lista de todas as unidades educacionais ativas.
// UTILIZAÇÃO: Usada no `NovoPedidoDialog.tsx` para listar as escolas onde os itens podem ser entregues.
app.get("/api/unidades-ativas", async (req: Request, res: Response) => {
  try {
    const unidades = await prisma.unidadeEducacional.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, codigo: true },
      orderBy: { nome: "asc" },
    });
    res.json(unidades);
  } catch (error) {
    console.error("Erro ao buscar unidades ativas:", error);
    res.status(500).json({ error: "Não foi possível buscar as unidades." });
  }
});

// --- INÍCIO DAS ROTAS DE PEDIDOS (CRUD) ---

// COMENTÁRIO: Retorna as estatísticas principais para os cards no topo da página de Pedidos.
// UTILIZAÇÃO: Chamada pela página `Pedidos.tsx` para obter os totais.
app.get("/api/pedidos/stats", async (req: Request, res: Response) => {
  try {
    const totalCount = await prisma.pedido.count();
    const pendingCount = await prisma.pedido.count({
      where: { status: "pendente" },
    });
    const deliveredCount = await prisma.pedido.count({
      where: { status: "entregue" },
    });
    const totalValue = await prisma.pedido.aggregate({
      _sum: { valorTotal: true },
    });

    res.json({
      total: totalCount,
      pendentes: pendingCount,
      entregues: deliveredCount,
      valorTotal: totalValue._sum.valorTotal || 0,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas dos pedidos:", error);
    res.status(500).json({ error: "Não foi possível buscar as estatísticas." });
  }
});

// COMENTÁRIO: Lista todos os pedidos com filtros.
// UTILIZAÇÃO: Usada na tabela principal da página `Pedidos.tsx`.
// PARÂMETROS: Aceita `?q=` para busca e `?status=` para filtrar por status.
app.get("/api/pedidos", async (req: Request, res: Response) => {
  const { q, status } = req.query;
  try {
    const pedidos = await prisma.pedido.findMany({
      where: {
        AND: [
          status && status !== "todos" ? { status: status as string } : {},
          q
            ? {
                OR: [
                  { numero: { contains: q as string, mode: "insensitive" } },
                  {
                    contrato: {
                      fornecedor: {
                        nome: { contains: q as string, mode: "insensitive" },
                      },
                    },
                  },
                ],
              }
            : {},
        ],
      },
      include: {
        contrato: { select: { fornecedor: { select: { nome: true } } } },
        _count: { select: { itens: true } },
      },
      orderBy: { dataPedido: "desc" },
    });
    res.json(pedidos);
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    res.status(500).json({ error: "Não foi possível buscar os pedidos." });
  }
});

// COMENTÁRIO: Busca os detalhes completos de um único pedido.
// UTILIZAÇÃO: Chamada pelo `PedidoDetailDialog.tsx` quando o utilizador clica para ver um pedido.
app.get("/api/pedidos/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        contrato: { include: { fornecedor: true } },
        itens: {
          include: {
            itemContrato: { include: { unidadeMedida: true } },
            unidadeEducacional: true,
          },
          orderBy: { itemContrato: { nome: "asc" } },
        },
      },
    });
    if (!pedido)
      return res.status(404).json({ error: "Pedido não encontrado." });
    res.json(pedido);
  } catch (error) {
    console.error("Erro ao buscar detalhes do pedido:", error);
    res
      .status(500)
      .json({ error: "Não foi possível buscar os detalhes do pedido." });
  }
});

// COMENTÁRIO: Cria um novo pedido e atualiza os saldos dos itens do contrato.
// UTILIZAÇÃO: Chamada pelo `NovoPedidoDialog.tsx` ao submeter o formulário.
app.post("/api/pedidos", async (req: Request, res: Response) => {
  const { contratoId, dataEntregaPrevista, valorTotal, itens } = req.body;

  // Gera um número de pedido único.
  const numeroPedido = `PD-${new Date().getFullYear()}-${String(
    Date.now()
  ).slice(-6)}`;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const novoPedido = await tx.pedido.create({
        data: {
          numero: numeroPedido,
          contratoId,
          dataPedido: new Date(),
          dataEntregaPrevista: new Date(dataEntregaPrevista),
          valorTotal,
          status: "pendente",
        },
      });

      for (const item of itens) {
        await tx.itemPedido.create({
          data: {
            pedidoId: novoPedido.id,
            itemContratoId: item.itemContratoId,
            unidadeEducacionalId: item.unidadeEducacionalId,
            quantidade: item.quantidade,
          },
        });

        // NOVO: Busca a unidade para determinar o tipo de estoque
        const unidade = await tx.unidadeEducacional.findUnique({
          where: { id: item.unidadeEducacionalId },
        });
        if (!unidade) throw new Error("Unidade educacional não encontrada.");

        const isCreche =
          (unidade.estudantesBercario || 0) > 0 ||
          (unidade.estudantesMaternal || 0) > 0 ||
          (unidade.estudantesPreEscola || 0) > 0;
        const campoSaldoAjustar = isCreche ? "saldoCreche" : "saldoEscola";

        // NOVO: Atualiza os saldos de forma segregada no ItemContrato
        await tx.itemContrato.update({
          where: { id: item.itemContratoId },
          data: {
            [campoSaldoAjustar]: {
              decrement: item.quantidade,
            },
            // Também decrementa o saldo geral para manter a consistência
            saldoAtual: {
              decrement: item.quantidade,
            },
          },
        });
      }
      return novoPedido;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    res.status(500).json({ error: "Não foi possível criar o pedido." });
  }
});

// --- FIM DAS ROTAS DE PEDIDOS ---

// --- INÍCIO DAS ROTAS DE CONSULTA PARA RECIBOS ---

// COMENTÁRIO: Retorna uma lista de pedidos com o status 'confirmado' ou 'pendente'.
// UTILIZAÇÃO: Usada para preencher o campo de seleção (<Select>) de pedidos no `GerarReciboDialog.tsx`.
app.get("/api/pedidos-para-recibo", async (req: Request, res: Response) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      where: {
        status: {
          in: ["confirmado", "pendente"],
        },
      },
      select: {
        id: true,
        numero: true,
        contrato: {
          select: {
            fornecedor: {
              select: { nome: true },
            },
          },
        },
      },
      orderBy: { dataPedido: "desc" },
    });
    res.json(pedidos);
  } catch (error) {
    console.error("Erro ao buscar pedidos para recibo:", error);
    res.status(500).json({ error: "Não foi possível buscar os pedidos." });
  }
});

// --- INÍCIO DAS ROTAS DE RECIBOS (CRUD) ---

// COMENTÁRIO: Retorna as estatísticas principais para os cards no topo da página de Recibos.
// UTILIZAÇÃO: Chamada pela página `Recibos.tsx` para obter os totais.
app.get("/api/recibos/stats", async (req: Request, res: Response) => {
  try {
    const totalCount = await prisma.recibo.count();
    const pendingCount = await prisma.recibo.count({
      where: { status: "pendente" },
    });
    const confirmedCount = await prisma.recibo.count({
      where: { status: { in: ["confirmado", "ajustado"] } }, // "ajustado" também conta como confirmado/finalizado
    });
    const partialCount = await prisma.recibo.count({
      where: { status: "parcial" },
    });

    res.json({
      total: totalCount,
      pendentes: pendingCount,
      confirmados: confirmedCount,
      parciais: partialCount,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas dos recibos:", error);
    res.status(500).json({ error: "Não foi possível buscar as estatísticas." });
  }
});

// COMENTÁRIO: Lista todos os recibos com filtros.
// UTILIZAÇÃO: Usada na tabela principal da página `Recibos.tsx`.
// PARÂMETROS: Aceita `?q=` para busca e `?status=` para filtrar por status.
app.get("/api/recibos", async (req: Request, res: Response) => {
  const { q, status } = req.query;
  try {
    const recibos = await prisma.recibo.findMany({
      where: {
        AND: [
          status && status !== "todos" ? { status: status as string } : {},
          q
            ? {
                OR: [
                  { numero: { contains: q as string, mode: "insensitive" } },
                  {
                    pedido: {
                      numero: { contains: q as string, mode: "insensitive" },
                    },
                  },
                  {
                    pedido: {
                      contrato: {
                        fornecedor: {
                          nome: { contains: q as string, mode: "insensitive" },
                        },
                      },
                    },
                  },
                ],
              }
            : {},
        ],
      },
      include: {
        pedido: {
          select: {
            numero: true,
            contrato: { select: { fornecedor: { select: { nome: true } } } },
          },
        },
        _count: { select: { itens: true } },
        historicoAjustes: {
          orderBy: { dataAjuste: "desc" },
          take: 1, // Pega o último ajuste
        },
        recibosComplementares: {
          // Inclui os recibos gerados a partir deste
          select: { id: true, numero: true, status: true },
        },
        reciboOriginal: {
          // Mostra se este recibo é um complemento de outro
          select: { id: true, numero: true },
        },
      },
      orderBy: { dataEntrega: "desc" },
    });
    res.json(recibos);
  } catch (error) {
    console.error("Erro ao buscar recibos:", error);
    res.status(500).json({ error: "Não foi possível buscar os recibos." });
  }
});

// COMENTÁRIO: Busca os detalhes completos de um único recibo.
// UTILIZAÇÃO: Chamada pelo `ReciboDetailDialog.tsx` quando o utilizador clica para ver um recibo.
app.get("/api/recibos/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Passo 1: Busca o recibo principal que o usuário solicitou, com todos os detalhes.
    // Mantivemos todos os seus `includes` para garantir que o objeto principal seja completo.
    const recibo = await prisma.recibo.findUnique({
      where: { id },
      include: {
        pedido: { include: { contrato: { include: { fornecedor: true } } } },
        unidadeEducacional: true,
        itens: {
          include: {
            itemPedido: {
              include: {
                itemContrato: { include: { unidadeMedida: true } },
                unidadeEducacional: true,
              },
            },
          },
        },
        assinaturaDigital: true,
        fotoReciboAssinado: true,
        // Incluímos as relações de família para determinar a raiz
        reciboOriginal: true,
        recibosComplementares: true,
      },
    });

    if (!recibo) {
      return res.status(404).json({ error: "Recibo não encontrado." });
    }

    // Passo 2: Determina o ID do recibo original (a "raiz" da família).
    // Se o recibo atual tiver um 'reciboOriginalId', usa ele. Senão, ele mesmo é o original.
    const originalId = recibo.reciboOriginalId || recibo.id;

    // Passo 3: Busca a família completa de recibos a partir da raiz.
    // Isso garante que tenhamos o recibo original + todos os seus complementos.
    const reciboOriginalComFamilia = await prisma.recibo.findUnique({
      where: { id: originalId },
      include: {
        // Incluímos os itens do recibo original
        itens: {
          include: {
            itemPedido: {
              include: { itemContrato: { include: { unidadeMedida: true } } },
            },
          },
        },
        // Incluímos todos os recibos complementares
        recibosComplementares: {
          // E para cada complemento, também incluímos seus itens
          include: {
            itens: {
              include: {
                itemPedido: {
                  include: {
                    itemContrato: { include: { unidadeMedida: true } },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" }, // Opcional: ordena os complementares por data
        },
      },
    });

    // Passo 4: Monta o array da "família" para enviar ao frontend.
    // O array conterá o recibo original primeiro, seguido por todos os complementares.
    const familiaRecibos = [
      // Adiciona o próprio objeto original (sem os complementares aninhados para não duplicar)
      { ...reciboOriginalComFamilia, recibosComplementares: undefined },
      ...(reciboOriginalComFamilia?.recibosComplementares || []),
    ];

    // Passo 5: Anexa a família de recibos ao objeto de resposta final.
    const responseData = {
      ...recibo,
      familiaRecibos, // O novo campo que o frontend irá usar
    };

    res.json(responseData);
  } catch (error) {
    console.error("Erro ao buscar detalhes do recibo:", error);
    res
      .status(500)
      .json({ error: "Não foi possível buscar os detalhes do recibo." });
  }
});

// COMENTÁRIO: Cria um ou mais recibos a partir de um pedido.
// UTILIZAÇÃO: Chamada pelo `GerarReciboDialog.tsx`.
app.post("/api/recibos", async (req: Request, res: Response) => {
  const { pedidoId, dataEntrega } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Encontrar o pedido e os seus itens.
      const pedido = await tx.pedido.findUnique({
        where: { id: pedidoId },
        include: { itens: true },
      });

      if (!pedido) throw new Error("Pedido não encontrado.");
      if (pedido.status === "entregue" || pedido.status === "cancelado") {
        throw new Error(`Este pedido já foi ${pedido.status}.`);
      }

      // 2. Agrupar itens por unidade educacional.
      const itensPorUnidade = pedido.itens.reduce((acc, item) => {
        const unidadeId = item.unidadeEducacionalId;
        if (!acc[unidadeId]) {
          acc[unidadeId] = [];
        }
        acc[unidadeId].push(item);
        return acc;
      }, {} as Record<string, typeof pedido.itens>);

      // 3. Criar um recibo para cada unidade educacional.
      const recibosCriados = [];

      for (const unidadeId in itensPorUnidade) {
        const itensDaUnidade = itensPorUnidade[unidadeId];
        const numeroRecibo = `RB-${new Date().getFullYear()}-${String(
          Date.now()
        ).slice(-6)}-${unidadeId.slice(0, 4)}`;

        // 3.1 Criar recibo inicialmente sem QR Code
        const reciboCriado = await tx.recibo.create({
          data: {
            numero: numeroRecibo,
            pedidoId: pedido.id,
            unidadeEducacionalId: unidadeId,
            dataEntrega: new Date(dataEntrega),
            responsavelRecebimento: "",
            status: "pendente",
            qrcode: "", // será atualizado depois
            itens: {
              create: itensDaUnidade.map((itemPedido) => ({
                itemPedidoId: itemPedido.id,
                quantidadeSolicitada: itemPedido.quantidade,
                quantidadeRecebida: 0,
                conforme: false,
              })),
            },
          },
        });

        // 3.2 Gerar URL de confirmação com ID do recibo
        const urlConfirmacao = `${
          process.env.FRONTEND_URL || "http://localhost:8080"
        }/confirmacao-recebimento/${reciboCriado.id}`;

        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
          urlConfirmacao
        )}`;

        // 3.3 Atualizar recibo com o QR Code
        const reciboAtualizado = await tx.recibo.update({
          where: { id: reciboCriado.id },
          data: { qrcode: qrCodeUrl },
        });

        recibosCriados.push(reciboAtualizado);
      }

      // 4. Atualizar status do pedido
      await tx.pedido.update({
        where: { id: pedidoId },
        data: { status: "entregue" },
      });

      return recibosCriados;
    });

    res
      .status(201)
      .json({ message: `${result.length} recibo(s) gerado(s) com sucesso.` });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    console.error("Erro ao gerar recibo:", error);
    res
      .status(500)
      .json({ error: `Não foi possível gerar o recibo: ${errorMessage}` });
  }
});

// --- INÍCIO DAS ROTAS DE CONFIRMAÇÃO DE RECEBIMENTO ---

// COMENTÁRIO: Retorna os dados para a página de confirmação de um recibo específico.
// UTILIZAÇÃO: Usada pela página pública `ConfirmacaoRecebimento.tsx` para carregar os dados do recibo.
app.get("/api/recibos/confirmacao/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const recibo = await prisma.recibo.findUnique({
      where: { id },
      include: {
        unidadeEducacional: true,
        pedido: {
          select: { numero: true, dataEntregaPrevista: true },
        },
        itens: {
          include: {
            itemPedido: {
              include: {
                itemContrato: {
                  select: {
                    nome: true,
                    unidadeMedida: { select: { sigla: true } },
                  },
                },
              },
            },
          },
        },
        assinaturaDigital: true, // Incluir no retorno
        fotoReciboAssinado: true, // Incluir no retorno
      },
    });

    if (!recibo) {
      return res.status(404).json({ error: "Recibo não encontrado." });
    }
    if (!["pendente"].includes(recibo.status)) {
      return res.status(409).json({ error: "Este recibo já foi processado." });
    }
    res.json(recibo);
  } catch (error) {
    console.error("Erro ao buscar recibo para confirmação:", error);
    res
      .status(500)
      .json({ error: "Não foi possível carregar os dados do recibo." });
  }
});

// COMENTÁRIO: Processa a submissão de uma confirmação de recebimento.
// UTILIZAÇÃO: Chamada pelo `ConfirmacaoRecebimento.tsx` ao clicar em "Confirmar Recebimento".
app.post(
  "/api/recibos/confirmacao/:id",
  async (req: Request, res: Response) => {
    const {
      id,
      responsavel,
      observacoes,
      itensConfirmacao,
      assinaturaDigital,
      fotoReciboAssinado,
    } = req.body;

    try {
      const result = await prisma.$transaction(async (tx) => {
        let todosConformes = true;
        let algumRecebido = false;

        // CORREÇÃO: Busca o recibo com as relações necessárias para evitar erros de tipagem
        const recibo = await tx.recibo.findUnique({
          where: { id },
          include: {
            unidadeEducacional: true,
            itens: {
              include: {
                itemPedido: {
                  include: {
                    itemContrato: true,
                  },
                },
                fotosNaoConforme: true,
              },
            },
          },
        });

        if (!recibo) {
          throw new Error("Recibo não encontrado.");
        }

        // ATUALIZAÇÃO: Lógica para definir o motivo da movimentação de estoque.
        // Verificamos se o recibo tem um `reciboOriginalId` para saber se é complementar.
        const motivoBaseDaMovimentacao = recibo.reciboOriginalId
          ? `Recebimento complementar - Recibo #${recibo.numero}`
          : `Recebimento confirmado - Recibo #${recibo.numero}`;

        const unidade = recibo.unidadeEducacional;
        const isCreche =
          (unidade.estudantesBercario || 0) > 0 ||
          (unidade.estudantesMaternal || 0) > 0 ||
          (unidade.estudantesPreEscola || 0) > 0;
        const tipoEstoque = isCreche ? "creche" : "escola";

        for (const item of itensConfirmacao) {
          const itemReciboOriginal = recibo.itens.find(
            (i) => i.id === item.itemId
          );
          if (!itemReciboOriginal) continue;

          // Lógica para lidar com as fotos de itens não conformes
          const fotosUrls = item.fotosNaoConforme || [];
          let fotosIds: { id: string }[] = [];

          // Se o item for marcado como conforme, deletamos as fotos antigas
          if (item.conforme) {
            await tx.fotoNaoConforme.deleteMany({
              where: {
                itemReciboId: item.itemId,
              },
            });
          } else if (fotosUrls.length > 0) {
            // Se não for conforme e tiver fotos, criamos novos registros
            // Deletamos fotos antigas para evitar duplicatas em caso de reenvio
            await tx.fotoNaoConforme.deleteMany({
              where: { itemReciboId: item.itemId },
            });

            // Criamos as novas fotos
            const novasFotos = await tx.fotoNaoConforme.createMany({
              data: fotosUrls.map((url: string) => ({
                itemReciboId: item.itemId,
                url,
              })),
            });

            // Buscamos os IDs das fotos recém-criadas para a operação `connect`
            const fotosCriadas = await tx.fotoNaoConforme.findMany({
              where: { itemReciboId: item.itemId },
              select: { id: true },
            });
            fotosIds = fotosCriadas.map((f) => ({ id: f.id }));
          }

          const itemRecibo = await tx.itemRecibo.update({
            where: { id: item.itemId },
            data: {
              conforme: item.conforme,
              quantidadeRecebida: Number(item.quantidadeRecebida),
              observacoes: item.observacoes,
            },
            include: { itemPedido: true },
          });

          if (!item.conforme) {
            todosConformes = false;
          }
          if (Number(item.quantidadeRecebida) > 0) {
            algumRecebido = true;
          }

          const diferenca =
            itemRecibo.itemPedido.quantidade - Number(item.quantidadeRecebida);
          if (diferenca > 0) {
            const contratoItem = await tx.itemContrato.findUnique({
              where: { id: itemRecibo.itemPedido.itemContratoId },
            });
            if (contratoItem) {
              const campoSaldoAjustar =
                tipoEstoque === "creche" ? "saldoCreche" : "saldoEscola";
              await tx.itemContrato.update({
                where: { id: itemRecibo.itemPedido.itemContratoId },
                data: {
                  [campoSaldoAjustar]: {
                    increment: diferenca,
                  },
                  saldoAtual: {
                    increment: diferenca,
                  },
                },
              });
            }
          }

          if (Number(item.quantidadeRecebida) > 0) {
            const estoqueExistente = await tx.estoque.findUnique({
              where: {
                unidadeEducacionalId_itemContratoId_tipoEstoque: {
                  unidadeEducacionalId: recibo.unidadeEducacional.id,
                  itemContratoId: itemRecibo.itemPedido.itemContratoId,
                  tipoEstoque: tipoEstoque,
                },
              },
            });

            const quantidadeRecebida = Number(item.quantidadeRecebida);
            let estoqueAtualizado;

            if (estoqueExistente) {
              estoqueAtualizado = await tx.estoque.update({
                where: { id: estoqueExistente.id },
                data: {
                  quantidadeAtual: {
                    increment: quantidadeRecebida,
                  },
                  ultimaAtualizacao: new Date(),
                },
              });
            } else {
              estoqueAtualizado = await tx.estoque.create({
                data: {
                  unidadeEducacionalId: recibo.unidadeEducacional.id,
                  itemContratoId: itemRecibo.itemPedido.itemContratoId,
                  quantidadeAtual: quantidadeRecebida,
                  quantidadeMinima: 0,
                  ultimaAtualizacao: new Date(),
                  tipoEstoque: tipoEstoque,
                },
              });
            }

            await tx.movimentacaoEstoque.create({
              data: {
                estoqueId: estoqueAtualizado.id,
                tipo: "entrada",
                quantidade: quantidadeRecebida,
                quantidadeAnterior: estoqueExistente?.quantidadeAtual || 0,
                quantidadeNova: estoqueAtualizado.quantidadeAtual,
                motivo: motivoBaseDaMovimentacao,
                reciboId: id,
                responsavel: responsavel,
                dataMovimentacao: new Date(),
              },
            });
          }
        }

        let statusBase = "rejeitado";
        if (algumRecebido) {
          statusBase = todosConformes ? "confirmado" : "parcial";
        }

        let statusFinal = statusBase; // Por padrão, o status final é o status base.

        // 2. Aplica a única exceção: um recibo complementar 100% confirmado.
        // Se o recibo for um complemento E o resultado da entrega for "confirmado",
        // então o status final se torna "complementar".
        if (recibo.reciboOriginalId && statusBase === "confirmado") {
          statusFinal = "complementar";
        }

        const dataParaUpdate: Prisma.ReciboUpdateInput = {
          responsavelRecebimento: responsavel,
          observacoes,
          status: statusFinal,
        };

        if (assinaturaDigital) {
          const novaAssinatura = await tx.assinaturaDigital.create({
            data: {
              imagemBase64: assinaturaDigital,
            },
          });
          dataParaUpdate.assinaturaDigital = {
            connect: { id: novaAssinatura.id },
          };
        }

        if (fotoReciboAssinado) {
          const novaFoto = await tx.fotoReciboAssinado.create({
            data: {
              url: fotoReciboAssinado,
            },
          });
          dataParaUpdate.fotoReciboAssinado = { connect: { id: novaFoto.id } };
        }

        const reciboAtualizado = await tx.recibo.update({
          where: { id },
          data: dataParaUpdate,
        });

        return reciboAtualizado;
      });

      res.status(200).json({
        message: "Recebimento confirmado com sucesso!",
        recibo: result,
      });
    } catch (error) {
      console.error("Erro ao confirmar recebimento:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      res.status(500).json({ error: errorMessage });
    }
  }
);

// COMENTÁRIO: Rota para buscar os detalhes completos de um recibo para impressão
app.get("/api/recibos/imprimir/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const recibo = await prisma.recibo.findUnique({
      where: { id },
      include: {
        pedido: {
          include: {
            contrato: { include: { fornecedor: true } },
          },
        },
        reciboOriginal: {
          select: {
            numero: true,
          },
        },
        unidadeEducacional: true,
        itens: {
          include: {
            itemPedido: {
              include: {
                itemContrato: { include: { unidadeMedida: true } },
                unidadeEducacional: true,
              },
            },
          },
        },
        assinaturaDigital: true, // Incluir no retorno
        fotoReciboAssinado: true, // Incluir no retorno
      },
    });

    if (!recibo) {
      return res
        .status(404)
        .json({ error: "Recibo não encontrado para impressão." });
    }
    res.json(recibo);
  } catch (error) {
    console.error("Erro ao buscar recibo para impressão:", error);
    res
      .status(500)
      .json({ error: "Não foi possível carregar o recibo para impressão." });
  }
});

// NOVA ROTA: Rota para buscar todos os recibos de um pedido específico para impressão em lote
app.get(
  "/api/recibos/imprimir-pedido/:pedidoId",
  async (req: Request, res: Response) => {
    const { pedidoId } = req.params;
    try {
      const recibosDoPedido = await prisma.recibo.findMany({
        where: { pedidoId },
        include: {
          pedido: {
            include: {
              contrato: { include: { fornecedor: true } },
            },
          },
          reciboOriginal: {
            select: {
              numero: true,
            },
          },
          unidadeEducacional: true,
          itens: {
            include: {
              itemPedido: {
                include: {
                  itemContrato: { include: { unidadeMedida: true } },
                  unidadeEducacional: true,
                },
              },
            },
          },
          assinaturaDigital: true,
          fotoReciboAssinado: true,
        },
        orderBy: { unidadeEducacional: { nome: "asc" } }, // Ordena por unidade para impressão
      });

      if (recibosDoPedido.length === 0) {
        return res
          .status(404)
          .json({ error: "Nenhum recibo encontrado para este pedido." });
      }
      res.json(recibosDoPedido);
    } catch (error) {
      console.error(
        "Erro ao buscar recibos do pedido para impressão em lote:",
        error
      );
      res.status(500).json({
        error: "Não foi possível carregar os recibos para impressão em lote.",
      });
    }
  }
);

// COMENTÁRIO: Retorna os dados para a página de dashboard de Confirmações.
// UTILIZAÇÃO: Chamada pela página `Confirmacoes.tsx` para popular as tabelas.
app.get("/api/confirmacoes", async (req: Request, res: Response) => {
  try {
    // Dados para a tabela de consolidações
    const pedidos = await prisma.pedido.findMany({
      include: {
        contrato: { select: { fornecedor: { select: { nome: true } } } },
        _count: { select: { itens: true } },
        recibos: {
          // Precisamos de todos os recibos para a lógica
          select: { status: true, id: true },
        },
      },
      orderBy: { dataPedido: "desc" },
    });

    const consolidacoes = pedidos.map((pedido) => {
      const totalRecibos = pedido.recibos.length;
      // Um recibo confirmado é aquele que está finalizado (confirmado, ajustado, rejeitado)
      // Recibos pendentes (pendente, pendente_ajuste) não contam como confirmados.
      const recibosConfirmados = pedido.recibos.filter((r) =>
        ["confirmado", "ajustado", "rejeitado", "parcial", "complementar"].includes(r.status)
      ).length;

      let statusConsolidacao: "pendente" | "parcial" | "completo" = "pendente";
      if (totalRecibos > 0) {
        if (recibosConfirmados === totalRecibos) {
          statusConsolidacao = "completo";
        } else if (recibosConfirmados > 0) {
          statusConsolidacao = "parcial";
        }
      }
      return {
        pedidoId: pedido.id,
        pedido,
        statusConsolidacao,
        totalUnidades: totalRecibos, // Simplificação: um recibo por unidade
        unidadesConfirmadas: recibosConfirmados,
        percentualConfirmacao:
          totalRecibos > 0 ? (recibosConfirmados / totalRecibos) * 100 : 0,
      };
    });

    // Dados para a tabela de recibos individuais
    const recibos = await prisma.recibo.findMany({
      include: {
        unidadeEducacional: { select: { nome: true } },
        pedido: {
          include: {
            contrato: { select: { fornecedor: { select: { nome: true } } } },
          },
        },
        itens: true,
      },
      orderBy: { dataEntrega: "desc" },
    });

    const confirmacoesDetalhadas = recibos.map((recibo) => {
      const itensConformes = recibo.itens.filter(
        (item) => item.conforme
      ).length;
      const totalItens = recibo.itens.length;
      const percentualConformidade =
        totalItens > 0 ? (itensConformes / totalItens) * 100 : 0;
      const totalSolicitado = recibo.itens.reduce(
        (sum, item) => sum + item.quantidadeSolicitada,
        0
      );
      const totalRecebido = recibo.itens.reduce(
        (sum, item) => sum + item.quantidadeRecebida,
        0
      );
      const eficienciaEntrega =
        totalSolicitado > 0 ? (totalRecebido / totalSolicitado) * 100 : 0;

      return {
        ...recibo,
        percentualConformidade,
        eficienciaEntrega,
        totalRecebido,
        totalSolicitado,
      };
    });

    res.json({ consolidacoes, confirmacoesDetalhadas });
  } catch (error) {
    console.error("Erro ao buscar dados de confirmações:", error);
    res.status(500).json({ error: "Não foi possível buscar os dados." });
  }
});

// COMENTÁRIO: NOVA ROTA: Busca os detalhes de um recibo específico para a tela de ajuste
app.get("/api/recibos/ajuste/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const recibo = await prisma.recibo.findUnique({
      where: { id },
      include: {
        unidadeEducacional: true,
        pedido: {
          include: {
            contrato: {
              include: {
                fornecedor: true,
              },
            },
          },
        },
        itens: {
          include: {
            itemPedido: {
              include: {
                itemContrato: {
                  include: {
                    unidadeMedida: true,
                  },
                },
                unidadeEducacional: true,
              },
            },
          },
        },
        assinaturaDigital: true,
        fotoReciboAssinado: true,
      },
    });

    if (!recibo) {
      return res.status(404).json({ error: "Recibo não encontrado." });
    }
    res.json(recibo);
  } catch (error) {
    console.error("Erro ao buscar recibo para ajuste:", error);
    res
      .status(500)
      .json({ error: "Não foi possível carregar o recibo para ajuste." });
  }
});

interface AjusteReciboBody {
  responsavel: string;
  observacoes: string;
  itensAjuste: {
    itemId: string;
    quantidadeRecebida: number;
  }[];
}

//ROTA cria recibos ou ajusta caso necessario
app.post("/api/recibos/ajuste/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { responsavel, observacoes, itensAjuste }: AjusteReciboBody = req.body;

  try {
    const reciboComplementar = await prisma.$transaction(async (tx) => {
      // 1. Buscar o recibo original que está sendo ajustado
      const reciboOriginal = await tx.recibo.findUnique({
        where: { id },
        include: {
          itens: {
            include: {
              itemPedido: true,
            },
          },
        },
      });

      if (!reciboOriginal) {
        throw new Error("Recibo original não encontrado.");
      }
      if (reciboOriginal.status === "ajustado") {
        throw new Error("Este recibo já foi ajustado e possui um complemento.");
      }

      // 2. Determinar os itens e quantidades para o novo recibo complementar
      // ATUALIZAÇÃO: Declarar com o tipo correto do Prisma
      const itensParaComplemento: Prisma.ItemReciboCreateWithoutReciboInput[] =
        [];

      for (const itemAjuste of itensAjuste) {
        const itemOriginal = reciboOriginal.itens.find(
          (i) => i.id === itemAjuste.itemId
        );
        if (!itemOriginal) continue;

        const quantidadeRecebida = Number(itemAjuste.quantidadeRecebida);
        const quantidadeSolicitada = itemOriginal.quantidadeSolicitada;
        const diferenca = quantidadeSolicitada - quantidadeRecebida;

        if (diferenca > 0) {
          itensParaComplemento.push({
            // O objeto aqui agora corresponde perfeitamente ao tipo esperado
            quantidadeSolicitada: diferenca,
            quantidadeRecebida: 0,
            conforme: false,
            itemPedido: {
              // Conectamos ao item de pedido existente
              connect: {
                id: itemOriginal.itemPedidoId,
              },
            },
          });
        }
      }

      if (itensParaComplemento.length === 0) {
        throw new Error(
          "Nenhuma divergência encontrada para gerar um recibo complementar."
        );
      }

      // ATUALIZAÇÃO: Corrigido o objeto de criação para usar 'connect'
      await tx.recibo.update({
        where: { id: reciboOriginal.id },
        data: {
          status: "ajustado",
          responsavelRecebimento: responsavel,
          observacoes,
          // Atualiza os itens do recibo original com os valores recebidos
          itens: {
            update: itensAjuste.map((item) => ({
              where: { id: item.itemId },
              data: {
                quantidadeRecebida: item.quantidadeRecebida,
                conforme:
                  (reciboOriginal.itens.find((i) => i.id === item.itemId)
                    ?.quantidadeSolicitada ?? 0) -
                    item.quantidadeRecebida <=
                  0,
              },
            })),
          },
        },
      });

      // 4. Criar o novo recibo complementar
      const numeroReciboComplementar = `RB-COMP-${new Date().getFullYear()}-${String(
        Date.now()
      ).slice(-6)}`;

      const novoRecibo = await tx.recibo.create({
        data: {
          numero: numeroReciboComplementar,
          pedidoId: reciboOriginal.pedidoId,
          unidadeEducacionalId: reciboOriginal.unidadeEducacionalId,
          dataEntrega: new Date(),
          responsavelRecebimento: "",
          status: "pendente",
          qrcode: "",
          reciboOriginalId: reciboOriginal.id,
          itens: {
            create: itensParaComplemento,
          },
        },
      });

      // 5. Gerar o QR Code para o novo recibo e atualizá-lo
      const urlConfirmacao = `${
        process.env.FRONTEND_URL || "http://localhost:8080"
      }/confirmacao-recebimento/${novoRecibo.id}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        urlConfirmacao
      )}`;

      const reciboFinal = await tx.recibo.update({
        where: { id: novoRecibo.id },
        data: { qrcode: qrCodeUrl },
      });

      return reciboFinal;
    });

    res.status(201).json({
      message: "Recibo de ajuste complementar gerado com sucesso!",
      recibo: reciboComplementar,
    });
  } catch (error) {
    console.error("Erro ao gerar recibo de ajuste complementar:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    res.status(500).json({ error: errorMessage });
  }
});

// --- ROTAS DE ESTOQUE ---

// COMENTÁRIO: Lista o estoque de uma unidade específica
app.get(
  "/api/estoque/unidade/:unidadeId",
  async (req: Request, res: Response) => {
    const { unidadeId } = req.params;
    const { q } = req.query;

    try {
      const estoque = await prisma.estoque.findMany({
        where: {
          unidadeEducacionalId: unidadeId,
          ...(q
            ? {
                itemContrato: {
                  nome: { contains: q as string, mode: "insensitive" },
                },
              }
            : {}),
        },
        include: {
          itemContrato: {
            include: {
              unidadeMedida: true,
              contrato: {
                select: {
                  numero: true,
                  fornecedor: { select: { nome: true } },
                },
              },
            },
          },
          unidadeEducacional: { select: { nome: true, codigo: true } },
        },
        orderBy: { itemContrato: { nome: "asc" } },
      });

      res.json(estoque);
    } catch (error) {
      console.error("Erro ao buscar estoque:", error);
      res.status(500).json({ error: "Não foi possível buscar o estoque." });
    }
  }
);

// COMENTÁRIO: Lista o estoque consolidado de todas as unidades
app.get("/api/estoque/consolidado", async (req: Request, res: Response) => {
  const { q, unidadeId, estoqueId, tipoEstoque } = req.query;

  try {
    const whereClause: Prisma.EstoqueWhereInput = {};

    if (unidadeId) {
      whereClause.unidadeEducacionalId = unidadeId as string;
    }
    if (tipoEstoque && tipoEstoque !== "todos") {
      whereClause.tipoEstoque = tipoEstoque as "creche" | "escola";
    }
    if (q) {
      whereClause.itemContrato = {
        nome: { contains: q as string, mode: "insensitive" },
      };
    }
    if (estoqueId) {
      whereClause.id = estoqueId as string;
    }

    const estoque = await prisma.estoque.findMany({
      where: whereClause,
      include: {
        itemContrato: {
          include: {
            unidadeMedida: true,
            contrato: {
              select: {
                numero: true,
                fornecedor: { select: { nome: true } },
              },
            },
          },
        },
        unidadeEducacional: { select: { nome: true, codigo: true } },
      },
      orderBy: [
        { unidadeEducacional: { nome: "asc" } },
        { itemContrato: { nome: "asc" } },
      ],
    });

    res.json(estoque);
  } catch (error) {
    console.error("Erro ao buscar estoque consolidado:", error);
    res
      .status(500)
      .json({ error: "Não foi possível buscar o estoque consolidado." });
  }
});

// COMENTÁRIO: Busca as movimentações de estoque
app.get("/api/estoque/movimentacoes", async (req: Request, res: Response) => {
  const { estoqueId, unidadeId, dataInicio, dataFim, tipoEstoque } = req.query;

  try {
    const whereClause: Prisma.MovimentacaoEstoqueWhereInput = {};
    const estoqueWhereClause: Prisma.EstoqueWhereInput = {};

    if (estoqueId) {
      whereClause.estoqueId = estoqueId as string;
    }

    if (unidadeId) {
      estoqueWhereClause.unidadeEducacionalId = unidadeId as string;
    }

    if (tipoEstoque && tipoEstoque !== "todos") {
      estoqueWhereClause.tipoEstoque = tipoEstoque as "creche" | "escola";
    }

    if (Object.keys(estoqueWhereClause).length > 0) {
      whereClause.estoque = estoqueWhereClause;
    }

    if (dataInicio && dataFim) {
      whereClause.dataMovimentacao = {
        gte: new Date(dataInicio as string),
        lte: new Date(dataFim as string),
      };
    }

    // NOVO: Adicionado include para unidadeDestino e fotoDescarte
    const movimentacoes = await prisma.movimentacaoEstoque.findMany({
      where: whereClause,
      include: {
        estoque: {
          include: {
            itemContrato: {
              include: {
                unidadeMedida: true,
              },
            },
            unidadeEducacional: { select: { nome: true, codigo: true } },
          },
        },
        recibo: { select: { numero: true } },
        unidadeDestino: { select: { nome: true } },
        fotoDescarte: { select: { url: true } },
      },
      orderBy: { dataMovimentacao: "desc" },
      take: 100,
    });

    res.json(movimentacoes);
  } catch (error) {
    console.error("Erro ao buscar movimentações:", error);
    res
      .status(500)
      .json({ error: "Não foi possível buscar as movimentações." });
  }
});

// COMENTÁRIO: Registra uma movimentação manual de estoque (saída, ajuste, remanejamento, descarte)
app.post("/api/estoque/movimentacao", async (req: Request, res: Response) => {
  const {
    estoqueId,
    tipo,
    quantidade,
    motivo,
    responsavel,
    unidadeDestinoId,
    fotoDescarte,
  } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const estoqueOrigem = await tx.estoque.findUnique({
        where: { id: estoqueId },
        // CORREÇÃO: Incluído a relação com a Unidade Educacional para acessar o nome
        include: {
          itemContrato: true,
          unidadeEducacional: true,
        },
      });

      if (!estoqueOrigem) {
        throw new Error("Estoque de origem não encontrado");
      }

      const quantidadeNum = Number(quantidade);
      const tipoMovimentacao = tipo as
        | "entrada"
        | "saida"
        | "ajuste"
        | "remanejamento"
        | "descarte";

      if (
        (tipoMovimentacao === "saida" ||
          tipoMovimentacao === "remanejamento" ||
          tipoMovimentacao === "descarte") &&
        quantidadeNum > estoqueOrigem.quantidadeAtual
      ) {
        throw new Error("Quantidade insuficiente em estoque");
      }

      if (tipoMovimentacao === "remanejamento" && !unidadeDestinoId) {
        throw new Error("Unidade de destino é obrigatória para remanejamento.");
      }

      if (tipoMovimentacao === "descarte" && !fotoDescarte) {
        throw new Error("A foto do descarte é obrigatória.");
      }

      const quantidadeAnteriorOrigem = estoqueOrigem.quantidadeAtual;
      let quantidadeNovaOrigem = quantidadeAnteriorOrigem;

      // Lógica de atualização do estoque de origem
      switch (tipoMovimentacao) {
        case "entrada":
          quantidadeNovaOrigem += quantidadeNum;
          break;
        case "saida":
        case "remanejamento":
        case "descarte":
          quantidadeNovaOrigem -= quantidadeNum;
          break;
        case "ajuste":
          quantidadeNovaOrigem = quantidadeNum;
          break;
      }

      const campoSaldoOrigem =
        estoqueOrigem.tipoEstoque === "creche" ? "saldoCreche" : "saldoEscola";
      const valorAjusteOrigem =
        tipoMovimentacao === "entrada" ? quantidadeNum : -quantidadeNum;

      await tx.itemContrato.update({
        where: { id: estoqueOrigem.itemContratoId },
        data: {
          [campoSaldoOrigem]: {
            increment: valorAjusteOrigem,
          },
          saldoAtual: {
            increment: valorAjusteOrigem,
          },
        },
      });

      const estoqueOrigemAtualizado = await tx.estoque.update({
        where: { id: estoqueId },
        data: {
          quantidadeAtual: quantidadeNovaOrigem,
          ultimaAtualizacao: new Date(),
        },
      });

      let fotoDescarteId = null;
      if (tipoMovimentacao === "descarte" && fotoDescarte) {
        const novaFotoDescarte = await tx.fotoDescarte.create({
          data: {
            url: fotoDescarte,
            motivo: motivo,
            responsavel: responsavel,
          },
        });
        fotoDescarteId = novaFotoDescarte.id;
      }

      // Registrar a movimentação de SAÍDA (origem)
      const movimentacaoSaida = await tx.movimentacaoEstoque.create({
        data: {
          estoqueId,
          tipo: tipoMovimentacao,
          quantidade: Math.abs(quantidadeNum),
          quantidadeAnterior: quantidadeAnteriorOrigem,
          quantidadeNova: quantidadeNovaOrigem,
          motivo,
          responsavel,
          dataMovimentacao: new Date(),
          unidadeDestinoId:
            tipoMovimentacao === "remanejamento" ? unidadeDestinoId : null,
          fotoDescarteId: fotoDescarteId,
        },
      });

      // NOVO: Lógica para criar a movimentação de ENTRADA (destino)
      if (tipoMovimentacao === "remanejamento" && unidadeDestinoId) {
        let estoqueDestino = await tx.estoque.findUnique({
          where: {
            unidadeEducacionalId_itemContratoId_tipoEstoque: {
              unidadeEducacionalId: unidadeDestinoId,
              itemContratoId: estoqueOrigem.itemContratoId,
              tipoEstoque: estoqueOrigem.tipoEstoque,
            },
          },
        });

        const quantidadeAnteriorDestino = estoqueDestino?.quantidadeAtual || 0;
        const quantidadeNovaDestino =
          (estoqueDestino?.quantidadeAtual || 0) + quantidadeNum;

        if (estoqueDestino) {
          estoqueDestino = await tx.estoque.update({
            where: { id: estoqueDestino.id },
            data: {
              quantidadeAtual: { increment: quantidadeNum },
              ultimaAtualizacao: new Date(),
            },
          });
        } else {
          estoqueDestino = await tx.estoque.create({
            data: {
              unidadeEducacionalId: unidadeDestinoId,
              itemContratoId: estoqueOrigem.itemContratoId,
              quantidadeAtual: quantidadeNum,
              quantidadeMinima: 0,
              ultimaAtualizacao: new Date(),
              tipoEstoque: estoqueOrigem.tipoEstoque,
            },
          });
        }

        await tx.movimentacaoEstoque.create({
          data: {
            estoqueId: estoqueDestino.id,
            tipo: "remanejamento",
            quantidade: quantidadeNum,
            quantidadeAnterior: quantidadeAnteriorDestino,
            quantidadeNova: quantidadeNovaDestino,
            motivo: `Remanejamento de: ${estoqueOrigem.unidadeEducacional.nome}`,
            responsavel,
            dataMovimentacao: new Date(),
          },
        });
      }

      return {
        estoque: estoqueOrigemAtualizado,
        movimentacao: movimentacaoSaida,
      };
    });

    res.status(201).json({
      message: "Movimentação registrada com sucesso",
      data: result,
    });
  } catch (error) {
    console.error("Erro ao registrar movimentação:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    res.status(500).json({ error: errorMessage });
  }
});

// COMENTÁRIO: Atualiza a quantidade mínima de um item no estoque
app.put(
  "/api/estoque/:id/quantidade-minima",
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { quantidadeMinima } = req.body;

    try {
      const estoque = await prisma.estoque.update({
        where: { id },
        data: {
          quantidadeMinima: Number(quantidadeMinima),
          ultimaAtualizacao: new Date(),
        },
        include: {
          itemContrato: { include: { unidadeMedida: true } },
          unidadeEducacional: { select: { nome: true } },
        },
      });

      res.json(estoque);
    } catch (error) {
      console.error("Erro ao atualizar quantidade mínima:", error);
      res
        .status(500)
        .json({ error: "Não foi possível atualizar a quantidade mínima." });
    }
  }
);

// COMENTÁRIO: Processa a saída de estoque via QR Code
app.post(
  "/api/estoque/saida-qrcode/:estoqueId",
  async (req: Request, res: Response) => {
    const { estoqueId } = req.params;
    const { quantidade } = req.body;
    const quantidadeSaida = Number(quantidade);
    const motivo = "Consumo diário (QR Code)";
    const responsavel = "Merendeira (QR Code)";

    if (isNaN(quantidadeSaida) || quantidadeSaida <= 0) {
      return res.status(400).json({ error: "Quantidade de saída inválida." });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const estoque = await tx.estoque.findUnique({
          where: { id: estoqueId },
          include: {
            itemContrato: {
              // Incluir para poder atualizar o saldo do contrato
              include: {
                contrato: true,
              },
            },
          },
        });

        if (!estoque) {
          throw new Error("Item de estoque não encontrado.");
        }

        const quantidadeAnterior = estoque.quantidadeAtual;
        const quantidadeNova = quantidadeAnterior - quantidadeSaida;

        if (quantidadeNova < 0) {
          throw new Error("Quantidade insuficiente em estoque para a saída.");
        }

        const estoqueAtualizado = await tx.estoque.update({
          where: { id: estoqueId },
          data: {
            quantidadeAtual: quantidadeNova,
            ultimaAtualizacao: new Date(),
          },
        });

        // NOVO: Atualiza o saldo do contrato com base no tipo de estoque
        const campoSaldoAjustar =
          estoque.tipoEstoque === "creche" ? "saldoCreche" : "saldoEscola";

        await tx.itemContrato.update({
          where: { id: estoque.itemContratoId },
          data: {
            [campoSaldoAjustar]: {
              decrement: quantidadeSaida,
            },
            saldoAtual: {
              decrement: quantidadeSaida,
            },
          },
        });

        const movimentacao = await tx.movimentacaoEstoque.create({
          data: {
            estoqueId,
            tipo: "saida",
            quantidade: quantidadeSaida,
            quantidadeAnterior,
            quantidadeNova,
            motivo,
            responsavel,
            dataMovimentacao: new Date(),
          },
        });

        return { estoque: estoqueAtualizado, movimentacao };
      });

      res.status(200).json({
        message: "Saída de estoque registrada com sucesso via QR Code.",
        data: result,
      });
    } catch (error) {
      console.error("Erro ao registrar saída via QR Code:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      res.status(500).json({ error: errorMessage });
    }
  }
);

// COMENTÁRIO: NOVA ROTA: Retorna todos os itens de estoque de uma unidade para o catálogo de QR Code
app.get(
  "/api/estoque/catalogo-qrcode/:unidadeId",
  async (req: Request, res: Response) => {
    const { unidadeId } = req.params;
    try {
      const itensEstoque = await prisma.estoque.findMany({
        where: {
          unidadeEducacionalId: unidadeId,
          quantidadeAtual: { gt: 0 }, // Apenas itens com estoque
        },
        select: {
          id: true,
          itemContrato: {
            select: {
              nome: true,
              unidadeMedida: { select: { sigla: true } },
            },
          },
          unidadeEducacional: {
            select: { nome: true },
          },
        },
        orderBy: { itemContrato: { nome: "asc" } },
      });

      res.json(itensEstoque);
    } catch (error) {
      console.error("Erro ao buscar itens para catálogo de QR Code:", error);
      res
        .status(500)
        .json({ error: "Não foi possível gerar o catálogo de QR Code." });
    }
  }
);

/// --- FIM ROTA ESTOQUES --- ///

/// --- ROTAS DE RELATÓRIOS --- ///

// COMENTÁRIO: Relatório de movimentação por responsável
app.get(
  "/api/relatorios/movimentacao-responsavel",
  async (req: Request, res: Response) => {
    const { responsavel, dataInicio, dataFim, tipoMovimentacao, unidadeId } =
      req.query;

    try {
      const whereClause: Prisma.MovimentacaoEstoqueWhereInput = {};
      const estoqueWhereClause: Prisma.EstoqueWhereInput = {};

      if (responsavel && responsavel !== "all") {
        whereClause.responsavel = responsavel as string;
      }

      if (unidadeId && unidadeId !== "all") {
        estoqueWhereClause.unidadeEducacionalId = unidadeId as string;
      }

      if (tipoMovimentacao && tipoMovimentacao !== "all") {
        whereClause.tipo = tipoMovimentacao as string;
      }

      if (Object.keys(estoqueWhereClause).length > 0) {
        whereClause.estoque = estoqueWhereClause;
      }

      if (dataInicio && dataFim) {
        whereClause.dataMovimentacao = {
          gte: new Date(dataInicio as string),
          lte: new Date(dataFim as string),
        };
      }

      const movimentacoes = await prisma.movimentacaoEstoque.findMany({
        where: whereClause,
        include: {
          estoque: {
            include: {
              itemContrato: {
                select: {
                  nome: true,
                  unidadeMedida: { select: { sigla: true } },
                  contrato: {
                    select: {
                      numero: true,
                      fornecedor: { select: { nome: true } },
                    },
                  },
                },
              },
              unidadeEducacional: { select: { nome: true } },
            },
          },
          recibo: { select: { numero: true } },
          unidadeDestino: { select: { nome: true } },
          fotoDescarte: { select: { url: true } },
        },
        orderBy: { dataMovimentacao: "desc" },
      });

      const totalMovimentacoes = movimentacoes.length;
      const totalEntradas = movimentacoes
        .filter((m) => m.tipo === "entrada")
        .reduce((sum, m) => sum + m.quantidade, 0);
      const totalSaidas = movimentacoes
        .filter((m) => m.tipo === "saida")
        .reduce((sum, m) => sum + m.quantidade, 0);
      const totalRemanejamentos = movimentacoes
        .filter((m) => m.tipo === "remanejamento")
        .reduce((sum, m) => sum + m.quantidade, 0);
      const totalDescartes = movimentacoes
        .filter((m) => m.tipo === "descarte")
        .reduce((sum, m) => sum + m.quantidade, 0);
      const totalAjustes = movimentacoes
        .filter((m) => m.tipo === "ajuste")
        .reduce((sum, m) => sum + m.quantidade, 0);

      const contaEntradas = movimentacoes.filter(
        (m) => m.tipo === "entrada"
      ).length;
      const contaSaidas = movimentacoes.filter(
        (m) => m.tipo === "saida"
      ).length;
      const contaDescartes = movimentacoes.filter(
        (m) => m.tipo === "descarte"
      ).length;
      const contaRemanejamentos = movimentacoes.filter(
        (m) => m.tipo === "remanejamento"
      ).length;
      const contaAjustes = movimentacoes.filter(
        (m) => m.tipo === "ajuste"
      ).length;

      res.json({
        movimentacoes,
        estatisticas: {
          totalMovimentacoes,
          totalEntradas,
          totalSaidas,
          totalRemanejamentos,
          totalDescartes,
          totalAjustes,
          contaAjustes,
          contaDescartes,
          contaRemanejamentos,
          contaSaidas,
          contaEntradas,
        },
      });
    } catch (error) {
      console.error(
        "Erro ao gerar relatório de movimentação por responsável:",
        error
      );
      res.status(500).json({
        error:
          "Não foi possível gerar o relatório de movimentação por responsável.",
      });
    }
  }
);

// COMENTÁRIO: Retorna uma lista de todos os responsáveis por movimentações de estoque
app.get(
  "/api/movimentacoes/responsaveis",
  async (req: Request, res: Response) => {
    try {
      const responsaveis = await prisma.movimentacaoEstoque.findMany({
        distinct: ["responsavel"],
        select: { responsavel: true },
        where: {
          responsavel: {
            not: "",
          },
        },
        orderBy: { responsavel: "asc" },
      });
      res.json(responsaveis.map((r) => r.responsavel));
    } catch (error) {
      console.error("Erro ao buscar responsáveis por movimentação:", error);
      res
        .status(500)
        .json({ error: "Não foi possível buscar a lista de responsáveis." });
    }
  }
);

// COMENTÁRIO: Relatório de estoque por unidade
app.get(
  "/api/relatorios/estoque-unidade",
  async (req: Request, res: Response) => {
    const { unidadeId, dataInicio, dataFim, itemId } = req.query;

    try {
      const whereClause: Prisma.EstoqueWhereInput = {};
      const movimentacoesWhere: Prisma.MovimentacaoEstoqueWhereInput = {};

      if (unidadeId && unidadeId !== "all") {
        whereClause.unidadeEducacionalId = unidadeId as string;
        movimentacoesWhere.estoque = {
          unidadeEducacionalId: unidadeId as string,
        };
      }

      // CORREÇÃO: Adiciona o filtro por item de contrato de forma segura
      if (itemId && itemId !== "all") {
        whereClause.itemContratoId = itemId as string;
        movimentacoesWhere.estoque = {
          ...(movimentacoesWhere.estoque as object),
          itemContratoId: itemId as string,
        };
      }

      if (dataInicio && dataFim) {
        movimentacoesWhere.dataMovimentacao = {
          gte: new Date(dataInicio as string),
          lte: new Date(dataFim as string),
        };
      }

      const [estoque, movimentacoes] = await Promise.all([
        prisma.estoque.findMany({
          where: whereClause,
          include: {
            itemContrato: {
              include: {
                unidadeMedida: true,
                contrato: {
                  select: {
                    numero: true,
                    fornecedor: { select: { nome: true } },
                  },
                },
              },
            },
            unidadeEducacional: { select: { nome: true, codigo: true } },
          },
          orderBy: { itemContrato: { nome: "asc" } },
        }),
        prisma.movimentacaoEstoque.findMany({
          where: movimentacoesWhere,
          include: {
            estoque: {
              include: {
                itemContrato: { include: { unidadeMedida: true } },
                unidadeEducacional: { select: { nome: true } },
              },
            },
          },
          orderBy: { dataMovimentacao: "desc" },
        }),
      ]);

      const totalItens = estoque.length;
      const itensComEstoque = estoque.filter(
        (e) => e.quantidadeAtual > 0
      ).length;
      const itensAbaixoMinimo = estoque.filter(
        (e) => e.quantidadeMinima > 0 && e.quantidadeAtual < e.quantidadeMinima
      ).length;
      const valorTotalEstoque = estoque.reduce(
        (sum, e) => sum + e.quantidadeAtual * e.itemContrato.valorUnitario,
        0
      );

      const entradas = movimentacoes.filter((m) => m.tipo === "entrada");
      const saidas = movimentacoes.filter((m) => m.tipo === "saida");
      const descartes = movimentacoes.filter((m) => m.tipo === "descarte");
      const remanejamentos = movimentacoes.filter(
        (m) => m.tipo === "remanejamento"
      );
      const ajustes = movimentacoes.filter((m) => m.tipo === "ajuste");
      const totalEntradas = entradas.reduce((sum, m) => sum + m.quantidade, 0);
      const totalSaidas = saidas.reduce((sum, m) => sum + m.quantidade, 0);
      const totalDescartes = descartes.reduce(
        (sum, m) => sum + m.quantidade,
        0
      );
      const totalRemanejamentos = remanejamentos.reduce(
        (sum, m) => sum + m.quantidade,
        0
      );
      const totalAjustes = ajustes.reduce((sum, m) => sum + m.quantidade, 0);
      const contaEntradas = entradas.length;
      const contaSaidas = saidas.length;
      const contaDescartes = descartes.length;
      const contaRemanejamentos = remanejamentos.length;
      const contaAjustes = ajustes.length;

      res.json({
        estoque,
        movimentacoes,
        estatisticas: {
          totalItens,
          itensComEstoque,
          itensAbaixoMinimo,
          valorTotalEstoque,
          totalEntradas,
          totalSaidas,
          totalDescartes,
          totalRemanejamentos,
          totalAjustes,
          contaEntradas,
          contaSaidas,
          contaDescartes,
          contaRemanejamentos,
          contaAjustes,
          totalMovimentacoes: movimentacoes.length,
        },
      });
    } catch (error) {
      console.error("Erro ao gerar relatório de estoque:", error);
      res
        .status(500)
        .json({ error: "Não foi possível gerar o relatório de estoque." });
    }
  }
);

// COMENTÁRIO: Gera um relatório consolidado de pedidos por contrato em PDF
// UTILIZAÇÃO: Chamada pela página `Relatorios.tsx` ao clicar em "Exportar PDF"
app.post(
  "/api/relatorios/consolidado-pedidos/:contratoId",
  async (req: Request, res: Response) => {
    const { contratoId } = req.params;

    try {
      // Buscar dados do contrato e pedidos
      const contrato = await prisma.contrato.findUnique({
        where: { id: contratoId },
        include: {
          fornecedor: true,
          itens: { include: { unidadeMedida: true } },
        },
      });

      if (!contrato) {
        return res.status(404).json({ error: "Contrato não encontrado" });
      }

      const pedidos = await prisma.pedido.findMany({
        where: { contratoId },
        include: {
          itens: {
            include: {
              itemContrato: { include: { unidadeMedida: true } },
              unidadeEducacional: true,
            },
          },
        },
      });

      // Simular geração de PDF (em produção, usar biblioteca como puppeteer ou PDFKit)
      // NOVO: A lógica de consolidação de dados para o PDF foi movida para esta rota
      const itensPorContrato = contrato.itens.map((itemContrato) => {
        const quantidadePedida = pedidos
          .flatMap((p) => p.itens)
          .filter((item) => item.itemContratoId === itemContrato.id)
          .reduce((sum, item) => sum + item.quantidade, 0);

        const valorConsumido = quantidadePedida * itemContrato.valorUnitario;
        const percentualConsumido =
          itemContrato.quantidadeOriginal > 0
            ? (quantidadePedida / itemContrato.quantidadeOriginal) * 100
            : 0;

        return {
          ...itemContrato,
          quantidadePedida,
          valorConsumido,
          percentualConsumido,
          saldoRestante: itemContrato.quantidadeOriginal - quantidadePedida,
        };
      });

      const unidadesAtendidas = [
        ...new Set(
          pedidos.flatMap((p) => p.itens.map((i) => i.unidadeEducacional.nome))
        ),
      ];

      const pedidosPorStatus = {
        pendente: pedidos.filter((p) => p.status === "pendente").length,
        confirmado: pedidos.filter((p) => p.status === "confirmado").length,
        entregue: pedidos.filter((p) => p.status === "entregue").length,
        cancelado: pedidos.filter((p) => p.status === "cancelado").length,
      };

      const reportData = {
        contrato,
        pedidos,
        totalPedidos: pedidos.length,
        valorTotalPedidos: pedidos.reduce((sum, p) => sum + p.valorTotal, 0),
        dataGeracao: new Date(),
        itensPorContrato, // Incluir dados consolidados por item
        unidadesAtendidas,
        pedidosPorStatus,
      };

      // Por enquanto, retornar JSON (em produção seria um PDF)
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="relatorio-${contrato.numero}.json"`
      );
      res.json(reportData);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      res.status(500).json({ error: "Não foi possível gerar o relatório" });
    }
  }
);

// NOVA ROTA: Rota para buscar dados consolidados de pedidos para exibição no frontend
app.get(
  "/api/relatorios/consolidado-pedidos-data/:contratoId",
  async (req: Request, res: Response) => {
    const { contratoId } = req.params;
    try {
      const contrato = await prisma.contrato.findUnique({
        where: { id: contratoId },
        include: {
          fornecedor: true,
          itens: { include: { unidadeMedida: true } },
        },
      });

      if (!contrato) {
        return res.status(404).json({ error: "Contrato não encontrado." });
      }

      const pedidos = await prisma.pedido.findMany({
        where: { contratoId },
        include: {
          itens: {
            include: {
              itemContrato: { include: { unidadeMedida: true } },
              unidadeEducacional: true,
            },
          },
          // NOVO: Inclui os recibos e seus itens
          recibos: {
            include: {
              unidadeEducacional: { select: { nome: true } },
              itens: {
                include: {
                  itemPedido: {
                    include: {
                      itemContrato: {
                        select: {
                          nome: true,
                          unidadeMedida: { select: { sigla: true } },
                        },
                      },
                    },
                  },
                },
              },
              reciboOriginal: { select: { numero: true } }, // Inclui o link para o original
            },
          },
        },
      });

      const itensPorContrato = contrato.itens.map((itemContrato) => {
        const quantidadePedida = pedidos
          .flatMap((p) => p.itens)
          .filter((item) => item.itemContratoId === itemContrato.id)
          .reduce((sum, item) => sum + item.quantidade, 0);

        const valorConsumido = quantidadePedida * itemContrato.valorUnitario;
        const percentualConsumido =
          itemContrato.quantidadeOriginal > 0
            ? (quantidadePedida / itemContrato.quantidadeOriginal) * 100
            : 0;

        return {
          ...itemContrato,
          quantidadePedida,
          valorConsumido,
          percentualConsumido,
          saldoRestante: itemContrato.quantidadeOriginal - quantidadePedida,
        };
      });

      const unidadesAtendidas = [
        ...new Set(
          pedidos.flatMap((p) => p.itens.map((i) => i.unidadeEducacional.nome))
        ),
      ];

      const pedidosPorStatus = {
        pendente: pedidos.filter((p) => p.status === "pendente").length,
        confirmado: pedidos.filter((p) => p.status === "confirmado").length,
        entregue: pedidos.filter((p) => p.status === "entregue").length,
        cancelado: pedidos.filter((p) => p.status === "cancelado").length,
      };

      res.json({
        contrato,
        pedidos,
        totalPedidos: pedidos.length,
        valorTotalPedidos: pedidos.reduce((sum, p) => sum + p.valorTotal, 0),
        unidadesAtendidas,
        pedidosPorStatus,
        itensPorContrato,
      });
    } catch (error) {
      console.error("Erro ao buscar dados consolidados do relatório:", error);
      res.status(500).json({
        error: "Não foi possível carregar os dados consolidados do relatório.",
      });
    }
  }
);

// COMENTÁRIO: Relatório de entregas por período
app.get("/api/relatorios/entregas", async (req: Request, res: Response) => {
  const { dataInicio, dataFim, unidadeId } = req.query;

  try {
    const whereClause: Prisma.ReciboWhereInput = {};

    if (dataInicio && dataFim) {
      whereClause.dataEntrega = {
        gte: new Date(dataInicio as string),
        lte: new Date(dataFim as string),
      };
    }

    if (unidadeId && unidadeId !== "all") {
      whereClause.unidadeEducacionalId = unidadeId as string;
    }

    const recibos = await prisma.recibo.findMany({
      where: whereClause,
      include: {
        unidadeEducacional: true,
        pedido: {
          include: {
            contrato: { include: { fornecedor: true } },
          },
        },
        itens: {
          include: {
            itemPedido: {
              include: {
                itemContrato: { include: { unidadeMedida: true } },
              },
            },
          },
        },
      },
      orderBy: { dataEntrega: "desc" },
    });

    const estatisticas = {
      totalEntregas: recibos.length,
      entregasConfirmadas: recibos.filter((r) => r.status === "confirmado")
        .length,
      entregasPendentes: recibos.filter((r) => r.status === "pendente").length,
      entregasAjustadas: recibos.filter((r) => r.status === "ajustado").length,
      valorTotalEntregue: recibos.reduce((sum, r) => {
        return (
          sum +
          r.itens.reduce((itemSum, item) => {
            const quantidadeRecebida = item.quantidadeRecebida ?? 0;
            const valorUnitario =
              item.itemPedido?.itemContrato?.valorUnitario ?? 0;
            return itemSum + quantidadeRecebida * valorUnitario;
          }, 0)
        );
      }, 0),
    };

    res.json({ recibos, estatisticas });
  } catch (error) {
    console.error("Erro ao gerar relatório de entregas:", error);
    res
      .status(500)
      .json({ error: "Não foi possível gerar o relatório de entregas" });
  }
});

// COMENTÁRIO: Relatório de conformidade das entregas
app.get("/api/relatorios/conformidade", async (req: Request, res: Response) => {
  const { dataInicio, dataFim, unidadeId } = req.query;

  try {
    // Tipagem explícita para o objeto whereClause
    const whereClause: Prisma.ReciboWhereInput = {};

    if (dataInicio && dataFim) {
      whereClause.dataEntrega = {
        gte: new Date(dataInicio as string),
        lte: new Date(dataFim as string),
      };
    }

    if (unidadeId && unidadeId !== "all") {
      whereClause.unidadeEducacionalId = unidadeId as string;
    }

    const recibos = await prisma.recibo.findMany({
      where: whereClause,
      include: {
        unidadeEducacional: true,
        pedido: {
          include: {
            contrato: { include: { fornecedor: true } },
          },
        },
        itens: true,
      },
    });

    const analiseConformidade = recibos.map((recibo) => {
      const totalItens = recibo.itens.length;
      const itensConformes = recibo.itens.filter(
        (item) => item.conforme
      ).length;
      const percentualConformidade =
        totalItens > 0 ? (itensConformes / totalItens) * 100 : 0;

      return {
        ...recibo,
        totalItens,
        itensConformes,
        percentualConformidade,
      };
    });

    const mediaConformidade =
      analiseConformidade.length > 0
        ? analiseConformidade.reduce(
            (sum, r) => sum + r.percentualConformidade,
            0
          ) / analiseConformidade.length
        : 0;

    res.json({
      analiseConformidade,
      estatisticas: {
        totalRecibos: recibos.length,
        mediaConformidade,
        recibosConformes: analiseConformidade.filter(
          (r) => r.percentualConformidade === 100
        ).length,
        recibosParciais: analiseConformidade.filter(
          (r) => r.percentualConformidade > 0 && r.percentualConformidade < 100
        ).length,
        recibosNaoConformes: analiseConformidade.filter(
          (r) => r.percentualConformidade === 0
        ).length,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar relatório de conformidade:", error);
    res
      .status(500)
      .json({ error: "Não foi possível gerar o relatório de conformidade" });
  }
});

// COMENTÁRIO: Relatório de gastos por fornecedor
app.get(
  "/api/relatorios/gastos-fornecedor",
  async (req: Request, res: Response) => {
    const { dataInicio, dataFim, fornecedorId } = req.query; // Adicionado fornecedorId

    try {
      // Tipagem explícita para o objeto whereClause
      const whereClause: Prisma.PedidoWhereInput = {};

      if (dataInicio && dataFim) {
        whereClause.dataPedido = {
          gte: new Date(dataInicio as string),
          lte: new Date(dataFim as string),
        };
      }

      // Adiciona filtro por fornecedorId
      if (fornecedorId) {
        whereClause.contrato = {
          fornecedorId: fornecedorId as string,
        };
      }

      const pedidos = await prisma.pedido.findMany({
        where: whereClause,
        include: {
          contrato: { include: { fornecedor: true } },
        },
      });

      // Interface para o objeto de gastos por fornecedor
      interface GastoFornecedor {
        fornecedorId: string;
        fornecedorNome: string;
        totalGasto: number;
        totalPedidos: number;
      }

      const gastosPorFornecedor = pedidos.reduce(
        (acc: Record<string, GastoFornecedor>, pedido) => {
          const fornecedorId = pedido.contrato.fornecedorId;
          const fornecedorNome = pedido.contrato.fornecedor.nome;

          if (!acc[fornecedorId]) {
            acc[fornecedorId] = {
              fornecedorId,
              fornecedorNome,
              totalGasto: 0,
              totalPedidos: 0,
            };
          }

          acc[fornecedorId].totalGasto += pedido.valorTotal;
          acc[fornecedorId].totalPedidos += 1;

          return acc;
        },
        {}
      );

      const relatorio = Object.values(gastosPorFornecedor).sort(
        (a, b) => b.totalGasto - a.totalGasto
      );

      res.json({
        gastosPorFornecedor: relatorio,
        estatisticas: {
          totalFornecedores: relatorio.length,
          gastoTotal: relatorio.reduce((sum, f) => sum + f.totalGasto, 0),
          pedidosTotal: relatorio.reduce((sum, f) => sum + f.totalPedidos, 0),
        },
      });
    } catch (error) {
      console.error("Erro ao gerar relatório de gastos:", error);
      res
        .status(500)
        .json({ error: "Não foi possível gerar o relatório de gastos" });
    }
  }
);

/// --- FIM ROTA DE RELATORIOS --- ///

/// --- ROTAS DE PERCAPITA --- ///

// COMENTÁRIO: Retorna uma lista de ItemContrato ativos para o formulário de Percápita
app.get(
  "/api/percapita/itens-contrato-ativos",
  async (req: Request, res: Response) => {
    try {
      const itensContrato = await prisma.itemContrato.findMany({
        where: {
          contrato: {
            status: "ativo",
          },
        },
        include: {
          unidadeMedida: true,
          contrato: {
            include: {
              fornecedor: true,
            },
          },
        },
        orderBy: {
          nome: "asc",
        },
      });

      res.json(itensContrato);
    } catch (error) {
      console.error("Erro ao buscar itens de contrato para percápita:", error);
      res
        .status(500)
        .json({ error: "Não foi possível buscar os itens de contrato." });
    }
  }
);

// COMENTÁRIO: Rotas de Percápita de Estudantes
// ROTA 1: Listar todas as percápitas com filtros
app.get("/api/percapita", async (req: Request, res: Response) => {
  const { q } = req.query;
  try {
    const whereClause: Prisma.PercapitaItemWhereInput = {};
    if (q) {
      whereClause.OR = [
        {
          itemContrato: {
            nome: { contains: q as string, mode: "insensitive" },
          },
        },
        {
          tipoEstudante: {
            nome: { contains: q as string, mode: "insensitive" },
          },
        },
      ];
    }
    const percapitas = await prisma.percapitaItem.findMany({
      where: whereClause,
      include: {
        itemContrato: {
          include: {
            unidadeMedida: true,
            contrato: {
              select: {
                numero: true,
                fornecedor: { select: { nome: true } },
              },
            },
          },
        },
        tipoEstudante: true,
      },
      orderBy: { itemContrato: { nome: "asc" } },
    });
    res.json(percapitas);
  } catch (error) {
    console.error("Erro ao buscar percápitas:", error);
    res.status(500).json({ error: "Não foi possível buscar as percápitas." });
  }
});

// ROTA 2: Criar uma nova percápita
app.post("/api/percapita", async (req: Request, res: Response) => {
  try {
    const novaPercapita = await prisma.percapitaItem.create({
      data: req.body,
    });
    res.status(201).json(novaPercapita);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Esta percápita já existe." });
      }
    }
    console.error("Erro ao criar percápita:", error);
    res.status(500).json({ error: "Não foi possível criar a percápita." });
  }
});

// ROTA 3: Atualizar uma percápita
app.put("/api/percapita/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const percapitaAtualizada = await prisma.percapitaItem.update({
      where: { id },
      data: req.body,
    });
    res.json(percapitaAtualizada);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Esta percápita já existe." });
      }
    }
    console.error("Erro ao atualizar percápita:", error);
    res.status(500).json({ error: "Não foi possível atualizar a percápita." });
  }
});

// ROTA 4: Deletar uma percápita
app.delete("/api/percapita/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.percapitaItem.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar percápita:", error);
    res.status(500).json({ error: "Não foi possível deletar a percápita." });
  }
});

// COMENTÁRIO: Retorna a lista de Tipos de Estudante
app.get("/api/tipos-estudante", async (req: Request, res: Response) => {
  try {
    const tiposEstudante = await prisma.tipoEstudante.findMany({
      orderBy: { ordem: "asc" },
    });
    res.json(tiposEstudante);
  } catch (error) {
    console.error("Erro ao buscar tipos de estudante:", error);
    res
      .status(500)
      .json({ error: "Não foi possível buscar os tipos de estudante." });
  }
});

// NOVO: Rota para criar percápitas em lote
app.post("/api/percapita/create-batch", async (req: Request, res: Response) => {
  const { itemContratoId, percapitas } = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Primeiro, deleta as percápitas existentes para o item de contrato,
      // para evitar duplicatas e lidar com o "upsert" de forma mais simples
      await tx.percapitaItem.deleteMany({
        where: {
          itemContratoId: itemContratoId,
        },
      });

      // Defina a interface para o objeto percápita
      interface PercapitaInput {
        tipoEstudanteId: string;
        gramagemPorEstudante: number;
        frequenciaMensal: number;
        ativo: boolean;
      }

      // Em seguida, cria os novos registros
      const novasPercapitas = await tx.percapitaItem.createMany({
        data: (percapitas as PercapitaInput[]).map((p) => ({
          itemContratoId,
          tipoEstudanteId: p.tipoEstudanteId,
          gramagemPorEstudante: p.gramagemPorEstudante,
          frequenciaMensal: p.frequenciaMensal,
          ativo: p.ativo,
        })),
        skipDuplicates: true, // Garante que não haja duplicatas
      });
      return novasPercapitas;
    });

    res.status(201).json({
      message: `Foram cadastradas ${result.count} percápita(s) com sucesso.`,
    });
  } catch (error) {
    console.error("Erro ao criar percápita em lote:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({
          error: "Uma percápita para este tipo de estudante já existe.",
        });
      }
    }
    res.status(500).json({ error: "Não foi possível criar as percápitas." });
  }
});

// COMENTÁRIO: Nova Rota: Retorna uma lista de ItemContrato ativos e suas percápitas
// UTILIZAÇÃO: Usada pelo NovoPedidoDialog para pré-preencher a quantidade sugerida
app.get(
  "/api/percapita/itens-por-contrato/:contratoId",
  async (req: Request, res: Response) => {
    const { contratoId } = req.params;
    try {
      const itensContrato = await prisma.itemContrato.findMany({
        where: {
          contratoId,
          contrato: {
            status: "ativo",
          },
        },
        include: {
          unidadeMedida: true,
          percapitas: {
            include: {
              tipoEstudante: true,
            },
          },
        },
      });

      res.json(itensContrato);
    } catch (error) {
      console.error("Erro ao buscar itens de contrato com percápita:", error);
      res.status(500).json({
        error: "Não foi possível buscar os itens de contrato para percápita.",
      });
    }
  }
);

// NOVO: Rota para buscar unidades ativas com o tipo de estoque
app.get(
  "/api/unidades-com-tipo-estoque",
  async (req: Request, res: Response) => {
    try {
      const unidades = await prisma.unidadeEducacional.findMany({
        where: { ativo: true },
        select: {
          id: true,
          nome: true,
          estudantesBercario: true,
          estudantesMaternal: true,
          estudantesPreEscola: true,
          estudantesRegular: true,
          estudantesIntegral: true,
          estudantesEja: true,
        },
        orderBy: { nome: "asc" },
      });

      // Anexar o tipo de estoque a cada unidade
      const unidadesComTipoEstoque = unidades.map((unidade) => {
        const isCreche =
          unidade.estudantesBercario > 0 ||
          unidade.estudantesMaternal > 0 ||
          unidade.estudantesPreEscola > 0;
        const tipoEstoque = isCreche ? "creche" : "escola";
        return {
          ...unidade,
          tipoEstoque,
        };
      });

      res.json(unidadesComTipoEstoque);
    } catch (error) {
      console.error("Erro ao buscar unidades com tipo de estoque:", error);
      res.status(500).json({ error: "Não foi possível buscar as unidades." });
    }
  }
);

// COMENTÁRIO: Nova Rota: Retorna uma lista de todas as unidades educacionais ativas com detalhes de estudantes
// UTILIZAÇÃO: Usada pelo NovoPedidoDialog para o cálculo da percápita
app.get(
  "/api/unidades-ativas-detalhes",
  async (req: Request, res: Response) => {
    try {
      const unidades = await prisma.unidadeEducacional.findMany({
        where: { ativo: true },
        select: {
          id: true,
          nome: true,
          codigo: true,
          estudantesBercario: true,
          estudantesMaternal: true,
          estudantesPreEscola: true,
          estudantesRegular: true,
          estudantesIntegral: true,
          estudantesEja: true,
        },
        orderBy: { nome: "asc" },
      });
      res.json(unidades);
    } catch (error) {
      console.error("Erro ao buscar unidades ativas com detalhes:", error);
      res.status(500).json({ error: "Não foi possível buscar as unidades." });
    }
  }
);

/// --- FIM ROTA DE PERCAPITA --- ///

/// --- ROTA DE DASHBOARD --- ///
// COMENTÁRIO: Rota para buscar todos os dados do Dashboard
app.get("/api/dashboard-data", async (req: Request, res: Response) => {
  try {
    // Métricas Principais
    const totalContratos = await prisma.contrato.count();
    const contratosAtivos = await prisma.contrato.count({
      where: { status: "ativo" },
    });
    const totalFornecedores = await prisma.fornecedor.count({
      where: { ativo: true },
    });
    const totalPedidos = await prisma.pedido.count();

    const valorTotalContratosResult = await prisma.contrato.aggregate({
      _sum: { valorTotal: true },
      where: { status: "ativo" },
    });
    const valorTotalContratos = valorTotalContratosResult._sum.valorTotal || 0;

    const consolidacoesPendentes = await prisma.recibo.count({
      where: { status: "pendente" },
    });

    // Cálculo da Eficiência de Entrega (Média de Conformidade)
    const allRecibosForConformity = await prisma.recibo.findMany({
      where: {
        status: {
          in: ["confirmado", "parcial", "rejeitado"],
        },
      },
      include: {
        itens: true,
      },
    });

    let mediaConformidade = 0;
    if (allRecibosForConformity.length > 0) {
      const totalPercent = allRecibosForConformity.reduce((sum, recibo) => {
        const itensConformes = recibo.itens.filter(
          (item) => item.conforme
        ).length;
        const totalItens = recibo.itens.length;
        return sum + (totalItens > 0 ? (itensConformes / totalItens) * 100 : 0);
      }, 0);
      mediaConformidade = totalPercent / allRecibosForConformity.length;
    }

    // Alertas e Informações Importantes
    // Itens com Saldo Baixo
    const allItemsContrato = await prisma.itemContrato.findMany({
      where: {
        quantidadeOriginal: { gt: 0 },
      },
      include: {
        unidadeMedida: true,
        // Adicionado include para contrato e fornecedor
        contrato: {
          select: {
            fornecedor: {
              select: {
                nome: true, // Apenas o nome do fornecedor é necessário
              },
            },
          },
        },
      },
    });

    const itensComSaldoBaixo = allItemsContrato
      .filter((item) => {
        return item.saldoAtual / item.quantidadeOriginal < 0.2;
      })
      .sort(
        (a, b) =>
          a.saldoAtual / a.quantidadeOriginal -
          b.saldoAtual / b.quantidadeOriginal
      )
      .slice(0, 3); // Limitar a 3 para o dashboard

    // Contratos Próximos do Vencimento (30 dias)
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    const contratosVencendo = await prisma.contrato.findMany({
      where: {
        dataFim: {
          lte: thirtyDaysLater,
          gte: today,
        },
        status: "ativo",
      },
      include: {
        fornecedor: { select: { nome: true } },
      },
      orderBy: { dataFim: "asc" },
      take: 3, // Limitar a 3 para o dashboard
    });

    // Contratos Recentes
    const contratosRecentes = await prisma.contrato.findMany({
      include: {
        fornecedor: { select: { nome: true } },
        _count: { select: { itens: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    res.json({
      metrics: {
        totalContratos,
        contratosAtivos,
        totalFornecedores,
        totalPedidos,
        valorTotalContratos,
        consolidacoesPendentes,
        eficienciaEntrega: mediaConformidade,
      },
      alerts: {
        itensComSaldoBaixo,
        contratosVencendo,
      },
      recentContracts: contratosRecentes,
    });
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    res
      .status(500)
      .json({ error: "Não foi possível carregar os dados do dashboard." });
  }
});

/// --- ROTAS DE RELATÓRIOS PDF --- ///

app.post(
  "/api/relatorios/consolidado-pedidos-pdf/:contratoId",
  async (req: Request, res: Response) => {
    const { contratoId } = req.params;

    try {
      const browser = await puppeteer.launch({
        executablePath: process.env.CHROME_BIN || "/usr/bin/chromium-browser",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

      // Busca os dados do relatório a partir da rota de dados existente
      const reportDataResponse = await fetch(
        `${backendUrl}/api/relatorios/consolidado-pedidos-data/${contratoId}`
      );
      if (!reportDataResponse.ok) {
        throw new Error("Falha ao buscar dados do relatório.");
      }
      const reportData = await reportDataResponse.json();

      // CORREÇÃO: Tipagem para a nova estrutura de dados
      interface RelatorioItemConsolidado {
        nome: string;
        unidadeMedida: { sigla: string };
        quantidadeOriginal: number;
        quantidadePedida: number;
        saldoRestante: number;
      }

      interface ReciboDetalhes {
        id: string;
        numero: string;
        unidadeEducacional: { nome: string };
        itens: {
          conforme: boolean;
          quantidadeSolicitada: number;
          quantidadeRecebida: number;
          itemPedido: {
            itemContrato: {
              nome: string;
              unidadeMedida: { sigla: string };
            };
          };
        }[];
      }

      interface PedidoDetalhes {
        id: string;
        numero: string;
        status: string;
        dataPedido: string;
        valorTotal: number;
        recibos: ReciboDetalhes[];
      }

      interface ReportData {
        contrato: {
          numero: string;
          fornecedor: { nome: string };
          valorTotal: number;
        };
        pedidos: PedidoDetalhes[];
        totalPedidos: number;
        valorTotalPedidos: number;
        unidadesAtendidas: string[];
        itensPorContrato: RelatorioItemConsolidado[];
        pedidosPorStatus: Record<string, number>;
      }

      const typedReportData: ReportData = reportData;

      // NOVO: Renderiza os detalhes de cada pedido
      const pedidosHtml = typedReportData.pedidos
        .map((pedido) => {
          const recibosHtml = pedido.recibos
            .map((recibo) => {
              const itensDoReciboHtml = recibo.itens
                .map((item) => {
                  const status = item.conforme ? "Conforme" : "Não Conforme";
                  const statusColor = item.conforme ? "green" : "red";
                  return `
                    <tr>
                        <td>${item.itemPedido.itemContrato.nome}</td>
                        <td>${item.quantidadeSolicitada} ${item.itemPedido.itemContrato.unidadeMedida.sigla}</td>
                        <td>${item.quantidadeRecebida} ${item.itemPedido.itemContrato.unidadeMedida.sigla}</td>
                        <td style="color: ${statusColor};">${status}</td>
                    </tr>
                `;
                })
                .join("");

              return `
                <div class="subsection">
                    <h3>Recibo #${recibo.numero} - Unidade: ${recibo.unidadeEducacional.nome}</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qtd. Solicitada</th>
                                <th>Qtd. Recebida</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itensDoReciboHtml}
                        </tbody>
                    </table>
                </div>
                <br/>
            `;
            })
            .join("");

          return `
            <div class="section" style="page-break-inside: avoid;">
                <h2>Pedido: ${pedido.numero}</h2>
                <p>Status: ${pedido.status}</p>
                <p>Data do Pedido: ${new Date(
                  pedido.dataPedido
                ).toLocaleDateString("pt-BR")}</p>
                <p>Valor Total: R$ ${pedido.valorTotal.toFixed(2)}</p>
                ${recibosHtml}
            </div>
        `;
        })
        .join("");

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório Consolidado de Pedidos</title>
            <style>
                body { font-family: sans-serif; padding: 20px; }
                h1 { color: #333; }
                .section { margin-bottom: 20px; border: 1px solid #ccc; padding: 10px; border-radius: 5px; }
                .subsection { margin-bottom: 15px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                h2, h3 { margin-top: 0; }
            </style>
        </head>
        <body>
            <h1>Relatório Consolidado de Pedidos</h1>
            <div class="section">
                <h2>Contrato: ${typedReportData.contrato.numero}</h2>
                <p>Fornecedor: ${typedReportData.contrato.fornecedor.nome}</p>
                <p>Valor Total do Contrato: R$ ${typedReportData.contrato.valorTotal.toFixed(
                  2
                )}</p>
            </div>
            
            ${pedidosHtml}

        </body>
        </html>
    `;

      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ format: "A4" });

      await browser.close();

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-consolidado-${typedReportData.contrato.numero}.pdf"`,
        "Content-Length": pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Erro ao gerar PDF do relatório:", error);
      res
        .status(500)
        .json({ error: "Não foi possível gerar o relatório PDF." });
    }
  }
);

app.post(
  "/api/relatorios/entregas-pdf",
  async (req: Request, res: Response) => {
    const { dataInicio, dataFim, unidadeId } = req.body;

    try {
      const browser = await puppeteer.launch({
        executablePath: process.env.CHROME_BIN || "/usr/bin/chromium-browser",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      // CORREÇÃO: Definição das interfaces para o relatório
      interface ReciboRelatorioEntregas {
        id: string;
        numero: string;
        dataEntrega: string;
        status: string;
        responsavelRecebimento: string;
        unidadeEducacional: {
          nome: string;
        };
        pedido: {
          contrato: {
            fornecedor: {
              nome: string;
            };
          };
        };
      }

      interface RelatorioEntregasData {
        recibos: ReciboRelatorioEntregas[];
        estatisticas: {
          totalEntregas: number;
          entregasConfirmadas: number;
          entregasPendentes: number;
          entregasAjustadas: number;
          valorTotalEntregue: number;
        };
      }

      // Busca os dados do relatório a partir da rota de dados existente
      const params = new URLSearchParams({
        dataInicio,
        dataFim,
        ...(unidadeId && unidadeId !== "all" && { unidadeId }),
      });

      const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

      console.log(
        "➡️ URL chamada para relatório:",
        `${backendUrl}/api/relatorios/entregas?${params}`
      );

      const reportDataResponse = await fetch(
        `${backendUrl}/api/relatorios/entregas?${params}`
      );
      if (!reportDataResponse.ok) {
        throw new Error("Falha ao buscar dados do relatório.");
      }
      const reportData: RelatorioEntregasData = await reportDataResponse.json();

      // NOVO: Renderiza o HTML para o PDF
      const recibosHtml = reportData.recibos
        .map(
          (recibo) => `
            <tr>
              <td>${recibo.numero}</td>
              <td>${recibo.unidadeEducacional.nome}</td>
              <td>${recibo.pedido.contrato.fornecedor.nome}</td>
              <td>${new Date(recibo.dataEntrega).toLocaleDateString(
                "pt-BR"
              )}</td>
              <td>${recibo.status}</td>
              <td>${recibo.responsavelRecebimento}</td>
            </tr>
          `
        )
        .join("");

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório de Entregas</title>
            <style>
                body { font-family: sans-serif; padding: 20px; }
                h1 { color: #333; }
                .section { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                h2 { margin-top: 0; }
            </style>
        </head>
        <body>
            <h1>Relatório de Entregas por Período</h1>
            <div class="section">
                <h2>Estatísticas</h2>
                <p>Total de Entregas: ${
                  reportData.estatisticas.totalEntregas
                }</p>
                <p>Confirmadas: ${
                  reportData.estatisticas.entregasConfirmadas
                }</p>
                <p>Pendentes: ${reportData.estatisticas.entregasPendentes}</p>
                <p>Ajustadas: ${reportData.estatisticas.entregasAjustadas}</p>
                <p>Valor Total Entregue: R$ ${reportData.estatisticas.valorTotalEntregue.toFixed(
                  2
                )}</p>
            </div>
            <div class="section">
                <h2>Detalhes das Entregas</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Recibo</th>
                            <th>Unidade</th>
                            <th>Fornecedor</th>
                            <th>Data Entrega</th>
                            <th>Status</th>
                            <th>Responsável</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recibosHtml}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `;

      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ format: "A4" });

      await browser.close();

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-entregas-${dataInicio}_${dataFim}.pdf"`,
        "Content-Length": pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Erro ao gerar PDF do relatório:", error);
      res
        .status(500)
        .json({ error: "Não foi possível gerar o relatório PDF." });
    }
  }
);

app.post(
  "/api/relatorios/conformidade-pdf",
  async (req: Request, res: Response) => {
    const { dataInicio, dataFim, unidadeId } = req.body;

    try {
      const browser = await puppeteer.launch({
        executablePath: process.env.CHROME_BIN || "/usr/bin/chromium-browser",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      // Busca os dados do relatório a partir da rota de dados existente
      const params = new URLSearchParams({
        dataInicio,
        dataFim,
        ...(unidadeId && unidadeId !== "all" && { unidadeId }),
      });

      const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
      if (!backendUrl) {
        throw new Error("Variável BACKEND_URL não definida no ambiente.");
      }
      const reportDataResponse = await fetch(
        `${backendUrl}/api/relatorios/conformidade?${params}`
      );
      if (!reportDataResponse.ok) {
        throw new Error("Falha ao buscar dados do relatório.");
      }
      const reportData = await reportDataResponse.json();

      interface ReciboConformidadeDetalhado {
        id: string;
        numero: string;
        dataEntrega: string;
        totalItens: number;
        itensConformes: number;
        percentualConformidade: number;
        unidadeEducacional: { nome: string };
        pedido: {
          contrato: {
            fornecedor: { nome: string };
          };
        };
      }

      interface RelatorioConformidadeData {
        analiseConformidade: ReciboConformidadeDetalhado[];
        estatisticas: {
          totalRecibos: number;
          mediaConformidade: number;
          recibosConformes: number;
          recibosParciais: number;
          recibosNaoConformes: number;
        };
      }

      const typedReportData: RelatorioConformidadeData = reportData;

      const analiseConformidadeHtml = typedReportData.analiseConformidade
        .map(
          (recibo) => `
        <tr>
          <td>${recibo.numero}</td>
          <td>${recibo.unidadeEducacional.nome}</td>
          <td>${recibo.pedido.contrato.fornecedor.nome}</td>
          <td>${new Date(recibo.dataEntrega).toLocaleDateString("pt-BR")}</td>
          <td>${recibo.itensConformes}/${recibo.totalItens}</td>
          <td>${recibo.percentualConformidade.toFixed(2)}%</td>
        </tr>
      `
        )
        .join("");

      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Relatório de Conformidade</title>
          <style>
              body { font-family: sans-serif; padding: 20px; }
              h1 { color: #333; }
              .section { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              h2 { margin-top: 0; }
          </style>
      </head>
      <body>
          <h1>Relatório de Conformidade das Entregas</h1>
          <div class="section">
              <h2>Estatísticas</h2>
              <p>Total de Recibos: ${
                typedReportData.estatisticas.totalRecibos
              }</p>
              <p>Média de Conformidade: ${typedReportData.estatisticas.mediaConformidade.toFixed(
                2
              )}%</p>
              <p>Recibos Totalmente Conformes: ${
                typedReportData.estatisticas.recibosConformes
              }</p>
              <p>Recibos Parcialmente Conformes: ${
                typedReportData.estatisticas.recibosParciais
              }</p>
              <p>Recibos Não Conformes: ${
                typedReportData.estatisticas.recibosNaoConformes
              }</p>
          </div>
          <div class="section">
              <h2>Análise Detalhada</h2>
              <table>
                  <thead>
                      <tr>
                          <th>Recibo</th>
                          <th>Unidade</th>
                          <th>Fornecedor</th>
                          <th>Data Entrega</th>
                          <th>Itens Conformes</th>
                          <th>% Conformidade</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${analiseConformidadeHtml}
                  </tbody>
              </table>
          </div>
      </body>
      </html>
    `;

      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ format: "A4" });

      await browser.close();

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-conformidade-${dataInicio}_${dataFim}.pdf"`,
        "Content-Length": pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Erro ao gerar PDF do relatório de conformidade:", error);
      res
        .status(500)
        .json({ error: "Não foi possível gerar o relatório PDF." });
    }
  }
);

app.post(
  "/api/relatorios/gastos-fornecedor-pdf",
  async (req: Request, res: Response) => {
    const { dataInicio, dataFim, fornecedorId } = req.body;

    try {
      const browser = await puppeteer.launch({
        executablePath: process.env.CHROME_BIN || "/usr/bin/chromium-browser",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      // Busca os dados do relatório a partir da rota de dados existente
      const params = new URLSearchParams({
        dataInicio,
        dataFim,
        ...(fornecedorId && fornecedorId !== "all" && { fornecedorId }),
      });

      const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

      const reportDataResponse = await fetch(
        `${backendUrl}/api/relatorios/gastos-fornecedor?${params}`
      );
      if (!reportDataResponse.ok) {
        throw new Error("Falha ao buscar dados do relatório.");
      }
      const reportData = await reportDataResponse.json();

      // Definição das interfaces para tipagem dos dados do relatório
      interface GastoFornecedor {
        fornecedorId: string;
        fornecedorNome: string;
        totalGasto: number;
        totalPedidos: number;
      }

      interface RelatorioGastosData {
        gastosPorFornecedor: GastoFornecedor[];
        estatisticas: {
          totalFornecedores: number;
          gastoTotal: number;
          pedidosTotal: number;
        };
      }

      const typedReportData: RelatorioGastosData = reportData;

      const rankingHtml = typedReportData.gastosPorFornecedor
        .map((fornecedor, index) => {
          const ticketMedio =
            fornecedor.totalPedidos > 0
              ? fornecedor.totalGasto / fornecedor.totalPedidos
              : 0;
          const percentualParticipacao =
            typedReportData.estatisticas.gastoTotal > 0
              ? (fornecedor.totalGasto /
                  typedReportData.estatisticas.gastoTotal) *
                100
              : 0;
          return `
            <tr>
                <td>#${index + 1}</td>
                <td>${fornecedor.fornecedorNome}</td>
                <td>R$ ${fornecedor.totalGasto.toFixed(2)}</td>
                <td>${fornecedor.totalPedidos}</td>
                <td>R$ ${ticketMedio.toFixed(2)}</td>
                <td>${percentualParticipacao.toFixed(1)}%</td>
            </tr>
        `;
        })
        .join("");

      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Relatório de Gastos por Fornecedor</title>
          <style>
              body { font-family: sans-serif; padding: 20px; }
              h1 { color: #333; }
              .section { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              h2 { margin-top: 0; }
          </style>
      </head>
      <body>
          <h1>Relatório de Gastos por Fornecedor</h1>
          <div class="section">
              <h2>Estatísticas</h2>
              <p>Gasto Total: R$ ${typedReportData.estatisticas.gastoTotal.toFixed(
                2
              )}</p>
              <p>Total de Fornecedores: ${
                typedReportData.estatisticas.totalFornecedores
              }</p>
              <p>Total de Pedidos: ${
                typedReportData.estatisticas.pedidosTotal
              }</p>
          </div>
          <div class="section">
              <h2>Ranking de Gastos</h2>
              <table>
                  <thead>
                      <tr>
                          <th>Posição</th>
                          <th>Fornecedor</th>
                          <th>Total Gasto</th>
                          <th>Total Pedidos</th>
                          <th>Ticket Médio</th>
                          <th>% do Total</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${rankingHtml}
                  </tbody>
              </table>
          </div>
      </body>
      </html>
    `;

      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ format: "A4" });

      await browser.close();

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-gastos-${dataInicio}_${dataFim}.pdf"`,
        "Content-Length": pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Erro ao gerar PDF do relatório de gastos:", error);
      res
        .status(500)
        .json({ error: "Não foi possível gerar o relatório PDF." });
    }
  }
);

app.post(
  "/api/relatorios/estoque-unidade-pdf",
  async (req: Request, res: Response) => {
    const { dataInicio, dataFim, unidadeId } = req.body;

    // CORREÇÃO: Mover as interfaces para o mesmo arquivo para evitar erros de tipagem
    interface EstoqueDetalhadoRelatorio {
      id: string;
      quantidadeAtual: number;
      quantidadeMinima: number;
      itemContrato: {
        nome: string;
        valorUnitario: number;
        unidadeMedida: { sigla: string };
        contrato: {
          numero: string;
          fornecedor: { nome: string };
        };
      };
      unidadeEducacional: { nome: string };
    }

    interface MovimentacaoEstoqueDetalhadaRelatorio {
      id: string;
      dataMovimentacao: string;
      tipo: string;
      quantidade: number;
      responsavel: string;
      motivo: string;
      estoque: {
        itemContrato: {
          nome: string;
          unidadeMedida: { sigla: string };
        };
        unidadeEducacional: { nome: string };
      };
    }

    interface RelatorioEstoqueData {
      estoque: EstoqueDetalhadoRelatorio[];
      movimentacoes: MovimentacaoEstoqueDetalhadaRelatorio[];
      estatisticas: {
        totalItens: number;
        itensComEstoque: number;
        itensAbaixoMinimo: number;
        valorTotalEstoque: number;
        totalEntradas: number;
        totalSaidas: number;
      };
    }

    try {
      const browser = await puppeteer.launch({
        executablePath: process.env.CHROME_BIN || "/usr/bin/chromium-browser",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      const params = new URLSearchParams({
        dataInicio,
        dataFim,
        ...(unidadeId && unidadeId !== "all" && { unidadeId }),
      });
      const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

      const reportDataResponse = await fetch(
        `${backendUrl}/api/relatorios/estoque-unidade?${params}`
      );
      if (!reportDataResponse.ok) {
        throw new Error("Falha ao buscar dados do relatório.");
      }
      const reportData = await reportDataResponse.json();

      const typedReportData: RelatorioEstoqueData = reportData;

      const estoqueHtml = typedReportData.estoque
        .map(
          (item) => `
        <tr>
            <td>${item.itemContrato.nome}</td>
            <td>${item.unidadeEducacional.nome}</td>
            <td>${item.itemContrato.contrato.fornecedor.nome}</td>
            <td>${item.quantidadeAtual} ${
            item.itemContrato.unidadeMedida.sigla
          }</td>
            <td>${item.quantidadeMinima} ${
            item.itemContrato.unidadeMedida.sigla
          }</td>
            <td>R$ ${(
              item.quantidadeAtual * item.itemContrato.valorUnitario
            ).toFixed(2)}</td>
        </tr>
    `
        )
        .join("");

      const movimentacoesHtml = typedReportData.movimentacoes
        .map(
          (mov) => `
        <tr>
            <td>${new Date(mov.dataMovimentacao).toLocaleDateString(
              "pt-BR"
            )}</td>
            <td>${mov.tipo}</td>
            <td>${mov.estoque.itemContrato.nome}</td>
            <td>${mov.estoque.unidadeEducacional.nome}</td>
            <td>${mov.quantidade} ${
            mov.estoque.itemContrato.unidadeMedida.sigla
          }</td>
            <td>${mov.responsavel}</td>
            <td>${mov.motivo}</td>
        </tr>
    `
        )
        .join("");

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório de Estoque</title>
            <style>
                body { font-family: sans-serif; padding: 20px; }
                h1 { color: #333; }
                .section { margin-bottom: 20px; border: 1px solid #ccc; padding: 10px; border-radius: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                h2 { margin-top: 0; }
            </style>
        </head>
        <body>
            <h1>Relatório de Estoque por Unidade</h1>
            <div class="section">
                <h2>Estatísticas Gerais</h2>
                <p>Total de Itens em Estoque: ${
                  typedReportData.estatisticas.totalItens
                }</p>
                <p>Itens Abaixo do Mínimo: ${
                  typedReportData.estatisticas.itensAbaixoMinimo
                }</p>
                <p>Valor Total do Estoque: R$ ${typedReportData.estatisticas.valorTotalEstoque.toFixed(
                  2
                )}</p>
                <p>Total de Entradas: ${
                  typedReportData.estatisticas.totalEntradas
                }</p>
                <p>Total de Saídas: ${
                  typedReportData.estatisticas.totalSaidas
                }</p>
            </div>

            <div class="section" style="page-break-inside: avoid;">
                <h2>Estoque Atual</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Unidade</th>
                            <th>Fornecedor</th>
                            <th>Quantidade</th>
                            <th>Mínimo</th>
                            <th>Valor Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${estoqueHtml}
                    </tbody>
                </table>
            </div>

            <div class="section" style="page-break-inside: avoid;">
                <h2>Histórico de Movimentações</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Tipo</th>
                            <th>Item</th>
                            <th>Unidade</th>
                            <th>Quantidade</th>
                            <th>Responsável</th>
                            <th>Motivo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${movimentacoesHtml}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `;

      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ format: "A4" });

      await browser.close();

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-estoque-${dataInicio}_${dataFim}.pdf"`,
        "Content-Length": pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Erro ao gerar PDF do relatório de estoque:", error);
      res
        .status(500)
        .json({ error: "Não foi possível gerar o relatório PDF." });
    }
  }
);

app.post(
  "/api/relatorios/movimentacao-responsavel-pdf",
  async (req: Request, res: Response) => {
    const { dataInicio, dataFim, responsavel, unidadeId, tipoMovimentacao } =
      req.body;

    try {
      const browser = await puppeteer.launch({
        executablePath: process.env.CHROME_BIN || "/usr/bin/chromium-browser",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      interface MovimentacaoEstoqueRelatorioPDF {
        id: string;
        dataMovimentacao: string;
        tipo: string;
        quantidade: number;
        quantidadeAnterior: number;
        quantidadeNova: number;
        motivo: string;
        responsavel: string;
        estoque: {
          itemContrato: {
            nome: string;
            unidadeMedida: { sigla: string };
          };
          unidadeEducacional: { nome: string };
        };
        unidadeDestino?: { nome: string } | null;
        fotoDescarte?: { url: string } | null;
      }

      interface RelatorioMovimentacaoDataPDF {
        movimentacoes: MovimentacaoEstoqueRelatorioPDF[];
        estatisticas: {
          totalMovimentacoes: number;
          totalEntradas: number;
          totalSaidas: number;
          totalAjustes: number;
          totalDescartes: number;
          totalRemanejamentos: number;
          contaEntradas: number;
          contaSaidas: number;
          contaDescartes: number;
          contaRemanejamentos: number;
          contaAjustes: number;
        };
      }

      const params = new URLSearchParams({
        dataInicio,
        dataFim,
        ...(responsavel && responsavel !== "all" && { responsavel }),
        ...(unidadeId && unidadeId !== "all" && { unidadeId }),
        ...(tipoMovimentacao &&
          tipoMovimentacao !== "all" && { tipoMovimentacao }),
      });

      const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
      const reportDataResponse = await fetch(
        `${backendUrl}/api/relatorios/movimentacao-responsavel?${params}`
      );
      if (!reportDataResponse.ok) {
        throw new Error("Falha ao buscar dados do relatório.");
      }
      const reportData: RelatorioMovimentacaoDataPDF =
        await reportDataResponse.json();

      const movimentacoesHtml = reportData.movimentacoes
        .map((mov) => {
          const unidadeInfo =
            mov.tipo === "remanejamento" && mov.unidadeDestino
              ? `Remanejado para: ${mov.unidadeDestino.nome}`
              : `Origem: ${mov.estoque.unidadeEducacional.nome}`;

          const quantidadeSinal =
            mov.tipo === "saida" ||
            mov.tipo === "remanejamento" ||
            mov.tipo === "descarte"
              ? "-"
              : "+";
          const fotoHtml = mov.fotoDescarte?.url
            ? `<a href="${mov.fotoDescarte.url}" target="_blank">Ver Foto</a>`
            : "-";

          return `
            <tr>
                <td>${new Date(mov.dataMovimentacao).toLocaleDateString(
                  "pt-BR"
                )}</td>
                <td>${mov.tipo}</td>
                <td>${mov.estoque.itemContrato.nome}</td>
                <td>${unidadeInfo}</td>
                <td>${quantidadeSinal}${mov.quantidade} ${
            mov.estoque.itemContrato.unidadeMedida.sigla
          }</td>
                <td>${mov.quantidadeAnterior} ${
            mov.estoque.itemContrato.unidadeMedida.sigla
          }</td>
                <td>${mov.quantidadeNova} ${
            mov.estoque.itemContrato.unidadeMedida.sigla
          }</td>
                <td>${mov.responsavel}</td>
                <td>${mov.motivo}</td>
                <td>${fotoHtml}</td>
            </tr>
        `;
        })
        .join("");

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório de Movimentação por Responsável</title>
            <style>
                body { font-family: sans-serif; padding: 20px; }
                h1 { color: #333; }
                .section { margin-bottom: 20px; border: 1px solid #ccc; padding: 10px; border-radius: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                h2 { margin-top: 0; }
            </style>
        </head>
        <body>
            <h1>Relatório de Movimentação por Responsável</h1>
            <div class="section">
                <h2>Estatísticas Gerais</h2>
                <p>Total de Movimentações: ${reportData.estatisticas.totalMovimentacoes}</p>
                <p>Total de Entradas: ${reportData.estatisticas.contaEntradas}</p>
                <p>Total de Saídas: ${reportData.estatisticas.contaSaidas}</p>
                <p>Total de Descartes: ${reportData.estatisticas.contaDescartes}</p>
                <p>Total de Remanejamentos: ${reportData.estatisticas.contaRemanejamentos}</p>
            </div>
            <div class="section">
                <h2>Detalhes das Movimentações</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Tipo</th>
                            <th>Item</th>
                            <th>Unidade</th>
                            <th>Quantidade</th>
                            <th>Saldo Anterior</th>
                            <th>Saldo Novo</th>
                            <th>Responsável</th>
                            <th>Motivo</th>
                            <th>Foto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${movimentacoesHtml}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `;

      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ format: "A4" });

      await browser.close();

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-movimentacao-${dataInicio}_${dataFim}.pdf"`,
        "Content-Length": pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Erro ao gerar PDF do relatório de movimentação:", error);
      res
        .status(500)
        .json({ error: "Não foi possível gerar o relatório PDF." });
    }
  }
);

/// --- FIM ROTA DE PDFs --- ///
// Rota de teste
app.get("/api/test-db", async (req: Request, res: Response) => {
  try {
    const result: unknown = await prisma.$queryRaw`SELECT NOW()`;

    if (
      Array.isArray(result) &&
      result.length > 0 &&
      result[0] &&
      "now" in result[0]
    ) {
      const currentTime = (result[0] as { now: Date }).now;
      res.json({ status: "sucesso", horario_do_banco: currentTime });
    } else {
      throw new Error(
        "Formato de resultado inesperado da consulta ao banco de dados."
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    res.status(500).json({
      status: "erro",
      message: "Falha ao comunicar com o banco.",
      detalhes: errorMessage,
    });
  }
});

const server = app.listen(3001, () =>
  console.log(
    `🚀 Servidor pronto em: ${
      process.env.FRONTEND_URL || "http://localhost:8080"
    } e ${process.env.BACKEND_URL || "http://localhost:3001"}`
  )
);

// Garante que a conexão com o banco é fechada ao encerrar o processo
process.on("SIGTERM", () => {
  server.close(() => {
    prisma.$disconnect();
  });
});

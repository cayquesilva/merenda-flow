import express, { Request, Response, NextFunction  } from "express";
import cors from "cors";
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());


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
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Token de acesso requerido" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
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
      where: { email }
    });

    if (!usuario || !usuario.ativo) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      { userId: usuario.id, email: usuario.email, categoria: usuario.categoria },
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
        createdAt: usuario.createdAt
      }
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Verificar token
app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        nome: true,
        email: true,
        categoria: true,
        ativo: true,
        createdAt: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json(usuario);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// --- ROTAS DE USUÁRIOS ---

// Listar usuários
app.get("/api/usuarios", authenticateToken, async (req: Request, res: Response) => {
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
        createdAt: true
      },
      orderBy: { nome: "asc" },
    });
    res.json(usuarios);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ error: "Não foi possível buscar os usuários." });
  }
});

// Buscar usuário por ID
app.get("/api/usuarios/:id", authenticateToken, async (req: Request, res: Response) => {
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
        createdAt: true
      }
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
});

// Criar usuário
app.post("/api/usuarios", authenticateToken, async (req: Request, res: Response) => {
  const { nome, email, senha, categoria, ativo } = req.body;
  
  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    
    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        categoria,
        ativo: ativo ?? true
      },
      select: {
        id: true,
        nome: true,
        email: true,
        categoria: true,
        ativo: true,
        createdAt: true
      }
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
});

// Atualizar usuário
app.put("/api/usuarios/:id", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, email, senha, categoria, ativo } = req.body;
  
  try {
    const dadosAtualizacao: DadosAtualizacaoUsuario  = { nome, email, categoria, ativo };
    
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
        createdAt: true
      }
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
});

// Deletar usuário
app.delete("/api/usuarios/:id", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.usuario.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    res.status(500).json({ error: "Não foi possível deletar o usuário." });
  }
});

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

// COMENTÁRIO: Cria um novo contrato e os seus itens.
app.post("/api/contratos", async (req: Request, res: Response) => {
  const { itens, ...dadosContrato } = req.body;
  try {
    const novoContrato = await prisma.contrato.create({
      data: { ...dadosContrato, itens: { create: itens } },
    });
    res.status(201).json(novoContrato);
  } catch (error) {
    // ALTERAÇÃO: Removido ': any'
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
  const { nome, codigo, email, telefone, endereco, ativo } = req.body;
  try {
    const novaUnidade = await prisma.unidadeEducacional.create({
      data: { nome, codigo, email, telefone, endereco, ativo },
    });
    res.status(201).json(novaUnidade);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Código 'P2002' indica uma violação de constraint única (ex: email ou código duplicado).
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
  const { nome, codigo, email, telefone, endereco, ativo } = req.body;
  try {
    const unidadeAtualizada = await prisma.unidadeEducacional.update({
      where: { id },
      data: { nome, codigo, email, telefone, endereco, ativo },
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
    // Usa uma transação para garantir que todas as operações (criar pedido, criar itens, atualizar saldos)
    // sejam bem-sucedidas ou nenhuma delas seja aplicada.
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar o registo principal do Pedido.
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

      // 2. Iterar sobre os itens enviados pelo frontend.
      for (const item of itens) {
        // 2a. Criar o registo do ItemPedido, ligando-o ao pedido principal.
        await tx.itemPedido.create({
          data: {
            pedidoId: novoPedido.id,
            itemContratoId: item.itemContratoId,
            unidadeEducacionalId: item.unidadeEducacionalId,
            quantidade: item.quantidade,
          },
        });

        // 2b. Atualizar (decrementar) o saldo do item correspondente no contrato.
        await tx.itemContrato.update({
          where: { id: item.itemContratoId },
          data: {
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
      where: { status: "confirmado" },
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
      },
    });
    if (!recibo)
      return res.status(404).json({ error: "Recibo não encontrado." });
    res.json(recibo);
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
  const { pedidoId, responsavelEntrega, dataEntrega } = req.body;

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
            responsavelEntrega,
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
    if (recibo.status !== "pendente") {
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
    const { id } = req.params;
    const {
      responsavel,
      observacoes,
      itensConfirmacao,
      assinaturaDigital,
      fotoReciboAssinado,
    } = req.body;

    if (!Array.isArray(itensConfirmacao)) {
      return res
        .status(400)
        .json({ error: "itensConfirmacao deve ser um array" });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        let todosConformes = true;
        let algumRecebido = false;

        const recibo = await tx.recibo.findUnique({
          where: { id },
          select: { unidadeEducacionalId: true },
        });

        if (!recibo) {
          throw new Error("Recibo não encontrado");
        }

        // Loop para atualizar os itens do recibo
        for (const item of itensConfirmacao) {
          const itemRecibo = await tx.itemRecibo.update({
            where: { id: item.itemId },
            data: {
              conforme: item.conforme,
              quantidadeRecebida: Number(item.quantidadeRecebida),
              observacoes: item.observacoes,
            },
            include: { itemPedido: true },
          });

          if (!item.conforme) todosConformes = false;
          if (Number(item.quantidadeRecebida) > 0) algumRecebido = true;

          const diferenca =
            itemRecibo.itemPedido.quantidade - Number(item.quantidadeRecebida);

          if (diferenca > 0) {
            await tx.itemContrato.update({
              where: { id: itemRecibo.itemPedido.itemContratoId },
              data: {
                saldoAtual: {
                  increment: diferenca,
                },
              },
            });
          }

          // Controle de estoque e movimentação
          if (Number(item.quantidadeRecebida) > 0) {
            const quantidadeRecebida = Number(item.quantidadeRecebida);

            const estoqueExistente = await tx.estoque.findUnique({
              where: {
                unidadeEducacionalId_itemContratoId: {
                  unidadeEducacionalId: recibo.unidadeEducacionalId,
                  itemContratoId: itemRecibo.itemPedido.itemContratoId,
                },
              },
            });

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
                  unidadeEducacionalId: recibo.unidadeEducacionalId,
                  itemContratoId: itemRecibo.itemPedido.itemContratoId,
                  quantidadeAtual: quantidadeRecebida,
                  quantidadeMinima: 0,
                  ultimaAtualizacao: new Date(),
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
                motivo: `Recebimento confirmado - Recibo ${id}`,
                reciboId: id,
                responsavel,
                dataMovimentacao: new Date(),
              },
            });
          }
        }

        // Define status final do recibo
        let statusFinal = "rejeitado";
        if (algumRecebido) {
          statusFinal = todosConformes ? "confirmado" : "parcial";
        }

        // Atualiza o recibo com informações e imagens
        const reciboAtualizado = await tx.recibo.update({
          where: { id },
          data: {
            responsavelRecebimento: responsavel,
            observacoes,
            status: statusFinal,

            // Assinatura digital: cria, atualiza ou desconecta
            assinaturaDigital: assinaturaDigital
              ? {
                  upsert: {
                    create: { imagemBase64: assinaturaDigital },
                    update: { imagemBase64: assinaturaDigital },
                  },
                }
              : { disconnect: true },

            // Foto do recibo assinado: cria, atualiza ou desconecta
            fotoReciboAssinado: fotoReciboAssinado
              ? {
                  upsert: {
                    create: { url: fotoReciboAssinado },
                    update: { url: fotoReciboAssinado },
                  },
                }
              : { disconnect: true },
          },
        });

        return reciboAtualizado;
      });

      res.status(200).json({
        message: "Recebimento confirmado com sucesso!",
        recibo: result,
      });
    } catch (error) {
      console.error("Erro ao confirmar recebimento:", error);
      res.status(500).json({
        error: "Não foi possível processar a confirmação.",
        detalhe: error instanceof Error ? error.message : "Erro desconhecido.",
      });
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
          select: { status: true },
        },
      },
      orderBy: { dataPedido: "desc" },
    });

    const consolidacoes = pedidos.map((pedido) => {
      const totalRecibos = pedido.recibos.length;
      const recibosConfirmados = pedido.recibos.filter(
        (r) => r.status === "confirmado" || r.status === "parcial"
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
  const { q, unidadeId } = req.query;

  try {
    const estoque = await prisma.estoque.findMany({
      where: {
        ...(unidadeId ? { unidadeEducacionalId: unidadeId as string } : {}),
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
  const { estoqueId, unidadeId, dataInicio, dataFim } = req.query;

  try {
    const whereClause: Prisma.MovimentacaoEstoqueWhereInput = {};

    if (estoqueId) {
      whereClause.estoqueId = estoqueId as string;
    }

    if (unidadeId) {
      whereClause.estoque = {
        unidadeEducacionalId: unidadeId as string,
      };
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
              include: {
                unidadeMedida: true,
              },
            },
            unidadeEducacional: { select: { nome: true, codigo: true } },
          },
        },
        recibo: { select: { numero: true } },
      },
      orderBy: { dataMovimentacao: "desc" },
      take: 100, // Limitar para performance
    });

    res.json(movimentacoes);
  } catch (error) {
    console.error("Erro ao buscar movimentações:", error);
    res
      .status(500)
      .json({ error: "Não foi possível buscar as movimentações." });
  }
});

// COMENTÁRIO: Registra uma movimentação manual de estoque (saída, ajuste)
app.post("/api/estoque/movimentacao", async (req: Request, res: Response) => {
  const { estoqueId, tipo, quantidade, motivo, responsavel } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Buscar o estoque atual
      const estoque = await tx.estoque.findUnique({
        where: { id: estoqueId },
      });

      if (!estoque) {
        throw new Error("Estoque não encontrado");
      }

      const quantidadeAnterior = estoque.quantidadeAtual;
      let quantidadeNova = quantidadeAnterior;

      // Calcular nova quantidade baseada no tipo de movimentação
      switch (tipo) {
        case "saida":
          quantidadeNova = quantidadeAnterior - Number(quantidade);
          if (quantidadeNova < 0) {
            throw new Error("Quantidade insuficiente em estoque");
          }
          break;
        case "entrada":
          quantidadeNova = quantidadeAnterior + Number(quantidade);
          break;
        case "ajuste":
          quantidadeNova = Number(quantidade);
          break;
        default:
          throw new Error("Tipo de movimentação inválido");
      }

      // Atualizar o estoque
      const estoqueAtualizado = await tx.estoque.update({
        where: { id: estoqueId },
        data: {
          quantidadeAtual: quantidadeNova,
          ultimaAtualizacao: new Date(),
        },
      });

      // Registrar a movimentação
      const movimentacao = await tx.movimentacaoEstoque.create({
        data: {
          estoqueId,
          tipo,
          quantidade: Math.abs(Number(quantidade)),
          quantidadeAnterior,
          quantidadeNova,
          motivo,
          responsavel,
          dataMovimentacao: new Date(),
        },
      });

      return { estoque: estoqueAtualizado, movimentacao };
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

// COMENTÁRIO: NOVA ROTA: Processa a saída de estoque via QR Code
app.post(
  "/api/estoque/saida-qrcode/:estoqueId",
  async (req: Request, res: Response) => {
    const { estoqueId } = req.params;
    const { quantidade } = req.body; // Agora espera a quantidade no corpo da requisição
    const quantidadeSaida = Number(quantidade); // Converte para número
    const motivo = "Consumo diário (QR Code)";
    const responsavel = "Merendeira (QR Code)"; // Pode ser dinâmico no futuro

    if (isNaN(quantidadeSaida) || quantidadeSaida <= 0) {
      // Validação da quantidade
      return res.status(400).json({ error: "Quantidade de saída inválida." });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const estoque = await tx.estoque.findUnique({
          where: { id: estoqueId },
        });

        if (!estoque) {
          return res
            .status(404)
            .json({ error: "Item de estoque não encontrado." });
        }

        const quantidadeAnterior = estoque.quantidadeAtual;
        const quantidadeNova = quantidadeAnterior - quantidadeSaida;

        if (quantidadeNova < 0) {
          throw new Error("Quantidade insuficiente em estoque para a saída.");
        }

        // Atualizar o estoque
        const estoqueAtualizado = await tx.estoque.update({
          where: { id: estoqueId },
          data: {
            quantidadeAtual: quantidadeNova,
            ultimaAtualizacao: new Date(),
          },
        });

        // Registrar a movimentação
        const movimentacao = await tx.movimentacaoEstoque.create({
          data: {
            estoqueId,
            tipo: "saida",
            quantidade: quantidadeSaida, // Usa a quantidade recebida
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
    const { responsavel, dataInicio, dataFim } = req.query;

    try {
      const whereClause: Prisma.MovimentacaoEstoqueWhereInput = {};

      if (responsavel && responsavel !== "all") {
        whereClause.responsavel = responsavel as string;
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
        },
        orderBy: { dataMovimentacao: "desc" },
      });

      // Calcular estatísticas
      const totalMovimentacoes = movimentacoes.length;
      const totalEntradas = movimentacoes
        .filter((m) => m.tipo === "entrada")
        .reduce((sum, m) => sum + m.quantidade, 0);
      const totalSaidas = movimentacoes
        .filter((m) => m.tipo === "saida")
        .reduce((sum, m) => sum + m.quantidade, 0);
      const totalAjustes = movimentacoes
        .filter((m) => m.tipo === "ajuste")
        .reduce((sum, m) => sum + m.quantidade, 0);

      res.json({
        movimentacoes,
        estatisticas: {
          totalMovimentacoes,
          totalEntradas,
          totalSaidas,
          totalAjustes,
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
    const { unidadeId, dataInicio, dataFim } = req.query;

    try {
      const whereClause: Prisma.EstoqueWhereInput = {};

      if (unidadeId) {
        whereClause.unidadeEducacionalId = unidadeId as string;
      }

      // Buscar estoque atual
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
      });

      // Buscar movimentações no período
      const movimentacoesWhere: Prisma.MovimentacaoEstoqueWhereInput = {};

      if (unidadeId) {
        movimentacoesWhere.estoque = {
          unidadeEducacionalId: unidadeId as string,
        };
      }

      if (dataInicio && dataFim) {
        movimentacoesWhere.dataMovimentacao = {
          gte: new Date(dataInicio as string),
          lte: new Date(dataFim as string),
        };
      }

      const movimentacoes = await prisma.movimentacaoEstoque.findMany({
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
      });

      // Calcular estatísticas
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
      const totalEntradas = entradas.reduce((sum, m) => sum + m.quantidade, 0);
      const totalSaidas = saidas.reduce((sum, m) => sum + m.quantidade, 0);

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
          itens: { include: { unidadeMedida: true } }, // Inclui unidadeMedida para o cálculo
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
        },
      });

      // Consolidação dos dados (movida do frontend para o backend)
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
        pedidos, // Inclui os pedidos para a tabela de histórico
        totalPedidos: pedidos.length,
        valorTotalPedidos: pedidos.reduce((sum, p) => sum + p.valorTotal, 0),
        unidadesAtendidas,
        pedidosPorStatus,
        itensPorContrato, // Dados consolidados por item
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
    // Tipagem explícita para o objeto whereClause
    const whereClause: Prisma.ReciboWhereInput = {};

    if (dataInicio && dataFim) {
      whereClause.dataEntrega = {
        gte: new Date(dataInicio as string),
        lte: new Date(dataFim as string),
      };
    }

    if (unidadeId) {
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
      valorTotalEntregue: recibos.reduce((sum, r) => {
        return (
          sum +
          r.itens.reduce((itemSum, item) => {
            // Garantir que quantidadeRecebida e valorUnitario não sejam undefined
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
  const { dataInicio, dataFim } = req.query;

  try {
    // Tipagem explícita para o objeto whereClause
    const whereClause: Prisma.ReciboWhereInput = {};

    if (dataInicio && dataFim) {
      whereClause.dataEntrega = {
        gte: new Date(dataInicio as string),
        lte: new Date(dataFim as string),
      };
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

// Interface para o objeto de gastos por fornecedor
interface GastoFornecedor {
  fornecedorId: string;
  fornecedorNome: string;
  totalGasto: number;
  totalPedidos: number;
}

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
  console.log(`🚀 Servidor pronto em: api.seudominio:3001 e seudominio:8080`)
);

// Garante que a conexão com o banco é fechada ao encerrar o processo
process.on("SIGTERM", () => {
  server.close(() => {
    prisma.$disconnect();
  });
});

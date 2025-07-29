import express, { Request, Response } from "express";
import cors from "cors";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

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
      orderBy: { numero: 'asc' },
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
      orderBy: { nome: 'asc' },
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
        const pendingCount = await prisma.pedido.count({ where: { status: 'pendente' } });
        const deliveredCount = await prisma.pedido.count({ where: { status: 'entregue' } });
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
          status && status !== 'todos' ? { status: status as string } : {},
          q ? {
            OR: [
              { numero: { contains: q as string, mode: "insensitive" } },
              { contrato: { fornecedor: { nome: { contains: q as string, mode: "insensitive" } } } },
            ],
          } : {},
        ],
      },
      include: {
        contrato: { select: { fornecedor: { select: { nome: true } } } },
        _count: { select: { itens: true } },
      },
      orderBy: { dataPedido: 'desc' },
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
                    orderBy: { itemContrato: { nome: 'asc' } },
                },
            },
        });
        if (!pedido) return res.status(404).json({ error: "Pedido não encontrado." });
        res.json(pedido);
    } catch (error) {
        console.error("Erro ao buscar detalhes do pedido:", error);
        res.status(500).json({ error: "Não foi possível buscar os detalhes do pedido." });
    }
});

// COMENTÁRIO: Cria um novo pedido e atualiza os saldos dos itens do contrato.
// UTILIZAÇÃO: Chamada pelo `NovoPedidoDialog.tsx` ao submeter o formulário.
app.post("/api/pedidos", async (req: Request, res: Response) => {
  const { contratoId, dataEntregaPrevista, valorTotal, itens } = req.body;
  
  // Gera um número de pedido único.
  const numeroPedido = `PD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

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
          status: 'pendente',
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
          in: ['confirmado', 'pendente']
        }
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
      orderBy: { dataPedido: 'desc' },
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
        const pendingCount = await prisma.recibo.count({ where: { status: 'pendente' } });
        const confirmedCount = await prisma.recibo.count({ where: { status: 'confirmado' } });
        const partialCount = await prisma.recibo.count({ where: { status: 'parcial' } });

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
          status && status !== 'todos' ? { status: status as string } : {},
          q ? {
            OR: [
              { numero: { contains: q as string, mode: "insensitive" } },
              { pedido: { numero: { contains: q as string, mode: "insensitive" } } },
              { pedido: { contrato: { fornecedor: { nome: { contains: q as string, mode: "insensitive" } } } } },
            ],
          } : {},
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
      orderBy: { dataEntrega: 'desc' },
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
                            }
                        }
                    },
                },
            },
        });
        if (!recibo) return res.status(404).json({ error: "Recibo não encontrado." });
        res.json(recibo);
    } catch (error) {
        console.error("Erro ao buscar detalhes do recibo:", error);
        res.status(500).json({ error: "Não foi possível buscar os detalhes do recibo." });
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
      if (pedido.status === 'entregue' || pedido.status === 'cancelado') {
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
        const numeroRecibo = `RB-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}-${unidadeId.slice(0, 4)}`;
        const urlConfirmacao = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/confirmacao-recebimento/${numeroRecibo}`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlConfirmacao)}`;

        const novoRecibo = await tx.recibo.create({
          data: {
            numero: numeroRecibo,
            pedidoId: pedido.id,
            unidadeEducacionalId: unidadeId,
            dataEntrega: new Date(dataEntrega),
            responsavelEntrega,
            status: 'pendente',
            qrcode: qrCodeUrl,
            itens: {
              create: itensDaUnidade.map(itemPedido => ({
                itemPedidoId: itemPedido.id,
                quantidadeSolicitada: itemPedido.quantidade,
                quantidadeRecebida: 0, // Inicia como 0
                conforme: false,
              })),
            },
          },
        });
        recibosCriados.push(novoRecibo);
      }

      // 4. Atualizar o status do pedido para 'entregue'.
      await tx.pedido.update({
        where: { id: pedidoId },
        data: { status: 'entregue' },
      });

      return recibosCriados;
    });

    res.status(201).json({ message: `${result.length} recibo(s) gerado(s) com sucesso.` });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    console.error("Erro ao gerar recibo:", error);
    res.status(500).json({ error: `Não foi possível gerar o recibo: ${errorMessage}` });
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
  console.log(`🚀 Servidor pronto em: http://localhost:3001`)
);

// Garante que a conexão com o banco é fechada ao encerrar o processo
process.on("SIGTERM", () => {
  server.close(() => {
    prisma.$disconnect();
  });
});

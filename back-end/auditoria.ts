import { Express, NextFunction, Request, RequestHandler, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import xlsx from "xlsx";

// ===================================================================
// Auditoria de entradas e saídas de estoque (somente administrador).
// Une o estoque das unidades (MovimentacaoEstoque) e o do almoxarifado
// central (MovimentacaoEstoqueCentral) em uma única linha do tempo, com
// quem registrou, por qual canal (tela, voz/IA, recibo, QR Code...) e,
// quando houve, o administrador que acessou "como" aquele usuário.
// ===================================================================

const FUSO = "America/Fortaleza"; // UTC-3, sem horário de verão
const LIMITE_EXPORTACAO = 20000;
const PREFIXO_MOTIVO_VOZ = "Registro por assistente de voz";

type Req = Request & { userId?: string; impersonatedBy?: string };

// Dados de auditoria a gravar em cada movimentação criada por uma requisição autenticada.
export function auditoriaDoRequest(req: object) {
  const r = req as { userId?: string; impersonatedBy?: string };
  return { usuarioId: r.userId ?? null, impersonadoPorId: r.impersonatedBy ?? null };
}

// "2025-10-20" -> início/fim do dia no horário de Brasília (o servidor roda em UTC).
export function intervaloDatas(inicio?: unknown, fim?: unknown): { gte?: Date; lte?: Date } {
  const intervalo: { gte?: Date; lte?: Date } = {};
  const ehData = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
  if (ehData(inicio)) intervalo.gte = new Date(`${inicio}T00:00:00-03:00`);
  if (ehData(fim)) intervalo.lte = new Date(`${fim}T23:59:59.999-03:00`);
  return intervalo;
}

export const ORIGENS: Record<string, string> = {
  assistente_voz: "Assistente de voz (IA)",
  manual: "Manual (tela)",
  recibo: "Recibo de entrega",
  qrcode: "Saída por QR Code",
  almoxarifado: "Almoxarifado central",
};

interface Filtros {
  inicio?: string;
  fim?: string;
  tipo?: string;
  origem?: string;
  unidadeId?: string;
  busca?: string;
}

export interface LinhaAuditoria {
  id: string;
  data: string;
  escopo: "unidade" | "central";
  origem: string;
  origemRotulo: string;
  tipo: string;
  item: string;
  medida: string;
  quantidade: number;
  saldoAnterior: number;
  saldoNovo: number;
  local: string;
  destino: string | null;
  responsavel: string;
  usuario: string | null;
  impersonadoPor: string | null;
  motivo: string;
  transcricao: string | null;
  documento: string | null;
}

const texto = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 100) : undefined);

function lerFiltros(q: Request["query"]): Filtros {
  return {
    inicio: texto(q.inicio),
    fim: texto(q.fim),
    tipo: texto(q.tipo),
    origem: texto(q.origem),
    unidadeId: texto(q.unidadeId),
    busca: texto(q.busca),
  };
}

// ---------- filtros -> Prisma ----------

function whereUnidade(f: Filtros): Prisma.MovimentacaoEstoqueWhereInput | null {
  if (f.origem === "almoxarifado") return null; // só existe no estoque central

  const periodo = intervaloDatas(f.inicio, f.fim);
  const e: Prisma.MovimentacaoEstoqueWhereInput[] = [];

  if (periodo.gte || periodo.lte) e.push({ dataMovimentacao: periodo });
  if (f.tipo) e.push({ tipo: f.tipo });
  if (f.unidadeId) e.push({ estoque: { unidadeEducacionalId: f.unidadeId } });

  // Registros antigos não têm "origem": ela é deduzida pelo recibo ou pelo texto do motivo.
  const ehVozLegado = { origem: null, motivo: { startsWith: PREFIXO_MOTIVO_VOZ } };
  if (f.origem === "assistente_voz") e.push({ OR: [{ origem: "assistente_voz" }, ehVozLegado] });
  else if (f.origem === "recibo") e.push({ OR: [{ origem: "recibo" }, { origem: null, reciboId: { not: null } }] });
  else if (f.origem === "qrcode") e.push({ origem: "qrcode" });
  else if (f.origem === "manual") {
    e.push({
      OR: [
        { origem: "manual" },
        { origem: null, reciboId: null, NOT: { motivo: { startsWith: PREFIXO_MOTIVO_VOZ } } },
      ],
    });
  }

  if (f.busca) {
    const c = { contains: f.busca, mode: "insensitive" as const };
    e.push({
      OR: [
        { responsavel: c },
        { motivo: c },
        { transcricao: c },
        { estoque: { itemContrato: { nome: c } } },
        { estoque: { unidadeEducacional: { nome: c } } },
      ],
    });
  }
  return { AND: e };
}

function whereCentral(f: Filtros): Prisma.MovimentacaoEstoqueCentralWhereInput | null {
  // Só entra quando não se pede outra origem nem um tipo que só existe nas unidades.
  if (f.origem && f.origem !== "almoxarifado") return null;
  if (f.tipo && !["entrada", "saida"].includes(f.tipo)) return null;

  const periodo = intervaloDatas(f.inicio, f.fim);
  const e: Prisma.MovimentacaoEstoqueCentralWhereInput[] = [];

  if (periodo.gte || periodo.lte) e.push({ dataMovimentacao: periodo });
  if (f.tipo) e.push({ tipo: f.tipo === "saida" ? "saida_para_unidade" : "entrada" });
  if (f.unidadeId) e.push({ guiaDeRemessa: { unidadeEducacionalId: f.unidadeId } });
  if (f.busca) {
    const c = { contains: f.busca, mode: "insensitive" as const };
    e.push({ OR: [{ responsavel: c }, { motivo: c }, { estoque: { insumo: { nome: c } } }] });
  }
  return { AND: e };
}

// ---------- consulta ----------

const incluiUnidade = {
  estoque: {
    include: {
      itemContrato: { select: { nome: true, unidadeMedida: { select: { sigla: true } } } },
      unidadeEducacional: { select: { nome: true } },
    },
  },
  unidadeDestino: { select: { nome: true } },
  recibo: { select: { numero: true } },
} satisfies Prisma.MovimentacaoEstoqueInclude;

const incluiCentral = {
  estoque: { include: { insumo: { select: { nome: true, unidadeMedida: { select: { sigla: true } } } } } },
  guiaDeRemessa: { select: { numero: true, unidadeEducacional: { select: { nome: true } } } },
  entradaEstoque: { select: { notaFiscal: true } },
} satisfies Prisma.MovimentacaoEstoqueCentralInclude;

type RowUnidade = Prisma.MovimentacaoEstoqueGetPayload<{ include: typeof incluiUnidade }>;
type RowCentral = Prisma.MovimentacaoEstoqueCentralGetPayload<{ include: typeof incluiCentral }>;

function origemUnidade(m: RowUnidade) {
  if (m.origem) return m.origem;
  if (m.reciboId) return "recibo";
  if (m.motivo.startsWith(PREFIXO_MOTIVO_VOZ)) return "assistente_voz";
  return "manual";
}

async function buscarLinhas(prisma: PrismaClient, f: Filtros, limite: number, pular = 0) {
  const wU = whereUnidade(f);
  const wC = whereCentral(f);

  // Cada tabela devolve as (pular + limite) mais recentes; a união é ordenada e fatiada.
  const take = pular + limite;
  const [rowsU, rowsC, totalU, totalC] = await Promise.all([
    wU ? prisma.movimentacaoEstoque.findMany({ where: wU, include: incluiUnidade, orderBy: [{ dataMovimentacao: "desc" }, { id: "desc" }], take }) : [],
    wC ? prisma.movimentacaoEstoqueCentral.findMany({ where: wC, include: incluiCentral, orderBy: [{ dataMovimentacao: "desc" }, { id: "desc" }], take }) : [],
    wU ? prisma.movimentacaoEstoque.count({ where: wU }) : 0,
    wC ? prisma.movimentacaoEstoqueCentral.count({ where: wC }) : 0,
  ]);

  const brutas = [
    ...rowsU.map((r) => ({ data: r.dataMovimentacao, id: r.id, u: r as RowUnidade, c: null as RowCentral | null })),
    ...rowsC.map((r) => ({ data: r.dataMovimentacao, id: r.id, u: null as RowUnidade | null, c: r as RowCentral })),
  ]
    .sort((a, b) => b.data.getTime() - a.data.getTime() || b.id.localeCompare(a.id))
    .slice(pular, pular + limite);

  // Nomes das contas (usuário e administrador que acessou como ele), em uma consulta só.
  const ids = new Set<string>();
  for (const b of brutas) {
    const r = b.u ?? b.c!;
    if (r.usuarioId) ids.add(r.usuarioId);
    if (r.impersonadoPorId) ids.add(r.impersonadoPorId);
  }
  const contas = ids.size
    ? await prisma.usuario.findMany({ where: { id: { in: [...ids] } }, select: { id: true, nome: true } })
    : [];
  const nome = new Map(contas.map((c) => [c.id, c.nome]));

  const linhas: LinhaAuditoria[] = brutas.map(({ u, c }) => {
    if (u) {
      const origem = origemUnidade(u);
      return {
        id: u.id,
        data: u.dataMovimentacao.toISOString(),
        escopo: "unidade",
        origem,
        origemRotulo: ORIGENS[origem] ?? origem,
        tipo: u.tipo,
        item: u.estoque.itemContrato.nome,
        medida: u.estoque.itemContrato.unidadeMedida.sigla,
        quantidade: u.quantidade,
        saldoAnterior: u.quantidadeAnterior,
        saldoNovo: u.quantidadeNova,
        local: u.estoque.unidadeEducacional.nome,
        destino: u.unidadeDestino?.nome ?? null,
        responsavel: u.responsavel,
        usuario: u.usuarioId ? nome.get(u.usuarioId) ?? "(usuário removido)" : null,
        impersonadoPor: u.impersonadoPorId ? nome.get(u.impersonadoPorId) ?? "(usuário removido)" : null,
        motivo: u.motivo,
        transcricao: u.transcricao,
        documento: u.recibo ? `Recibo ${u.recibo.numero}` : null,
      };
    }
    const m = c!;
    return {
      id: m.id,
      data: m.dataMovimentacao.toISOString(),
      escopo: "central",
      origem: "almoxarifado",
      origemRotulo: ORIGENS.almoxarifado,
      tipo: m.tipo === "saida_para_unidade" ? "saida" : m.tipo,
      item: m.estoque.insumo.nome,
      medida: m.estoque.insumo.unidadeMedida.sigla,
      quantidade: m.quantidade,
      saldoAnterior: m.quantidadeAnterior,
      saldoNovo: m.quantidadeNova,
      local: "Almoxarifado central",
      destino: m.guiaDeRemessa?.unidadeEducacional.nome ?? null,
      responsavel: m.responsavel,
      usuario: m.usuarioId ? nome.get(m.usuarioId) ?? "(usuário removido)" : null,
      impersonadoPor: m.impersonadoPorId ? nome.get(m.impersonadoPorId) ?? "(usuário removido)" : null,
      motivo: m.motivo,
      transcricao: null,
      documento: m.entradaEstoque ? `NF ${m.entradaEstoque.notaFiscal}` : m.guiaDeRemessa ? `Guia ${m.guiaDeRemessa.numero}` : null,
    };
  });

  return { linhas, total: totalU + totalC };
}

async function resumo(prisma: PrismaClient, f: Filtros) {
  const wU = whereUnidade(f);
  const wC = whereCentral(f);
  const ou = (base: Prisma.MovimentacaoEstoqueWhereInput, extra: Prisma.MovimentacaoEstoqueWhereInput) => ({ AND: [base, extra] });
  const oc = (base: Prisma.MovimentacaoEstoqueCentralWhereInput, extra: Prisma.MovimentacaoEstoqueCentralWhereInput) => ({ AND: [base, extra] });

  const [entU, saiU, voz, entC, saiC] = await Promise.all([
    wU ? prisma.movimentacaoEstoque.count({ where: ou(wU, { tipo: "entrada" }) }) : 0,
    wU ? prisma.movimentacaoEstoque.count({ where: ou(wU, { tipo: { in: ["saida", "descarte"] } }) }) : 0,
    wU ? prisma.movimentacaoEstoque.count({ where: ou(wU, { OR: [{ origem: "assistente_voz" }, { origem: null, motivo: { startsWith: PREFIXO_MOTIVO_VOZ } }] }) }) : 0,
    wC ? prisma.movimentacaoEstoqueCentral.count({ where: oc(wC, { tipo: "entrada" }) }) : 0,
    wC ? prisma.movimentacaoEstoqueCentral.count({ where: oc(wC, { tipo: "saida_para_unidade" }) }) : 0,
  ]);
  return { entradas: entU + entC, saidas: saiU + saiC, viaAssistente: voz };
}

// ---------- exportação ----------

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: FUSO, dateStyle: "short", timeStyle: "medium" });

const CABECALHO = [
  "Data/Hora", "Origem", "Tipo", "Item", "Medida", "Quantidade", "Saldo anterior", "Saldo novo",
  "Local", "Destino", "Responsável informado", "Usuário (conta)", "Acessado como (admin)",
  "Motivo", "Frase falada", "Documento", "ID",
];

const paraLinhaPlana = (l: LinhaAuditoria) => [
  dataHora(l.data), l.origemRotulo, l.tipo, l.item, l.medida, l.quantidade, l.saldoAnterior, l.saldoNovo,
  l.local, l.destino ?? "", l.responsavel, l.usuario ?? "", l.impersonadoPor ?? "",
  l.motivo, l.transcricao ?? "", l.documento ?? "", l.id,
];

// ---------- rotas ----------

interface Dependencias {
  app: Express;
  prisma: PrismaClient;
  authenticateToken: RequestHandler;
  requireAdmin: RequestHandler;
}

export function registrarAuditoria({ app, prisma, authenticateToken, requireAdmin }: Dependencias) {
  // Quem está "como outro usuário" não consulta a auditoria.
  const semImpersonacao = (req: Request, res: Response, next: NextFunction) =>
    (req as Req).impersonatedBy
      ? res.status(403).json({ error: "Ação indisponível durante o acesso como outro usuário." })
      : next();

  app.get(
    "/api/auditoria/movimentacoes",
    authenticateToken,
    requireAdmin,
    semImpersonacao,
    async (req: Request, res: Response) => {
      try {
        const f = lerFiltros(req.query);
        const porPagina = Math.min(Math.max(Number(req.query.porPagina) || 50, 1), 100);
        const pagina = Math.min(Math.max(Number(req.query.pagina) || 1, 1), 500);

        const [{ linhas, total }, totais] = await Promise.all([
          buscarLinhas(prisma, f, porPagina, (pagina - 1) * porPagina),
          resumo(prisma, f),
        ]);
        res.json({ total, pagina, porPagina, resumo: { total, ...totais }, itens: linhas });
      } catch (error) {
        console.error("Erro na auditoria de movimentações:", error);
        res.status(500).json({ error: "Não foi possível consultar a auditoria." });
      }
    }
  );

  app.get(
    "/api/auditoria/movimentacoes/exportar",
    authenticateToken,
    requireAdmin,
    semImpersonacao,
    async (req: Request, res: Response) => {
      try {
        const f = lerFiltros(req.query);
        const formato = req.query.formato === "xlsx" ? "xlsx" : "csv";
        const { linhas, total } = await buscarLinhas(prisma, f, LIMITE_EXPORTACAO);
        const nomeBase = `auditoria-estoque-${new Date().toISOString().slice(0, 10)}`;

        if (total > LIMITE_EXPORTACAO) res.setHeader("X-Auditoria-Truncada", String(total));
        console.log(`[AUDITORIA] ${(req as Req).userId} exportou ${linhas.length} movimentações (${formato})`);

        if (formato === "xlsx") {
          const planilha = xlsx.utils.aoa_to_sheet([CABECALHO, ...linhas.map(paraLinhaPlana)]);
          planilha["!cols"] = CABECALHO.map((c) => ({ wch: Math.max(12, Math.min(c.length + 6, 36)) }));
          const livro = xlsx.utils.book_new();
          xlsx.utils.book_append_sheet(livro, planilha, "Movimentações");
          const buffer = xlsx.write(livro, { type: "buffer", bookType: "xlsx" });
          res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
          res.setHeader("Content-Disposition", `attachment; filename="${nomeBase}.xlsx"`);
          return res.send(buffer);
        }

        const escapar = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const csv = [CABECALHO, ...linhas.map(paraLinhaPlana)].map((l) => l.map(escapar).join(";")).join("\r\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${nomeBase}.csv"`);
        // BOM para o Excel abrir os acentos corretamente
        res.send("﻿" + csv);
      } catch (error) {
        console.error("Erro ao exportar auditoria:", error);
        res.status(500).json({ error: "Não foi possível exportar a auditoria." });
      }
    }
  );
}

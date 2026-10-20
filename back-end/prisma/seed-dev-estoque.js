// Seed APENAS para desenvolvimento local: cria um contrato com itens e o estoque da
// "Escola Teste (dev)", para testar o assistente de voz. Idempotente.
// Execute com SEED_DEV_USERS=true (depois de seed-dev-users.js).
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ITENS = [
  { nome: "Feijão Carioca", sigla: "Kg", saldo: 50 },
  { nome: "Arroz Parboilizado", sigla: "Kg", saldo: 30 },
  { nome: "Óleo de Soja", sigla: "L", saldo: 12 },
  { nome: "Macarrão Espaguete", sigla: "Pct", saldo: 20, gramagemPorPacote: 500 },
];

async function main() {
  if (process.env.SEED_DEV_USERS !== "true") return;

  const unidade = await prisma.unidadeEducacional.findUnique({ where: { codigo: "DEV-001" } });
  if (!unidade) {
    console.log("Unidade DEV-001 não existe; rode seed-dev-users.js antes.");
    return;
  }

  const fornecedor = await prisma.fornecedor.upsert({
    where: { cnpj: "00.000.000/0001-00" },
    update: {},
    create: { nome: "Fornecedor Teste (dev)", cnpj: "00.000.000/0001-00", email: "fornecedor@dev.local" },
  });

  const contrato = await prisma.contrato.upsert({
    where: { numero: "DEV-2025-001" },
    update: {},
    create: {
      numero: "DEV-2025-001",
      dataInicio: new Date("2025-01-01"),
      dataFim: new Date("2030-12-31"),
      valorTotal: 100000,
      status: "ativo",
      fornecedorId: fornecedor.id,
    },
  });

  for (const it of ITENS) {
    const medida = await prisma.unidadeMedida.findUnique({ where: { sigla: it.sigla } });
    if (!medida) continue;

    let item = await prisma.itemContrato.findFirst({ where: { contratoId: contrato.id, nome: it.nome } });
    if (!item) {
      item = await prisma.itemContrato.create({
        data: {
          nome: it.nome,
          valorUnitario: 5,
          quantidadeOriginal: 1000,
          saldoAtual: 1000,
          quantidadeEscola: 1000,
          saldoEscola: 1000,
          gramagemPorPacote: it.gramagemPorPacote ?? null,
          contratoId: contrato.id,
          unidadeMedidaId: medida.id,
        },
      });
    }

    await prisma.estoque.upsert({
      where: {
        unidadeEducacionalId_itemContratoId_tipoEstoque: {
          unidadeEducacionalId: unidade.id,
          itemContratoId: item.id,
          tipoEstoque: "escola",
        },
      },
      update: {},
      create: { unidadeEducacionalId: unidade.id, itemContratoId: item.id, tipoEstoque: "escola", quantidadeAtual: it.saldo },
    });
    console.log(`Estoque de teste: ${it.nome} (${it.sigla}) = ${it.saldo}`);
  }
}

main()
  .catch((e) => {
    console.error("Erro no seed de estoque de teste:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

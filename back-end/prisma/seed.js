const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

async function main() {
  console.log("Iniciando o processo de seeding...");

  // Limpar dados na ordem correta (dependências)
  await prisma.itemRecibo.deleteMany();
  await prisma.recibo.deleteMany();
  await prisma.itemPedido.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.movimentacaoEstoque?.deleteMany();
  await prisma.estoque.deleteMany();
  await prisma.percapitaItem.deleteMany();
  await prisma.itemContrato.deleteMany();
  await prisma.contrato.deleteMany();
  await prisma.fornecedor.deleteMany();
  await prisma.unidadeEducacional.deleteMany();
  await prisma.unidadeMedida.deleteMany();
  await prisma.tipoEstudante?.deleteMany();

  console.log("Tabelas limpas.");

  // Criar unidades de medida
  const unidades = await prisma.unidadeMedida.createMany({
    data: [
      { nome: "Quilograma", sigla: "Kg" },
      { nome: "Grama", sigla: "g" },
      { nome: "Pacote", sigla: "Pct" },
      { nome: "Litro", sigla: "L" },
      { nome: "Unidade", sigla: "Un" },
      { nome: "Caixa", sigla: "Cx" },
    ],
  });
  console.log("Unidades de medida criadas.");

  try {
    const senhaHash = await bcrypt.hash("admin123", 10);

    const admin = await prisma.usuario.upsert({
      where: { email: "admin@sistema.gov.br" },
      update: {}, // nada se já existir
      create: {
        nome: "Administrador",
        email: "admin@sistema.gov.br",
        senha: senhaHash,
        categoria: "administracao_tecnica",
        ativo: true,
      },
    });

    console.log("Usuário administrador criado ou já existente:", admin.email);
  } catch (error) {
    console.error("Erro ao criar administrador:", error);
  } finally {
    await prisma.$disconnect();
  }

  console.log("Seeding finalizado com sucesso!");

  console.log("Iniciando o seeder de tipos de estudante...");

  const tiposEstudante = [
    {
      id: "bercario",
      nome: "Berçário",
      sigla: "BER",
      categoria: "creche",
      ordem: 1,
    },
    {
      id: "maternal",
      nome: "Maternal",
      sigla: "MAT",
      categoria: "creche",
      ordem: 2,
    },
    {
      id: "regular",
      nome: "Turmas Regulares",
      sigla: "REG",
      categoria: "escola",
      ordem: 3,
    },
    {
      id: "integral",
      nome: "Turmas Integrais",
      sigla: "INT",
      categoria: "escola",
      ordem: 4,
    },
    {
      id: "eja",
      nome: "Educação de Jovens e Adultos",
      sigla: "EJA",
      categoria: "escola",
      ordem: 5,
    },
  ];

  for (const tipo of tiposEstudante) {
    try {
      await prisma.tipoEstudante.upsert({
        where: { id: tipo.id },
        update: tipo,
        create: tipo,
      });
      console.log(`Tipo de estudante "${tipo.nome}" inserido ou atualizado.`);
    } catch (error) {
      console.error(
        `Erro ao inserir o tipo de estudante "${tipo.nome}":`,
        error
      );
    }
  }

  console.log("Seeder de tipos de estudante finalizado.");
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

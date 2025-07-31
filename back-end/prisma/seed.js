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
  await prisma.itemContrato.deleteMany();
  await prisma.contrato.deleteMany();
  await prisma.fornecedor.deleteMany();
  await prisma.unidadeEducacional.deleteMany();
  await prisma.unidadeMedida.deleteMany();

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
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

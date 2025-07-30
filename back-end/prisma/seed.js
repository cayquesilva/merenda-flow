const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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

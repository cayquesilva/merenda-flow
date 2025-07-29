const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando o processo de seeding...");

  // Limpa os dados existentes para evitar duplicatas
  await prisma.itemRecibo.deleteMany();
  await prisma.itemPedido.deleteMany();
  await prisma.recibo.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.itemContrato.deleteMany();
  await prisma.contrato.deleteMany();
  await prisma.fornecedor.deleteMany();
  await prisma.unidadeEducacional.deleteMany();
  await prisma.unidadeMedida.deleteMany();
  console.log("Tabelas limpas.");

  // 1. Criar Unidades de Medida
  const kg = await prisma.unidadeMedida.create({
    data: { nome: "Quilograma", sigla: "Kg" },
  });
  const g = await prisma.unidadeMedida.create({
    data: { nome: "Gramas", sigla: "g" },
  });
  const pct = await prisma.unidadeMedida.create({
    data: { nome: "Pacote", sigla: "Pct" },
  });
  const l = await prisma.unidadeMedida.create({
    data: { nome: "Litro", sigla: "L" },
  });
  const un = await prisma.unidadeMedida.create({
    data: { nome: "Unidade", sigla: "Un" },
  });
  const cx = await prisma.unidadeMedida.create({
    data: { nome: "Caixa", sigla: "Cx" },
  });
  console.log("Unidades de medida criadas.");

  /* 2. Criar Fornecedores - comentado para produção...
  const fornecedor1 = await prisma.fornecedor.create({
    data: {
      nome: "Alimentos Frescos Ltda",
      cnpj: "12.345.678/0001-90",
      telefone: "(11) 99999-9999",
      email: "contato@alimentosfrescos.com.br",
      endereco: "Rua das Flores, 123 - São Paulo/SP",
    },
  });
  const fornecedor2 = await prisma.fornecedor.create({
    data: {
      nome: "Distribuidora Campos Verde",
      cnpj: "98.765.432/0001-10",
      telefone: "(11) 88888-8888",
      email: "vendas@camposverde.com.br",
      endereco: "Av. Central, 456 - São Paulo/SP",
    },
  });
  console.log("Fornecedores criados.");

  // 3. Criar Unidades Educacionais
  const emeiFlores = await prisma.unidadeEducacional.create({
    data: {
      nome: "EMEI Jardim das Flores",
      codigo: "JF001",
      endereco: "Rua A, 100 - Bairro Central",
      telefone: "(11) 3333-3333",
      email: "jardimflores@edu.sp.gov.br",
    },
  });
  console.log("Unidades Educacionais criadas.");

  // 4. Criar Contratos e seus Itens
  const contrato1 = await prisma.contrato.create({
    data: {
      numero: "CT-2024-001",
      fornecedorId: fornecedor1.id,
      dataInicio: new Date("2024-01-01"),
      dataFim: new Date("2024-12-31"),
      valorTotal: 250000.0,
      status: "ativo",
      itens: {
        create: [
          {
            nome: "Arroz Integral",
            unidadeMedidaId: kg.id,
            valorUnitario: 5.5,
            quantidadeOriginal: 10000,
            saldoAtual: 8500,
          },
          {
            nome: "Feijão Preto",
            unidadeMedidaId: pct.id,
            valorUnitario: 8.9,
            quantidadeOriginal: 5000,
            saldoAtual: 4200,
          },
          {
            nome: "Óleo de Soja",
            unidadeMedidaId: l.id,
            valorUnitario: 6.75,
            quantidadeOriginal: 2000,
            saldoAtual: 1800,
          },
        ],
      },
    },
    include: { itens: true }, // Inclui os itens para podermos usar os IDs abaixo
  });
  console.log("Contrato 1 e seus itens criados.");

  // 5. Criar Pedidos e seus Itens
  const pedido1 = await prisma.pedido.create({
    data: {
      numero: "PD-2024-001",
      contratoId: contrato1.id,
      dataPedido: new Date("2024-07-20"),
      dataEntregaPrevista: new Date("2024-07-25"),
      status: "entregue",
      valorTotal: 15750.0,
      itens: {
        create: [
          {
            itemContratoId: contrato1.itens[0].id,
            unidadeEducacionalId: emeiFlores.id,
            quantidade: 500,
          },
          {
            itemContratoId: contrato1.itens[1].id,
            unidadeEducacionalId: emeiFlores.id,
            quantidade: 200,
          },
        ],
      },
    },
    include: { itens: true },
  });
  console.log("Pedido 1 e seus itens criados.");

  // 6. Criar Recibos e seus Itens
  await prisma.recibo.create({
    data: {
      numero: "RB-2024-001",
      pedidoId: pedido1.id,
      unidadeEducacionalId: emeiFlores.id,
      dataEntrega: new Date("2024-07-25"),
      responsavelEntrega: "João Silva - Transportadora",
      responsavelRecebimento: "Maria Santos - EMEI Jardim das Flores",
      status: "confirmado",
      observacoes: "Entrega realizada conforme solicitado",
      itens: {
        create: [
          {
            itemPedidoId: pedido1.itens[0].id,
            quantidadeSolicitada: 500,
            quantidadeRecebida: 500,
            conforme: true,
          },
          {
            itemPedidoId: pedido1.itens[1].id,
            quantidadeSolicitada: 200,
            quantidadeRecebida: 180,
            conforme: false,
            observacoes: "Faltaram 20 pacotes",
          },
        ],
      },
    },
  });
  console.log("Recibo 1 e seus itens criados.");
*/
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

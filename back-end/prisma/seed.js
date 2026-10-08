const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

async function main() {
  console.log("Verificando necessidade de execução do seed inicial...");

  // Verifica se o banco já possui dados cadastrados.
  // Se já houver registros de usuários, unidades educacionais ou contratos,
  // significa que o banco já foi inicializado e o seed NÃO deve alterar nada.
  const [totalUsuarios, totalUnidadesEducacionais, totalContratos] =
    await Promise.all([
      prisma.usuario.count().catch(() => 0),
      prisma.unidadeEducacional.count().catch(() => 0),
      prisma.contrato.count().catch(() => 0),
    ]);

  const jaPossuiDados =
    totalUsuarios > 0 || totalUnidadesEducacionais > 0 || totalContratos > 0;

  if (jaPossuiDados) {
    console.log(
      `Banco de dados já inicializado (${totalUsuarios} usuário(s), ${totalUnidadesEducacionais} unidade(s) educacional(is), ${totalContratos} contrato(s)).`
    );
    console.log(
      "Nenhum dado foi alterado ou apagado. O seed inicial roda apenas na primeira criação do banco."
    );
    return;
  }

  console.log("Banco de dados novo detectado. Executando seed inicial...");

  // 1. Criar unidades de medida padrão (sem apagar dados)
  const unidadesMedida = [
    { nome: "Quilograma", sigla: "Kg" },
    { nome: "Grama", sigla: "g" },
    { nome: "Pacote", sigla: "Pct" },
    { nome: "Litro", sigla: "L" },
    { nome: "Unidade", sigla: "Un" },
    { nome: "Caixa", sigla: "Cx" },
  ];

  for (const unidade of unidadesMedida) {
    await prisma.unidadeMedida.upsert({
      where: { sigla: unidade.sigla },
      update: {},
      create: unidade,
    });
  }
  console.log("Unidades de medida padrão criadas.");

  // 2. Criar usuário administrador padrão (sem apagar dados)
  const senhaHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.usuario.upsert({
    where: { email: "admin@sistema.gov.br" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@sistema.gov.br",
      senha: senhaHash,
      categoria: "administracao_tecnica",
      ativo: true,
    },
  });
  console.log("Usuário administrador criado:", admin.email);

  // 3. Criar tipos de estudante padrão (sem apagar dados)
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
      id: "pre",
      nome: "Pré-Escola",
      sigla: "PRE",
      categoria: "creche",
      ordem: 3,
    },
    {
      id: "regular",
      nome: "Turmas Regulares",
      sigla: "REG",
      categoria: "escola",
      ordem: 4,
    },
    {
      id: "integral",
      nome: "Turmas Integrais",
      sigla: "INT",
      categoria: "escola",
      ordem: 5,
    },
    {
      id: "eja",
      nome: "Educação de Jovens e Adultos",
      sigla: "EJA",
      categoria: "escola",
      ordem: 6,
    },
  ];

  for (const tipo of tiposEstudante) {
    try {
      await prisma.tipoEstudante.upsert({
        where: { id: tipo.id },
        update: {},
        create: tipo,
      });
      console.log(`Tipo de estudante "${tipo.nome}" inserido.`);
    } catch (error) {
      console.error(
        `Erro ao inserir tipo de estudante "${tipo.nome}":`,
        error
      );
    }
  }

  console.log("Seed inicial finalizado com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro durante a execução do seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

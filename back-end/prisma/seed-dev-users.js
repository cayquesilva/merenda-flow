// Seed APENAS para desenvolvimento local: cria um usuário por perfil para testar
// permissões e impersonação. Idempotente. Execute com SEED_DEV_USERS=true.
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  if (process.env.SEED_DEV_USERS !== "true") {
    console.log("SEED_DEV_USERS != true, usuários de teste ignorados.");
    return;
  }

  const senha = await bcrypt.hash("teste123", 10);

  const unidade = await prisma.unidadeEducacional.upsert({
    where: { codigo: "DEV-001" },
    update: {},
    create: {
      nome: "Escola Teste (dev)",
      codigo: "DEV-001",
      email: "escola.teste@dev.local",
      estudantesRegular: 100,
    },
  });

  const usuarios = [
    { nome: "Gerência Nutrição (teste)", email: "nutricao@dev.local", categoria: "gerencia_nutricao" },
    { nome: "Gerência Almoxarifado (teste)", email: "almoxarifado@dev.local", categoria: "gerencia_almoxarifado" },
    { nome: "Comissão Recebimento (teste)", email: "comissao@dev.local", categoria: "comissao_recebimento", vincular: true },
    { nome: "Nutricionista Externa (teste)", email: "nutri.externa@dev.local", categoria: "nutricionistas_externas", vincular: true },
  ];

  for (const { vincular, ...dados } of usuarios) {
    await prisma.usuario.upsert({
      where: { email: dados.email },
      update: {},
      create: {
        ...dados,
        senha,
        ativo: true,
        ...(vincular && { unidadesEducacionais: { connect: { id: unidade.id } } }),
      },
    });
    console.log(`Usuário de teste: ${dados.email} (${dados.categoria}) / teste123`);
  }
}

main()
  .catch((e) => {
    console.error("Erro no seed de usuários de teste:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

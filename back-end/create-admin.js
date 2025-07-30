const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const senhaHash = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.usuario.create({
      data: {
        nome: 'Administrador',
        email: 'admin@sistema.gov.br',
        senha: senhaHash,
        categoria: 'administracao_tecnica',
        ativo: true
      }
    });
    
    console.log('Usuário administrador criado:', admin.email);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('Usuário administrador já existe');
    } else {
      console.error('Erro:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const dirPath = 'c:\\Users\\rober\\OneDrive\\Documentos\\Freelas\\merenda-flow\\contratos';

async function processPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();
  const text = result.text;

  // 1. CNPJ
  let cnpj = null;
  const cnpjMatch1 = text.match(/Contratado \(CNPJ\):\s*([\d\.\-\/]+)/);
  const cnpjMatch2 = text.match(/CNPJ N[oºº]*\s*([\d\.\-\/]+)/);
  if (cnpjMatch1) cnpj = cnpjMatch1[1];
  else if (cnpjMatch2) cnpj = cnpjMatch2[1];

  // 2. Nome
  let nome = null;
  const nomeMatch1 = text.match(/Contratado \(Nome\):\s*(.*)/);
  const nomeMatch2 = text.match(/e [ao]\s+([A-Z0-9\s\.\-\&]+),\s*inscrita sob CNPJ/);
  if (nomeMatch1) nome = nomeMatch1[1].trim();
  else if (nomeMatch2) nome = nomeMatch2[1].trim();

  // 3. Email
  let email = null;
  const emails = text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/g) || [];
  const validEmails = emails.filter(e => !e.toLowerCase().includes('campinagrande.pb.gov.br') && !e.toLowerCase().includes('tst.jus.br'));
  if (validEmails.length > 0) {
    email = validEmails[0];
  } else {
    email = `contato@${cnpj ? cnpj.replace(/\D/g, '') : 'desconhecido'}.com.br`;
  }

  // 4. Telefone
  let telefone = null;
  const phones = text.match(/\(\d{2}\)\s*\d{4,5}-\d{4}/g) || [];
  const validPhones = phones.filter(p => !p.includes('3310-6927') && !p.includes('3690-1757'));
  if (validPhones.length > 0) {
    telefone = validPhones[0];
  } else {
    telefone = '(83) 99999-9999';
  }

  // 5. Endereço
  let endereco = null;
  const endMatch = text.match(/com sede [n]?[ao]?\s*(.*?)(?:, neste ato|, doravante|; neste ato)/i);
  if (endMatch) {
    endereco = endMatch[1].replace(/\n/g, ' ').trim();
  }

  if (cnpj && nome) {
    console.log(`\nFound: ${nome} - ${cnpj}`);
    console.log(`Email: ${email}, Phone: ${telefone}`);
    console.log(`Address: ${endereco}`);
    
    // Upsert into DB
    await prisma.fornecedor.upsert({
      where: { cnpj: cnpj },
      update: {
        nome: nome,
        telefone: telefone,
        email: email,
        endereco: endereco,
        ativo: true
      },
      create: {
        nome: nome,
        cnpj: cnpj,
        telefone: telefone,
        email: email,
        endereco: endereco,
        ativo: true
      }
    });
  } else {
    console.log(`\nFailed to extract core info from ${path.basename(filePath)}`);
  }
}

async function main() {
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.pdf'));
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    await processPdf(fullPath);
  }
  console.log('\nAll done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

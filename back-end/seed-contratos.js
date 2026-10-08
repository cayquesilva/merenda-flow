const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const dirPath = 'c:\\Users\\rober\\OneDrive\\Documentos\\Freelas\\merenda-flow\\contratos';

const MONTHS = {
  JANEIRO: 0, FEVEREIRO: 1, MARÇO: 2, MARCO: 2, ABRIL: 3, MAIO: 4, JUNHO: 5,
  JULHO: 6, AGOSTO: 7, SETEMBRO: 8, OUTUBRO: 9, NOVEMBRO: 10, DEZEMBRO: 11
};

async function processPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();
  const text = result.text;
  const lines = text.split('\n');

  console.log(`\n--- Processing ${path.basename(filePath)} ---`);

  // 1. CNPJ
  let cnpj = null;
  const cnpjMatch = text.match(/Contratado \(CNPJ\):\s*([\d\.\-\/]+)/) || text.match(/CNPJ N[oºº]*\s*([\d\.\-\/]+)/);
  if (cnpjMatch) cnpj = cnpjMatch[1];
  if (!cnpj) {
    console.log("CNPJ not found!");
    return;
  }

  // 2. Numero do Contrato
  let numero = null;
  const filenameMatch = path.basename(filePath).match(/CONTRATO_N_(\d_\d\d_\d\d\d_\d{4})/i);
  if (filenameMatch) {
    numero = filenameMatch[1].replace(/_/g, '.');
  } else {
    const numMatch = text.match(/CONTRATO N[ºO]*\s*([\d\.\/]+(?:-202[0-9])?)/i);
    if (numMatch) numero = numMatch[1].replace(/[^0-9\.\/]/g, '');
  }

  // 3. Data de Inicio
  let dataInicio = new Date(2026, 0, 1);
  const dateMatch = text.match(/DATA DE ASSINATURA:\s*(\d{1,2})\s+DE\s+([A-ZÇ]+)\s+DE\s+(\d{4})/i);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const month = MONTHS[dateMatch[2].toUpperCase()] || 0;
    const year = parseInt(dateMatch[3]);
    dataInicio = new Date(year, month, day);
  }

  // 4. Valor Total
  let valorTotal = 0;
  const valMatch = text.match(/VALOR:\s*R\$\s*([\d\.\,]+)/i);
  if (valMatch) {
    valorTotal = parseFloat(valMatch[1].replace(/\./g, '').replace(',', '.'));
  }

  // Get Fornecedor
  let fornecedor = await prisma.fornecedor.findUnique({ where: { cnpj } });
  if (!fornecedor) {
    console.log(`Fornecedor ${cnpj} not found in DB! Creating dummy...`);
    fornecedor = await prisma.fornecedor.create({
      data: {
        nome: `Fornecedor ${cnpj}`,
        cnpj: cnpj,
        telefone: '(83) 99999-9999',
        email: `contato@${cnpj.replace(/\D/g, '')}.com.br`,
        ativo: true
      }
    });
  }

  // Parse Items
  let startIndex = lines.findIndex(l => l.includes('PLANILHA'));
  if (startIndex === -1) {
    console.log("PLANILHA not found!");
    return;
  }

  const items = [];
  let currentName = '';

  for (let i = startIndex + 1; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line || line.includes('ITEM DESCRIÇÃO')) continue;
    if (line.match(/VALOR TOTAL\s*R\$/i)) break;

    // Filter page headers/footers
    if (line.match(/-- \d+ of \d+ --/i) || line.includes('ESTADO DA PARAÍBA') || line.includes('SECRETARIA MUNICIPAL DE EDUCAÇÃO') || line.includes('Rua Paulino Raposo')) continue;

    const match = line.match(/^(.*?)\s+([A-Z]+(?:\.)?)\s+([\d\.]+)\s+R\$\s*([\d,]+)\s+R\$\s*([\d\.,]+)/i);
    if (match) {
       let nomePart = match[1].trim();
       let fullNome = (currentName + ' ' + nomePart).trim();
       fullNome = fullNome.replace(/^\d+\s+/, '').trim();
       
       items.push({
         nome: fullNome,
         unidade: match[2].replace('.', ''),
         quantidade: parseFloat(match[3].replace(/\./g, '').replace(',', '.')),
         valorUnitario: parseFloat(match[4].replace(/\./g, '').replace(',', '.')),
         valorTotal: parseFloat(match[5].replace(/\./g, '').replace(',', '.'))
       });
       currentName = '';
    } else {
       if (line.match(/^\d+\s+/)) {
         currentName = line.trim();
       } else {
         currentName += ' ' + line.trim();
       }
    }
  }

  console.log(`Contrato: ${numero}, Valor: ${valorTotal}, Itens: ${items.length}`);
  
  if (items.length === 0) {
    console.log("No items parsed!");
    return;
  }

  // UPSERT CONTRATO
  if (!numero) numero = `CT-UNKNOWN-${Math.random()}`;
  
  // Calculate total from items if 0
  if (valorTotal === 0) {
    valorTotal = items.reduce((sum, item) => sum + item.valorTotal, 0);
  }

  const contrato = await prisma.contrato.upsert({
    where: { numero },
    update: {
      dataInicio,
      dataFim: new Date(dataInicio.getFullYear(), 11, 31, 23, 59, 59),
      valorTotal,
      status: 'ativo',
      fornecedorId: fornecedor.id
    },
    create: {
      numero,
      tipo: 'nutricao',
      dataInicio,
      dataFim: new Date(dataInicio.getFullYear(), 11, 31, 23, 59, 59),
      valorTotal,
      status: 'ativo',
      fornecedorId: fornecedor.id
    }
  });

  // UPSERT ITENS
  for (const item of items) {
    // 1. Unidade de Medida
    const sigla = item.unidade.toUpperCase();
    const unidadeMedida = await prisma.unidadeMedida.upsert({
      where: { sigla },
      update: {},
      create: { nome: sigla, sigla }
    });

    // 2. ItemContrato
    // Find existing to avoid duplicates by name
    const existingItems = await prisma.itemContrato.findMany({
      where: { contratoId: contrato.id, nome: item.nome }
    });

    if (existingItems.length > 0) {
      await prisma.itemContrato.update({
        where: { id: existingItems[0].id },
        data: {
          valorUnitario: item.valorUnitario,
          quantidadeOriginal: item.quantidade,
          saldoAtual: item.quantidade,
          quantidadeEscola: item.quantidade,
          saldoEscola: item.quantidade,
          unidadeMedidaId: unidadeMedida.id
        }
      });
    } else {
      await prisma.itemContrato.create({
        data: {
          nome: item.nome,
          valorUnitario: item.valorUnitario,
          quantidadeOriginal: item.quantidade,
          saldoAtual: item.quantidade,
          quantidadeEscola: item.quantidade,
          saldoEscola: item.quantidade,
          contratoId: contrato.id,
          unidadeMedidaId: unidadeMedida.id
        }
      });
    }
  }

  console.log('Saved successfully!');
}

async function main() {
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.pdf'));
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    try {
      await processPdf(fullPath);
    } catch (e) {
      console.error(`Error processing ${file}:`, e);
    }
  }
  console.log('\nAll done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

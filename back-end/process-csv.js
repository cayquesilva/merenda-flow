const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const csvPath = 'c:\\Users\\rober\\OneDrive\\Documentos\\Freelas\\merenda-flow\\relatorio-vagas-2026.csv';
const outPath = 'c:\\Users\\rober\\OneDrive\\Documentos\\Freelas\\merenda-flow\\template_unidades_preenchido.xlsx';

const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

// Remove header
lines.shift();

const units = {};

function slugify(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
}

lines.forEach(line => {
  const parts = line.split(';');
  if (parts.length < 5) return;
  const escola = parts[0].trim();
  const etapa = parts[1].trim();
  const turma = parts[2].trim().toUpperCase();
  const turno = parts[3].trim();
  const ocupadas = parseInt(parts[4].trim()) || 0;

  if (!units[escola]) {
    const slug = slugify(escola);
    // Generating a consistent code
    const code = 'UNID-' + String(Object.keys(units).length + 1).padStart(3, '0');
    
    units[escola] = {
      nome: escola,
      codigo: code,
      email: `contato@${slug}.com.br`,
      telefone: '83999999999',
      endereco: 'Endereço não informado',
      ativo: 'Sim',
      estudantesBercario: 0,
      estudantesMaternal: 0,
      estudantesPreEscola: 0,
      estudantesRegular: 0,
      estudantesIntegral: 0,
      estudantesEja: 0
    };
  }

  const u = units[escola];

  if (etapa.includes('EJA')) {
    u.estudantesEja += ocupadas;
  } else if (etapa.includes('Educação Infantil') || etapa.includes('Educacao Infantil')) {
    if (turma.includes('BERÇÁRIO') || turma.includes('BERCARIO')) {
      u.estudantesBercario += ocupadas;
    } else if (turma.includes('MATERNAL')) {
      u.estudantesMaternal += ocupadas;
    } else {
      u.estudantesPreEscola += ocupadas;
    }
  } else {
    // Ensino Fundamental
    if (turno === 'Integral' || turma.includes('INTEGRAL')) {
      u.estudantesIntegral += ocupadas;
    } else {
      u.estudantesRegular += ocupadas;
    }
  }
});

const rows = Object.values(units);

const headers = [
  'nome',
  'codigo',
  'email',
  'telefone',
  'endereco',
  'ativo',
  'estudantesBercario',
  'estudantesMaternal',
  'estudantesPreEscola',
  'estudantesRegular',
  'estudantesIntegral',
  'estudantesEja'
];

const wsData = [headers];
rows.forEach(r => {
  wsData.push([
    r.nome,
    r.codigo,
    r.email,
    r.telefone,
    r.endereco,
    r.ativo,
    r.estudantesBercario,
    r.estudantesMaternal,
    r.estudantesPreEscola,
    r.estudantesRegular,
    r.estudantesIntegral,
    r.estudantesEja
  ]);
});

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.aoa_to_sheet(wsData);
xlsx.utils.book_append_sheet(wb, ws, 'Unidades');

xlsx.writeFile(wb, outPath);
console.log('File written to', outPath);

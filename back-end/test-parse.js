const fs = require('fs');

const text = fs.readFileSync('output.txt', 'utf8');
const lines = text.split('\n');

let startIndex = lines.findIndex(l => l.includes('PLANILHA'));
let endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('VALOR TOTAL'));

if (startIndex === -1 || endIndex === -1) {
  console.log("Table bounds not found");
  process.exit(1);
}

const tableLines = lines.slice(startIndex + 1, endIndex);

const items = [];
let currentName = '';

for (let line of tableLines) {
  line = line.trim();
  if (!line) continue;
  if (line.includes('ITEM DESCRIÇÃO')) continue;

  const match = line.match(/^(.*?)\s+([A-Z]+(?:\.)?)\s+([\d\.]+)\s+R\$\s*([\d,]+)\s+R\$\s*([\d\.,]+)/i);
  if (match) {
     let nomePart = match[1].trim();
     let fullNome = (currentName + ' ' + nomePart).trim();
     fullNome = fullNome.replace(/^\d+\s+/, '');
     
     items.push({
       nome: fullNome,
       unidade: match[2],
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

console.log(`Found ${items.length} items.`);
console.log(items.slice(0, 3));
console.log(items[items.length - 1]);

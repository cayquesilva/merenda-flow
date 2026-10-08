const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function test() {
  const file = 'c:\\Users\\rober\\OneDrive\\Documentos\\Freelas\\merenda-flow\\contratos\\CONTRATO_N_2_06_030_2026_MAXXI_PE_N_9_03_14_2025_GE_NEROS_ALIMENTICIOS_FINALIZADO.pdf';
  const dataBuffer = fs.readFileSync(file);
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();
  fs.writeFileSync('output.txt', result.text, 'utf8');
}
test();

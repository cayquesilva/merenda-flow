const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

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

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.aoa_to_sheet([headers]);
xlsx.utils.book_append_sheet(wb, ws, 'Unidades');

const publicPath = path.join('c:', 'Users', 'rober', 'OneDrive', 'Documentos', 'Freelas', 'merenda-flow', 'public', 'template_unidades.xlsx');

xlsx.writeFile(wb, publicPath);
console.log('Template created successfully at:', publicPath);

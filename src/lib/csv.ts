export type Celula = string | number | boolean | null | undefined;

export interface ArquivoCsv {
  // Nome do arquivo sem extensão; a data do dia é acrescentada.
  nome: string;
  cabecalho: string[];
  linhas: Celula[][];
}

// Data (ISO ou Date) no formato dd/MM/yyyy, igual ao exibido nas telas.
export const dataBr = (valor: string | Date | null | undefined) =>
  valor ? new Date(valor).toLocaleDateString("pt-BR") : "";

// Texto que começa com = + - @ seria interpretado como fórmula pelo Excel (injeção de fórmula
// em planilhas): recebe um apóstrofo na frente para ser tratado como texto.
const protegerFormula = (texto: string) => (/^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto);

function formatar(valor: Celula): string {
  if (valor === null || valor === undefined) return "";
  // Números com vírgula decimal, para o Excel em português ler como número.
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? String(Math.round(valor * 1e6) / 1e6).replace(".", ",") : "";
  }
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  return protegerFormula(valor);
}

const escapar = (valor: Celula) => `"${formatar(valor).replace(/"/g, '""')}"`;

// Gera e baixa um CSV: separador ";" e BOM UTF-8 (acentos corretos ao abrir no Excel).
export function baixarCsv({ nome, cabecalho, linhas }: ArquivoCsv) {
  const conteudo = [cabecalho, ...linhas].map((linha) => linha.map(escapar).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + conteudo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nome}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const ROTULOS_TIPO_MOVIMENTACAO: Record<string, string> = {
  entrada: "Entrada",
  saida: "Saída",
  ajuste: "Ajuste",
  descarte: "Descarte",
  remanejamento: "Remanejamento",
};

export const rotuloTipoMovimentacao = (tipo: string) => ROTULOS_TIPO_MOVIMENTACAO[tipo] ?? tipo;

// Mesma regra de sinal das telas: saída, descarte e remanejamento que reduz o saldo são negativos.
export function quantidadeComSinal(m: {
  tipo: string;
  quantidade: number;
  quantidadeAnterior: number;
  quantidadeNova: number;
}) {
  const reduz =
    m.tipo === "saida" ||
    m.tipo === "descarte" ||
    (m.tipo === "remanejamento" && m.quantidadeAnterior > m.quantidadeNova);
  return reduz ? -m.quantidade : m.quantidade;
}

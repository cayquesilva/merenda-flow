import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Remove todos os caracteres não numéricos de uma string.
 * @param value A string para limpar (ex: "(11) 99999-9999")
 * @returns Apenas os números (ex: "11999999999")
 */
export function unmask(value: string | null | undefined): string {
  return value?.replace(/\D/g, "") || "";
}

/**
 * Formata uma string de CNPJ.
 * @param cnpj A string de CNPJ (com ou sem máscara)
 * @returns O CNPJ formatado (ex: "12.345.678/0001-90") ou a string original se inválida.
 */
export function formatCNPJ(cnpj: string | null | undefined): string {
  const cleaned = unmask(cnpj);
  if (cleaned.length !== 14) return cnpj || "";
  return cleaned.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5"
  );
}

/**
 * Formata uma string de telefone.
 * @param telefone A string de telefone (com ou sem máscara)
 * @returns O telefone formatado (ex: "(11) 99999-9999") ou a string original se inválida.
 */
export function formatTelefone(telefone: string | null | undefined): string {
  const cleaned = unmask(telefone);
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return telefone || "";
}

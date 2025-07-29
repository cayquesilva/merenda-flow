export interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  ativo: boolean;
  createdAt: string;
}

export interface UnidadeMedida {
  id: string;
  nome: string;
  sigla: string;
}

export interface ItemContrato {
  id: string;
  contratoId: string;
  nome: string;
  unidadeMedidaId: string;
  unidadeMedida: UnidadeMedida;
  valorUnitario: number;
  quantidadeOriginal: number;
  saldoAtual: number;
}

export interface Contrato {
  id: string;
  numero: string;
  fornecedorId: string;
  fornecedor: Fornecedor;
  dataInicio: string;
  dataFim: string;
  valorTotal: number;
  status: 'ativo' | 'inativo' | 'vencido';
  itens: ItemContrato[];
  createdAt: string;
}

export interface UnidadeEducacional {
  id: string;
  nome: string;
  codigo: string;
  endereco: string;
  telefone: string;
  email: string;
  ativo: boolean;
}

export interface ItemPedido {
  id: string;
  pedidoId: string;
  itemContratoId: string;
  itemContrato: ItemContrato;
  unidadeEducacionalId: string;
  unidadeEducacional: UnidadeEducacional;
  quantidade: number;
}

export interface Pedido {
  id: string;
  numero: string;
  contratoId: string;
  contrato: Contrato;
  dataPedido: string;
  dataEntregaPrevista: string;
  status: 'pendente' | 'confirmado' | 'entregue' | 'cancelado';
  valorTotal: number;
  itens: ItemPedido[];
  createdAt: string;
}

export interface ItemRecibo {
  id: string;
  reciboId: string;
  itemPedidoId: string;
  itemPedido: ItemPedido;
  quantidadeSolicitada: number;
  quantidadeRecebida?: number;
  conforme: boolean;
  observacoes?: string;
}

export interface Recibo {
  id: string;
  numero: string;
  pedidoId: string;
  pedido: Pedido;
  unidadeEducacionalId: string;
  unidadeEducacional: UnidadeEducacional;
  dataEntrega: string;
  responsavelEntrega: string;
  responsavelRecebimento?: string;
  status: 'pendente' | 'confirmado' | 'parcial' | 'rejeitado';
  qrcode: string;
  itens: ItemRecibo[];
  observacoes?: string;
  createdAt: string;
}

export interface ConsolidacaoPedido {
  pedidoId: string;
  pedido: Pedido;
  recibos: Recibo[];
  statusConsolidacao: 'pendente' | 'parcial' | 'completo';
  totalUnidades: number;
  unidadesConfirmadas: number;
  percentualConfirmacao: number;
}

export interface Estoque {
  id: string;
  unidadeEducacionalId: string;
  unidadeEducacional: UnidadeEducacional;
  itemContratoId: string;
  itemContrato: ItemContrato;
  quantidadeAtual: number;
  quantidadeMinima: number;
  ultimaAtualizacao: string;
}

export interface MovimentacaoEstoque {
  id: string;
  estoqueId: string;
  estoque: Estoque;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  quantidadeAnterior: number;
  quantidadeNova: number;
  motivo: string;
  reciboId?: string;
  recibo?: Recibo;
  responsavel: string;
  dataMovimentacao: string;
}
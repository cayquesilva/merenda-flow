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
  quantidadeCreche: number;
  quantidadeEscola: number;
  saldoCreche: number;
  saldoEscola: number;
  percapitas?: PercapitaItem[];
  gramagemPorPacote?: number;
}

export interface Contrato {
  id: string;
  numero: string;
  fornecedorId: string;
  fornecedor: Fornecedor;
  dataInicio: string;
  dataFim: string;
  valorTotal: number;
  status: "ativo" | "inativo" | "vencido";
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
  estudantesBercario: number;
  estudantesMaternal: number;
  estudantesPreEscola: number;
  estudantesRegular: number;
  estudantesIntegral: number;
  estudantesEja: number;
  tipoEstoque: "creche" | "escola";
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
  status: "pendente" | "confirmado" | "entregue" | "cancelado";
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
  status:
    | "pendente"
    | "confirmado"
    | "parcial"
    | "rejeitado"
    | "ajustado"
    | "complementar";
  qrcode: string;
  itens: ItemRecibo[];
  observacoes?: string;
  createdAt: string;
  reciboOriginalId?: string | null;
  reciboOriginal?: {
    id: string;
    numero: string;
  } | null;
  recibosComplementares?: {
    id: string;
    numero: string;
    status: string;
  }[];
}

export interface ConsolidacaoPedido {
  pedidoId: string;
  pedido: Pedido;
  recibos: Recibo[];
  statusConsolidacao: "pendente" | "parcial" | "completo" | "ajustado";
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
  tipoEstoque: "creche" | "escola";
}

export interface MovimentacaoEstoque {
  id: string;
  estoqueId: string;
  estoque: Estoque;
  tipo: "entrada" | "saida" | "ajuste" | "descarte" | "remanejamento";
  quantidade: number;
  quantidadeAnterior: number;
  quantidadeNova: number;
  motivo: string;
  reciboId?: string;
  recibo?: Recibo;
  responsavel: string;
  dataMovimentacao: string;
}

export interface ReciboConfirmacaoBackend {
  id: string;
  status: string;
  dataRecebimento?: string | null;

  unidadeEducacional: {
    id: string;
    nome: string;
    codigo: string;
    // adicione mais campos se houver
  };

  pedido: {
    numero: string;
    dataEntregaPrevista: string;
  };

  itens: {
    id: string;
    quantidadeSolicitada: number;
    observacoes?: string | null;
    itemPedido: {
      itemContrato: {
        nome: string;
        unidadeMedida: {
          sigla: string;
        };
      };
    };
  }[];

  assinaturaDigital?: {
    id: string;
    imagemBase64: string;
    criadoEm: string;
  } | null;

  fotoReciboAssinado?: {
    id: string;
    url: string;
    criadoEm: string;
  } | null;
}

export interface TipoEstudante {
  id: string;
  nome: string;
  sigla: string;
  categoria: "creche" | "escola";
  ordem: number;
}

export interface PercapitaItem {
  id: string;
  itemContratoId: string;
  itemContrato?: ItemContrato;
  tipoEstudanteId: string;
  tipoEstudante?: TipoEstudante;
  gramagemPorEstudante: number;
  frequenciaMensal: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

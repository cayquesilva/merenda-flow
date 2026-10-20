const API_BASE_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:3001"
}`;
import { User } from "@/types/auth";

// Tipagem parcial para os dados de criação/atualização de usuário.
type UsuarioData = Partial<
  Pick<User, "nome" | "email" | "categoria" | "ativo">
>;

// NOVO: Interface para o payload de dados ao criar/atualizar um Insumo.
// Define a estrutura exata do objeto que a API espera.
export interface InsumoPayload {
  contratoId: string;
  nome: string;
  unidadeMedidaId: string;
  quantidade: number;
  valorUnitario: number;
  saldo?: number; // O saldo é opcional, especialmente na criação.
}

// NOVO: Interface para um item individual dentro do payload do pedido.
export interface ItemPedidoAlmoxarifadoPayload {
  itemAlmoxarifadoId: string;
  unidadeEducacionalId: string;
  quantidade: number;
}

// NOVO: Interface para o payload completo do pedido de almoxarifado.
export interface PedidoAlmoxarifadoPayload {
  contratoId: string;
  dataEntregaPrevista: string; // A data vem como string do input
  valorTotal: number;
  itens: ItemPedidoAlmoxarifadoPayload[];
}

// ALTERAÇÃO: A estrutura de cada item enviado agora inclui o nome e a unidade.
export interface ItemEntradaPayload {
  nome: string;
  unidadeMedidaId: string;
  quantidade: number;
  valorUnitario?: number;
}

// A interface principal permanece a mesma, mas usará o novo ItemEntradaPayload
export interface EntradaAlmoxarifadoPayload {
  notaFiscal: string;
  dataEntrada: string;
  fornecedorId: string;
  valorTotal?: number;
  observacoes?: string;
  itens: ItemEntradaPayload[];
}

export interface InsumoCatalogoPayload {
  nome: string;
  descricao?: string;
  unidadeMedidaId: string;
}

export interface GuiaDeRemessaPayload {
  unidadeEducacionalId: string;
  itens: {
    insumoId: string;
    quantidadeEnviada: number;
  }[];
}

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Erro de rede ou resposta sem JSON" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      // No Content
      return null;
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, senha: string) {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    });
  }

  // Marca da plataforma (pública: usada também na tela de login).
  async getBranding() {
    return this.request("/api/configuracoes/branding");
  }

  async updateBranding(data: Record<string, string | null>) {
    return this.request("/api/configuracoes/branding", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async resetBranding() {
    return this.request("/api/configuracoes/branding", { method: "DELETE" });
  }

  // --- Assistente de voz (entradas e saídas de estoque) ---

  async getAssistenteStatus() {
    return this.request("/api/assistente/status");
  }

  // Envia o áudio gravado. Multipart: o fetch define o Content-Type sozinho.
  async assistenteVoz(audio: Blob, extensao: string, historico: unknown[], pendente: unknown) {
    const form = new FormData();
    form.append("audio", audio, `audio.${extensao}`);
    form.append("historico", JSON.stringify(historico));
    if (pendente) form.append("pendente", JSON.stringify(pendente));

    const response = await fetch(`${API_BASE_URL}/api/assistente/voz`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: form,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Erro de rede" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async assistenteTexto(texto: string, historico: unknown[], pendente: unknown) {
    return this.request("/api/assistente/texto", {
      method: "POST",
      body: JSON.stringify({ texto, historico, pendente }),
    });
  }

  async assistenteConfirmar(data: {
    estoqueId: string;
    tipo: string;
    quantidade: number;
    transcricao?: string;
  }) {
    return this.request("/api/assistente/confirmar", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Voz da resposta (mp3). Devolve o áudio para o chamador tocar.
  async assistenteFalar(texto: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/api/assistente/falar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.getAuthHeaders() },
      body: JSON.stringify({ texto }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.blob();
  }

  // Configuração da chave da OpenAI (administrador). A chave nunca volta: só o final.
  async getConfigAssistente() {
    return this.request("/api/configuracoes/assistente");
  }

  async updateConfigAssistente(data: {
    openaiApiKey?: string;
    removerChave?: boolean;
    modelo?: string;
  }) {
    return this.request("/api/configuracoes/assistente", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async testarConfigAssistente(openaiApiKey?: string) {
    return this.request("/api/configuracoes/assistente/testar", {
      method: "POST",
      body: JSON.stringify({ openaiApiKey }),
    });
  }

  // --- Auditoria (administrador) ---

  private paraQuery(params: Record<string, string | number | undefined>) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    });
    const texto = qs.toString();
    return texto ? `?${texto}` : "";
  }

  async getAuditoriaMovimentacoes(params: Record<string, string | number | undefined>) {
    return this.request(`/api/auditoria/movimentacoes${this.paraQuery(params)}`);
  }

  async getAcessosComoOutroUsuario(inicio?: string, fim?: string) {
    return this.request(`/api/auth/impersonacoes${this.paraQuery({ inicio, fim })}`);
  }

  // Baixa a auditoria de movimentações (CSV ou Excel) com os filtros atuais.
  // Devolve o total quando o servidor limitou a exportação.
  async downloadAuditoriaMovimentacoes(
    params: Record<string, string | number | undefined>,
    formato: "csv" | "xlsx"
  ): Promise<{ truncadoEm: number | null }> {
    const response = await fetch(
      `${API_BASE_URL}/api/auditoria/movimentacoes/exportar${this.paraQuery({ ...params, formato })}`,
      { headers: this.getAuthHeaders() }
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Erro de rede" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const url = URL.createObjectURL(await response.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria-estoque-${new Date().toISOString().slice(0, 10)}.${formato}`;
    a.click();
    URL.revokeObjectURL(url);

    const truncado = response.headers.get("X-Auditoria-Truncada");
    return { truncadoEm: truncado ? Number(truncado) : null };
  }

  async getProfile() {
    return this.request("/api/auth/me");
  }

  // Admin: acessa o sistema como outro usuário.
  async impersonate(userId: string) {
    return this.request(`/api/auth/impersonate/${userId}`, { method: "POST" });
  }

  // Admin: baixa a auditoria de impersonações em CSV.
  async downloadAuditoriaImpersonacao(inicio?: string, fim?: string) {
    const params = new URLSearchParams({ format: "csv" });
    if (inicio) params.set("inicio", inicio);
    if (fim) params.set("fim", fim);

    const response = await fetch(
      `${API_BASE_URL}/api/auth/impersonacoes?${params}`,
      { headers: this.getAuthHeaders() }
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Erro de rede" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const url = URL.createObjectURL(await response.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria-impersonacao-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // User endpoints
  async getUsuarios(search?: string) {
    const query = search ? `?q=${encodeURIComponent(search)}` : "";
    return this.request(`/api/usuarios${query}`);
  }

  async getUsuario(id: string) {
    return this.request(`/api/usuarios/${id}`);
  }

  async createUsuario(data: UsuarioData) {
    return this.request("/api/usuarios", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateUsuario(id: string, data: Partial<UsuarioData>) {
    return this.request(`/api/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteUsuario(id: string) {
    return this.request(`/api/usuarios/${id}`, {
      method: "DELETE",
    });
  }

  // --- NOVOS MÉTODOS ADICIONADOS ---

  // COMENTÁRIO: Método para buscar a lista de todas as unidades educacionais ativas.
  // Ele chama a rota GET /api/unidades-ativas que já existe no backend.
  async getUnidadesAtivas() {
    return this.request("/api/unidades-ativas");
  }

  //Recebe todas as unidades
  async getUnidades(search?: string) {
    const query = search ? `?q=${encodeURIComponent(search)}` : "";
    return this.request(`/api/unidades${query}`);
  }

  //Recebe data da ultima importação
  async getUnidadesUltimaImportacao() {
    return this.request("/api/unidades/data/ultima-importacao");
  }

  // COMENTÁRIO: Método para vincular uma unidade a um usuário.
  // Ele chama a rota POST /api/usuarios/:userId/unidades que foi criada no backend.
  async linkUnidadeToUsuario(userId: string, unidadeId: string) {
    return this.request(`/api/usuarios/${userId}/unidades`, {
      method: "POST",
      body: JSON.stringify({ unidadeId }),
    });
  }

  // COMENTÁRIO: Método para desvincular uma unidade de um usuário.
  // Ele chama a rota DELETE /api/usuarios/:userId/unidades/:unidadeId do backend.
  async unlinkUnidadeFromUsuario(userId: string, unidadeId: string) {
    return this.request(`/api/usuarios/${userId}/unidades/${unidadeId}`, {
      method: "DELETE",
    });
  }

  // COMENTÁRIO: Adicionado método para buscar as estatísticas dos recibos.
  // Ele chama a rota GET /api/recibos/stats.
  async getRecibosStats() {
    return this.request("/api/recibos/stats");
  }

  // COMENTÁRIO: Adicionado método para buscar a lista de recibos com filtros.
  // Ele chama a rota GET /api/recibos com os parâmetros de busca e status.
  async getRecibos(q: string, status: string) {
    const params = new URLSearchParams({ q, status });
    return this.request(`/api/recibos?${params.toString()}`);
  }

  // COMENTÁRIO: Busca as unidades já com o tipo de estoque (creche/escola) definido.
  async getUnidadesComTipoEstoque() {
    return this.request("/api/unidades-com-tipo-estoque");
  }

  // COMENTÁRIO: Busca o estoque consolidado com base nos filtros.
  async getEstoqueConsolidado(params: URLSearchParams) {
    return this.request(`/api/estoque/consolidado?${params.toString()}`);
  }

  // COMENTÁRIO: Busca as movimentações de estoque com base nos filtros.
  async getEstoqueMovimentacoes(params: URLSearchParams) {
    return this.request(`/api/estoque/movimentacoes?${params.toString()}`);
  }

  // COMENTÁRIO: Cria uma nova movimentação de estoque.
  async createMovimentacaoEstoque(payload) {
    return this.request("/api/estoque/movimentacao", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // NOVO: Método para buscar os dados de um recibo para a página de confirmação.
  async getReciboForConfirmacao(id: string) {
    return this.request(`/api/recibos/confirmacao/${id}`);
  }

  async postSaidaEstoqueQRCode(estoqueId: string, quantidade: number) {
    return this.request(`/api/estoque/saida-qrcode/${estoqueId}`, {
      method: "POST",
      body: JSON.stringify({ quantidade }),
    });
  }

  // NOVO: Faz o POST da planilha de percápita para o backend
  async importPercapitas(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    // Nota: O método 'request' precisa ser ajustado para lidar com FormData
    // Por enquanto, faremos uma chamada fetch direta aqui.
    const url = `${API_BASE_URL}/api/percapita/importar`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...this.getAuthHeaders(), // Reutiliza o método para pegar o token
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Erro de rede" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // NOVO: Método para buscar a lista de contratos ativos (simplificada)
  async getContratosAtivosLista() {
    return this.request("/api/contratos-ativos");
  }

  // --- MÉTODOS PARA ALMOXARIFADO - INSUMOS ---

  // NOVO: Busca a lista de insumos com filtro de busca
  async getInsumos(search?: string) {
    const query = search ? `?q=${encodeURIComponent(search)}` : "";
    return this.request(`/api/almoxarifado/insumos${query}`);
  }

  // NOVO: Busca a lista de contratos ATIVOS do tipo 'almoxarifado'
  async getContratosAlmoxarifadoAtivos() {
    return this.request("/api/contratos-ativos?tipo=almoxarifado");
  }

  // NOVO: Busca todas as unidades de medida
  async getUnidadesMedida() {
    return this.request("/api/unidades-medida");
  }

  // NOVO: Busca a lista de pedidos de almoxarifado com filtros
  async getPedidosAlmoxarifado(q: string, status: string) {
    const params = new URLSearchParams({ q, status });
    return this.request(`/api/almoxarifado/pedidos?${params.toString()}`);
  }

  // NOVO: Busca os detalhes de um pedido de almoxarifado
  async getPedidoAlmoxarifadoById(id: string) {
    return this.request(`/api/almoxarifado/pedidos/${id}`);
  }

  // NOVO: Cria um novo pedido de almoxarifado
  async createPedidoAlmoxarifado(payload: PedidoAlmoxarifadoPayload) {
    // Idealmente, criar uma interface para o payload
    return this.request("/api/almoxarifado/pedidos", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // NOVO: Busca insumos de um contrato específico para o formulário de pedido
  async getInsumosPorContrato(contratoId: string) {
    return this.request(`/api/almoxarifado/insumos?contratoId=${contratoId}`);
  }

  // NOVO: Busca a lista simplificada de fornecedores ativos
  async getFornecedoresLista() {
    return this.request("/api/fornecedores/lista");
  }

  // NOVO: Registra uma nova entrada de estoque no almoxarifado
  async createEntradaAlmoxarifado(payload: EntradaAlmoxarifadoPayload) {
    // Idealmente, criar uma interface para este payload
    return this.request("/api/almoxarifado/entradas", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // NOVO: Busca a lista de entradas de estoque com filtro de busca
  async getEntradasAlmoxarifado(search?: string) {
    const query = search ? `?q=${encodeURIComponent(search)}` : "";
    return this.request(`/api/almoxarifado/entradas${query}`);
  }

  // NOVO: Busca os detalhes de uma única entrada de estoque pelo ID
  async getEntradaAlmoxarifadoById(id: string) {
    return this.request(`/api/almoxarifado/entradas/${id}`);
  }

  // NOVO: "Ajusta" uma entrada de estoque, criando uma nova versão corrigida.
  async ajustarEntradaAlmoxarifado(
    id: string,
    payload: EntradaAlmoxarifadoPayload
  ) {
    return this.request(`/api/almoxarifado/entradas/${id}/ajustar`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  
   async createInsumo(data: InsumoCatalogoPayload) {
    return this.request("/api/almoxarifado/insumos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // NOVO: Atualiza um insumo do catálogo
  async updateInsumo(id: string, data: Partial<InsumoCatalogoPayload>) {
    return this.request(`/api/almoxarifado/insumos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // NOVO: Deleta um insumo do catálogo
  async deleteInsumo(id: string) {
    return this.request(`/api/almoxarifado/insumos/${id}`, {
      method: "DELETE",
    });
  }

   // NOVO: Busca o estado atual do Estoque Central
  async getEstoqueCentral(search?: string) {
    const query = search ? `?q=${encodeURIComponent(search)}` : "";
    return this.request(`/api/almoxarifado/estoque-central${query}`);
  }
  
  // NOVO: Cria uma nova Guia de Remessa
  async createGuiaDeRemessa(payload: GuiaDeRemessaPayload) {
    return this.request('/api/almoxarifado/guias-remessa', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

}

export const apiService = new ApiService();

const API_BASE_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:3001"
}`;
import { User } from "@/types/auth";

// Tipagem parcial para os dados de criação/atualização de usuário.
type UsuarioData = Partial<
  Pick<User, "nome" | "email" | "categoria" | "ativo">
>;

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

  async getProfile() {
    return this.request("/api/auth/me");
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
}

export const apiService = new ApiService();

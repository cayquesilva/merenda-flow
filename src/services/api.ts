const API_BASE_URL = 'http://localhost:3001';

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro de rede' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, senha: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
  }

  async getProfile() {
    return this.request('/api/auth/me');
  }

  // User endpoints
  async getUsuarios(search?: string) {
    const query = search ? `?q=${encodeURIComponent(search)}` : '';
    return this.request(`/api/usuarios${query}`);
  }

  async getUsuario(id: string) {
    return this.request(`/api/usuarios/${id}`);
  }

  async createUsuario(data: any) {
    return this.request('/api/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUsuario(id: string, data: any) {
    return this.request(`/api/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUsuario(id: string) {
    return this.request(`/api/usuarios/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Muitas telas chamam a API com fetch direto, sem passar pelo apiService, e por isso nunca
// enviavam o token de login (o erro aparecia como "401 Token de acesso requerido" nas rotas
// protegidas). Esta função faz toda chamada para a API levar o token do usuário logado,
// sem alterar quem já informa o próprio Authorization.
export function enviarTokenNasRequisicoes() {
  const fetchOriginal = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith(API_BASE_URL)) return fetchOriginal(input, init);

    let token: string | null = null;
    try {
      token = localStorage.getItem("token");
    } catch {
      // localStorage indisponível: segue sem token
    }
    if (!token) return fetchOriginal(input, init);

    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    return fetchOriginal(input, { ...init, headers });
  };
}

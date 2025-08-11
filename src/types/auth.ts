export interface UnidadeEducacional {
  id: string;
  nome: string;
  codigo: string;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  categoria: UserCategory;
  ativo: boolean;
  createdAt: string;
  unidadesEducacionais?: UnidadeEducacional[];
}

export type UserCategory =
  | "administracao_tecnica"
  | "gerencia_nutricao"
  | "comissao_recebimento"
  | "nutricionistas_externas";

export interface Permission {
  module: string;
  actions: string[];
}

export interface UserPermissions {
  [key: string]: Permission;
}

export type ModuleName =
  | "dashboard"
  | "contratos"
  | "fornecedores"
  | "unidades"
  | "pedidos"
  | "recibos"
  | "confirmacoes"
  | "estoque"
  | "relatorios"
  | "usuarios"
  | "percapita";

export type ModuleAction = "create" | "update" | "read" | "write" | "delete"; // ou qualquer outro conjunto que você usa

export interface ModulePermission {
  module: ModuleName;
  actions: ModuleAction[];
}

export interface CategoryPermissions {
  label: string;
  permissions: Partial<Record<ModuleName, ModulePermission>>;
}

export const USER_CATEGORIES: Partial<
  Record<UserCategory, CategoryPermissions>
> = {
  administracao_tecnica: {
    label: "Administração Técnica",
    permissions: {
      dashboard: { module: "dashboard", actions: ["read"] },
      contratos: {
        module: "contratos",
        actions: ["read", "create", "update", "delete"],
      },
      fornecedores: {
        module: "fornecedores",
        actions: ["read", "create", "update", "delete"],
      },
      unidades: {
        module: "unidades",
        actions: ["read", "create", "update", "delete"],
      },
      pedidos: {
        module: "pedidos",
        actions: ["read", "create", "update", "delete"],
      },
      recibos: {
        module: "recibos",
        actions: ["read", "create", "update", "delete"],
      },
      confirmacoes: {
        module: "confirmacoes",
        actions: ["read", "create", "update", "delete"],
      },
      estoque: {
        module: "estoque",
        actions: ["read", "create", "update", "delete"],
      },
      relatorios: {
        module: "relatorios",
        actions: ["read", "create", "update", "delete"],
      },
      usuarios: {
        module: "usuarios",
        actions: ["read", "create", "update", "delete"],
      },
      percapita: {
        module: "percapita",
        actions: ["read", "create", "update", "delete"],
      },
    },
  },
  gerencia_nutricao: {
    label: "Gerência de Nutrição",
    permissions: {
      dashboard: { module: "dashboard", actions: ["read"] },
      contratos: { module: "contratos", actions: ["read", "create", "update"] },
      fornecedores: {
        module: "fornecedores",
        actions: ["read", "create", "update"],
      },
      unidades: { module: "unidades", actions: ["read", "create", "update"] },
      pedidos: { module: "pedidos", actions: ["read", "create", "update"] },
      recibos: { module: "recibos", actions: ["read", "create", "update"] },
      confirmacoes: { module: "confirmacoes", actions: ["read"] },
      estoque: { module: "estoque", actions: ["read", "update"] },
      relatorios: { module: "relatorios", actions: ["read", "create"] },
      percapita: {
        module: "percapita",
        actions: ["read", "create", "update", "delete"],
      },
    },
  },
  comissao_recebimento: {
    label: "Comissão de Recebimento",
    permissions: {
      dashboard: { module: "dashboard", actions: ["read"] },
      recibos: { module: "recibos", actions: ["read"] },
      estoque: { module: "estoque", actions: ["read"] },
    },
  },
  // NOVO: Adicionada a categoria 'nutricionistas_externas' com suas permissões específicas.
  nutricionistas_externas: {
    label: "Nutricionistas Externas",
    permissions: {
      dashboard: { module: "dashboard", actions: ["read"] },
      recibos: { module: "recibos", actions: ["read"] },
      estoque: { module: "estoque", actions: ["read", "create", "update"] }, // create/update para movimentações
      relatorios: { module: "relatorios", actions: ["read"] },
    },
  },
} as const;

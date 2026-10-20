import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  ShoppingCart,
  Receipt,
  CheckCircle,
  BarChart3,
  Shield,
  Package,
  Calculator,
  Warehouse,
  Palette,
  ClipboardList,
  Mic,
  LogIn,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  // Rótulo curto para a barra inferior do mobile.
  shortTitle?: string;
  url: string;
  icon: LucideIcon;
  module: string;
}

export interface NavSection {
  group: string;
  icon?: LucideIcon;
  items: NavItem[];
}

// Itens de navegação compartilhados entre a sidebar (desktop) e a barra inferior (mobile).
export const navigationItems: NavSection[] = [
  {
    group: "Principal",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
        module: "dashboard",
      },
    ],
  },
  {
    group: "Cadastros",
    items: [
      {
        title: "Fornecedores",
        url: "/fornecedores",
        icon: Users,
        module: "fornecedores",
      },
      {
        title: "Unidades",
        url: "/unidades",
        icon: Building2,
        module: "unidades",
      },
      {
        title: "Contratos",
        url: "/contratos",
        icon: FileText,
        module: "contratos",
      },
      {
        title: "Per cápita",
        url: "/percapita",
        icon: Calculator,
        module: "percapita",
      },
    ],
  },
  {
    group: "Operações",
    items: [
      {
        title: "Pedidos",
        url: "/pedidos",
        icon: ShoppingCart,
        module: "pedidos",
      },
      { title: "Recibos", url: "/recibos", icon: Receipt, module: "recibos" },
      {
        title: "Confirmações",
        url: "/confirmacoes",
        icon: CheckCircle,
        module: "confirmacao_relatorio",
      },
      { title: "Estoque", url: "/estoque", icon: Package, module: "estoque" },
      {
        title: "Assistente de voz",
        shortTitle: "Voz",
        url: "/assistente",
        icon: Mic,
        module: "assistente",
      },
    ],
  },
  {
    group: "Almoxarifado",
    icon: Warehouse, // Ícone para o grupo
    items: [
      {
        title: "Registrar Entradas",
        shortTitle: "Entradas",
        url: "/almoxarifado/entradas",
        icon: LogIn, // Ícone de entrada
        module: "almoxarifado",
      },
      {
        title: "Catálogo de Insumos",
        shortTitle: "Catálogo",
        url: "/almoxarifado/catalogo",
        icon: BookOpen, // Ícone de catálogo
        module: "almoxarifado",
      },
      // Adicionaremos os links de Recibos e Estoque aqui futuramente
    ],
  },
  {
    group: "Relatórios",
    items: [
      {
        title: "Relatórios",
        url: "/relatorios",
        icon: BarChart3,
        module: "relatorios",
      },
    ],
  },
  {
    group: "Administração",
    items: [
      {
        title: "Usuários",
        url: "/usuarios",
        icon: Shield,
        module: "usuarios",
      },
      {
        title: "Auditoria",
        url: "/auditoria",
        icon: ClipboardList,
        module: "auditoria",
      },
      {
        title: "Configurações",
        url: "/configuracoes",
        icon: Palette,
        module: "configuracoes",
      },
    ],
  },
];

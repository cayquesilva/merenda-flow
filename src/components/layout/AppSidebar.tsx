import { useState } from "react";
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
  LogOut,
  ChevronDown,
  ChevronRight,
  Package,
  Calculator,
  Warehouse,
  Box,
  LogIn,
  BookOpen,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ModuleName } from "@/types/auth";

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, canAccessModule, logout } = useAuth();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    "Principal",
    "Cadastros",
    "Operações",
    "Almoxarifado",
  ]);

  const navigationItems = [
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
      ],
    },
    {
      group: "Almoxarifado",
      icon: Warehouse, // Ícone para o grupo
      items: [
        {
          title: "Registrar Entradas",
          url: "/almoxarifado/entradas",
          icon: LogIn, // Ícone de entrada
          module: "almoxarifado",
        },
        {
          title: "Catálogo de Insumos",
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
      ],
    },
  ];

  const isActive = (path: string) => currentPath === path;

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((g) => g !== groupName)
        : [...prev, groupName]
    );
  };

  const getNavClassName = (path: string) => {
    return isActive(path)
      ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/20 rounded-lg transition-all"
      : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground font-medium rounded-lg transition-all duration-150";
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="gap-1 px-2 py-3">
        {!collapsed && (
          <div className="px-3 py-3 mb-2 rounded-xl bg-sidebar-accent/40 border border-sidebar-border/50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-base shadow-sm">
                🥗
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-sidebar-foreground tracking-tight leading-tight truncate">
                  Merenda Flow
                </h2>
                <p className="text-xs text-sidebar-foreground/70 font-medium truncate">
                  Gestão de Alimentação Escolar
                </p>
              </div>
            </div>
          </div>
        )}

        {navigationItems.map((section) => {
          const isExpanded = expandedGroups.includes(section.group);
          const hasActiveItem = section.items.some(
            (item) =>
              isActive(item.url) && canAccessModule(item.module as ModuleName)
          );

          return (
            <SidebarGroup key={section.group} className="py-1">
              {!collapsed && (
                <SidebarGroupLabel
                  className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 px-2 py-1 rounded-md text-xs uppercase tracking-wider font-semibold text-sidebar-foreground/60 transition-colors"
                  onClick={() => toggleGroup(section.group)}
                >
                  <span
                    className={
                      hasActiveItem
                        ? "text-primary font-bold"
                        : "text-sidebar-foreground/70"
                    }
                  >
                    {section.group}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/60" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground/60" />
                  )}
                </SidebarGroupLabel>
              )}

              {(collapsed || isExpanded) && (
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
                    {section.items.map(
                      (item) =>
                        canAccessModule(item.module as ModuleName) && (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild>
                              <NavLink
                                to={item.url}
                                end
                                className={getNavClassName(item.url)}
                              >
                                <item.icon
                                  className={`h-4 w-4 shrink-0 ${
                                    isActive(item.url)
                                      ? "text-primary-foreground"
                                      : "text-sidebar-foreground/70"
                                  }`}
                                />
                                {!collapsed && (
                                  <span className="truncate">
                                    {item.title}
                                  </span>
                                )}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border/60 gap-2">
        <ThemeToggle collapsed={collapsed} />
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start text-sidebar-foreground/80 hover:bg-destructive/15 hover:text-destructive rounded-lg transition-colors font-medium"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
        {!collapsed && user && (
          <div className="px-3 py-2.5 rounded-xl bg-sidebar-accent/50 border border-sidebar-border/60">
            <p className="font-semibold text-sidebar-foreground text-sm truncate">
              {user.nome}
            </p>
            <p className="text-xs text-sidebar-foreground/70 truncate">{user.email}</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

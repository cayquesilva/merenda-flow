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
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary focus:text-accent"
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent className="gap-0">
        {!collapsed && (
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-sidebar-foreground tracking-tight">
              Sistema Merenda
            </h2>
            <p className="text-sm text-sidebar-foreground/70">
              Gestão de Contratos
            </p>
          </div>
        )}

        {navigationItems.map((section) => {
          const isExpanded = expandedGroups.includes(section.group);
          const hasActiveItem = section.items.some(
            (item) =>
              isActive(item.url) && canAccessModule(item.module as ModuleName)
          );

          return (
            <SidebarGroup key={section.group}>
              {!collapsed && (
                <SidebarGroupLabel
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/50 px-2 py-1 rounded-md"
                  onClick={() => toggleGroup(section.group)}
                >
                  <span
                    className={
                      hasActiveItem
                        ? "text-sidebar-foreground/90 font-medium"
                        : ""
                    }
                  >
                    {section.group}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </SidebarGroupLabel>
              )}

              {(collapsed || isExpanded) && (
                <SidebarGroupContent>
                  <SidebarMenu>
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
                                <item.icon className="h-4 w-4 shrink-0 text-sidebar-foreground/70" />
                                {!collapsed && (
                                  <span className="text-sidebar-foreground/70">
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

      <SidebarFooter className="p-2">
        <ThemeToggle collapsed={collapsed} />
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2 rounded-lg bg-sidebar-accent/50 border border-sidebar-border">
            <p className="font-medium text-sidebar-foreground text-sm">
              {user.nome}
            </p>
            <p className="text-xs text-sidebar-foreground/70">{user.email}</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

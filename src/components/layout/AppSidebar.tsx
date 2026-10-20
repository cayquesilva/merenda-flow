import { useState } from "react";
import { LogOut, ChevronDown, ChevronRight } from "lucide-react";
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
import { navigationItems } from "./navigation";
import { BrandLogo } from "./BrandLogo";
import { useBranding } from "@/contexts/BrandingContext";

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, canAccessModule, logout } = useAuth();
  const { branding } = useBranding();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  // Sanfona: o menu nasce fechado e só um grupo fica aberto por vez, o que evita a barra de
  // rolagem. O grupo continua aberto ao navegar; ao recarregar a página volta tudo fechado.
  const [grupoAberto, setGrupoAberto] = useState<string | null>(null);

  const isActive = (path: string) => currentPath === path;

  const toggleGroup = (groupName: string) => {
    setGrupoAberto((atual) => (atual === groupName ? null : groupName));
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
              <BrandLogo className="h-8 w-8 shrink-0 rounded-lg font-bold text-base shadow-sm" />
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-sidebar-foreground tracking-tight leading-tight truncate">
                  {branding.nomePlataforma}
                </h2>
                <p className="text-xs text-sidebar-foreground/70 font-medium truncate">
                  {branding.subtitulo}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grupos sem nenhum item acessível ao perfil não aparecem. */}
        {navigationItems
          .filter((section) =>
            section.items.some((item) => canAccessModule(item.module as ModuleName))
          )
          .map((section) => {
          const isExpanded = grupoAberto === section.group;
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

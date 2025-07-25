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
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    group: "Principal",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
    ]
  },
  {
    group: "Cadastros",
    items: [
      { title: "Contratos", url: "/contratos", icon: FileText },
      { title: "Fornecedores", url: "/fornecedores", icon: Users },
      { title: "Unidades", url: "/unidades", icon: Building2 },
    ]
  },
  {
    group: "Operações",
    items: [
      { title: "Pedidos", url: "/pedidos", icon: ShoppingCart },
      { title: "Recibos", url: "/recibos", icon: Receipt },
      { title: "Confirmações", url: "/confirmacoes", icon: CheckCircle },
    ]
  },
  {
    group: "Relatórios",
    items: [
      { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
    ]
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Principal", "Cadastros", "Operações"]);

  const isActive = (path: string) => currentPath === path;
  
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };

  const getNavClassName = (path: string) => {
    return isActive(path) 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent className="gap-0">
        {!collapsed && (
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-foreground">
              Sistema Merenda
            </h2>
            <p className="text-sm text-muted-foreground">
              Gestão de Contratos
            </p>
          </div>
        )}
        
        {navigationItems.map((section) => {
          const isExpanded = expandedGroups.includes(section.group);
          const hasActiveItem = section.items.some(item => isActive(item.url));
          
          return (
            <SidebarGroup key={section.group}>
              {!collapsed && (
                <SidebarGroupLabel 
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/50 px-2 py-1 rounded-md"
                  onClick={() => toggleGroup(section.group)}
                >
                  <span className={hasActiveItem ? "text-primary font-medium" : ""}>{section.group}</span>
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
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink 
                            to={item.url} 
                            end 
                            className={getNavClassName(item.url)}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background transition-colors duration-250">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-border/80 bg-card/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="hover:bg-muted p-2 rounded-lg transition-colors" />
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground">
                Sistema de Gestão de Contratos de Merenda
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle collapsed={true} />
            </div>
          </header>
          
          <main className="flex-1 p-6 md:p-8 overflow-auto bg-background/50">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
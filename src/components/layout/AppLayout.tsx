import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { MobileBottomNav } from "./MobileBottomNav";
import { useBranding } from "@/contexts/BrandingContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { branding } = useBranding();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background transition-colors duration-250">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-0 z-20">
          <ImpersonationBanner />
          <header className="h-14 md:h-16 border-b border-border/80 bg-card/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shadow-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="hidden md:inline-flex hover:bg-muted p-2 rounded-lg transition-colors" />
              <h1 className="text-base md:text-xl font-bold tracking-tight text-foreground truncate">
                {branding.nomePlataforma}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle collapsed={true} />
            </div>
          </header>
          </div>
          
          <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8 overflow-auto bg-background/50">
            {children}
          </main>
          <MobileBottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
}
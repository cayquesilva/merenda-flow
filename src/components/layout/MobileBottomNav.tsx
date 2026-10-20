import { useEffect, useState } from "react";
import { Loader2, LogOut, Menu, Square } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ModuleName } from "@/types/auth";
import { cn } from "@/lib/utils";
import { navigationItems } from "./navigation";

const MAX_ATALHOS = 4;

// Barra de navegação fixa no rodapé (somente mobile), no estilo de app nativo.
// Mostra os primeiros módulos que o perfil pode acessar e um botão "Menu"
// que abre um bottom sheet com todos os módulos, tema e sair.
export function MobileBottomNav() {
  const { user, canAccessModule, logout } = useAuth();
  const { isMobile } = useSidebar();
  const { pathname } = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  // O assistente de voz informa seu estado: o botão central vira o microfone da tela
  // (verde = pronto, vermelho = gravando, giratório = processando).
  const [voz, setVoz] = useState<"parado" | "gravando" | "processando">("parado");
  useEffect(() => {
    const aoMudar = (e: Event) => setVoz((e as CustomEvent).detail?.voz ?? "parado");
    window.addEventListener("assistente:estado", aoMudar);
    return () => window.removeEventListener("assistente:estado", aoMudar);
  }, []);

  if (!isMobile) return null;

  const secoes = navigationItems
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        canAccessModule(item.module as ModuleName)
      ),
    }))
    .filter((section) => section.items.length > 0);

  const todos = secoes.flatMap((s) => s.items);
  // Quem usa o assistente de voz (merendeiras) ganha o microfone em destaque no centro.
  const microfone = todos.find((item) => item.url === "/assistente");
  const atalhos = todos
    .filter((item) => item.url !== "/assistente")
    .slice(0, microfone ? MAX_ATALHOS - 1 : MAX_ATALHOS);
  // Com microfone: 2 atalhos à esquerda, microfone no meio, o restante + Menu à direita.
  const esquerda = microfone ? atalhos.slice(0, 2) : atalhos;
  const direita = microfone ? atalhos.slice(2) : [];

  const renderAtalho = (item: (typeof todos)[number]) => (
    <NavLink
      key={item.url}
      to={item.url}
      end
      className={itemClass(pathname === item.url)}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      <span className="w-full truncate px-1 text-center">
        {item.shortTitle ?? item.title}
      </span>
    </NavLink>
  );

  const itemClass = (active: boolean) =>
    cn(
      "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
      active ? "text-primary" : "text-muted-foreground"
    );

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Navegação principal"
      >
        {esquerda.map(renderAtalho)}
        {microfone && (
          <NavLink
            to={microfone.url}
            end
            aria-label="Falar com o assistente de voz"
            // Já na tela do assistente, o botão central grava/envia em vez de navegar.
            onClick={(e) => {
              if (pathname === microfone.url) {
                e.preventDefault();
                window.dispatchEvent(new Event("assistente:microfone"));
              }
            }}
            className="flex min-w-0 flex-1 flex-col items-center justify-start gap-0.5 pb-1.5 text-[11px] font-semibold text-primary"
          >
            <span
              className={cn(
                "-mt-6 flex h-16 w-16 items-center justify-center rounded-full border-4 border-background text-primary-foreground shadow-lg transition-colors active:scale-95",
                voz === "gravando" ? "bg-destructive" : "bg-primary",
                pathname === microfone.url && voz === "parado" && "ring-2 ring-primary/40"
              )}
            >
              {voz === "gravando" ? (
                <Square className="h-6 w-6 fill-current" />
              ) : voz === "processando" ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : (
                <microfone.icon className="h-7 w-7" />
              )}
            </span>
            <span className={voz === "gravando" ? "text-destructive" : undefined}>
              {voz === "gravando" ? "Enviar" : voz === "processando" ? "Aguarde" : "Falar"}
            </span>
          </NavLink>
        )}
        {direita.map(renderAtalho)}
        <button
          type="button"
          onClick={() => setMenuAberto(true)}
          className={itemClass(menuAberto)}
        >
          <Menu className="h-5 w-5 shrink-0" />
          <span>Menu</span>
        </button>
      </nav>

      <Drawer
        open={menuAberto}
        onOpenChange={setMenuAberto}
        shouldScaleBackground={false}
      >
        <DrawerContent className="max-h-[85dvh]">
          <DrawerHeader className="pb-2 text-left">
            <DrawerTitle>Menu</DrawerTitle>
            <DrawerDescription className="truncate">
              {user?.nome} · {user?.email}
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-4 overflow-y-auto px-4 pb-2">
            {secoes.map((section) => (
              <div key={section.group}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.group}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {section.items.map((item) => {
                    const ativo = pathname === item.url;
                    return (
                      <NavLink
                        key={item.url}
                        to={item.url}
                        end
                        onClick={() => setMenuAberto(false)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center text-xs font-medium transition-colors",
                          ativo
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground active:bg-muted"
                        )}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        <span className="line-clamp-2 leading-tight">
                          {item.title}
                        </span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div
            className="flex items-center gap-2 border-t border-border px-4 pt-3"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
          >
            <div className="flex-1">
              <ThemeToggle collapsed={false} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="flex-1 justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

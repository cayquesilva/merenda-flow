import { Eye, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { USER_CATEGORIES } from "@/types/auth";

export function ImpersonationBanner() {
  const { user, isImpersonating, stopImpersonating } = useAuth();

  if (!isImpersonating || !user) return null;

  return (
    <div className="flex items-center justify-between gap-2 bg-amber-500 px-4 py-1.5 text-sm font-medium text-amber-950">
      <div className="flex min-w-0 items-center gap-2">
        <Eye className="h-4 w-4 shrink-0" />
        <span className="truncate">
          Acessando como <strong>{user.nome}</strong>
          <span className="hidden sm:inline">
            {" "}
            ({USER_CATEGORIES[user.categoria]?.label ?? user.categoria})
          </span>
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={stopImpersonating}
        className="h-7 shrink-0 border-amber-950/40 bg-transparent px-2 text-amber-950 hover:bg-amber-600/40"
      >
        <LogOut className="mr-1 h-3.5 w-3.5" />
        Voltar ao admin
      </Button>
    </div>
  );
}

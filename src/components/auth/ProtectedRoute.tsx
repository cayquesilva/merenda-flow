import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { ModuleAction, ModuleName } from "@/types/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  module: string;
  action?: string;
}

export function ProtectedRoute({
  children,
  module,
  action = "read",
}: ProtectedRouteProps) {
  const { user, canAccessModule, hasPermission } = useAuth();

  if (!user) {
    return null; // This will be handled by the main App component
  }

  if (!canAccessModule(module as ModuleName)) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta funcionalidade.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!hasPermission(module as ModuleName, action as ModuleAction)) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para realizar esta ação.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}

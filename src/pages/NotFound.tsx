import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md p-8 rounded-2xl bg-card border border-border shadow-lg space-y-4">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/15 text-primary flex items-center justify-center text-2xl font-bold">
          404
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Página não encontrada
        </h1>
        <p className="text-muted-foreground text-sm">
          A rota solicitada não existe ou foi movida.
        </p>
        <div className="pt-2">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Voltar ao Início
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

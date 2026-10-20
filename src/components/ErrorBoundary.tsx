import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  erro: Error | null;
}

// Evita a "tela branca": se algum componente quebrar ao desenhar, mostra uma mensagem
// com opção de tentar de novo ou recarregar, em vez de derrubar o app inteiro.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null };

  static getDerivedStateFromError(erro: Error): State {
    return { erro };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error("Erro de interface:", erro, info.componentStack);
  }

  render() {
    if (!this.state.erro) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-sm space-y-4 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-warning" />
          <h1 className="text-xl font-bold text-foreground">Algo deu errado</h1>
          <p className="text-muted-foreground">
            A tela não conseguiu carregar. Toque em recarregar para continuar.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Recarregar
            </Button>
            <Button variant="outline" onClick={() => this.setState({ erro: null })}>
              Tentar de novo
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

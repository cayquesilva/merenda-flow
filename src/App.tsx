import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginForm } from "./components/auth/LoginForm";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Contratos from "./pages/Contratos";
import Fornecedores from "./pages/Fornecedores";
import Unidades from "./pages/Unidades";
import Pedidos from "./pages/Pedidos";
import Recibos from "./pages/Recibos";
import Confirmacoes from "./pages/Confirmacoes";
import Relatorios from "./pages/Relatorios";
import Usuarios from "./pages/Usuarios";
import Estoque from "./pages/Estoque";
import ConfirmacaoRecebimento from "./pages/ConfirmacaoRecebimento";
import NotFound from "./pages/NotFound";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "./components/ui/badge";
import SaidaEstoqueQRCode from "./pages/SaidaEstoqueQRCode";

const queryClient = new QueryClient();

function DatabaseConnectionTest() {
  const [dbStatus, setDbStatus] = useState(
    "Testando conexão com o banco de dados..."
  );
  const [isLoading, setIsLoading] = useState(true); // Novo estado para controlar o carregamento

  useEffect(() => {
    // Função para chamar a API
    const testConnection = async () => {
      setIsLoading(true); // Inicia o carregamento
      try {
        const response = await fetch("http://localhost:3001/api/test-db");
        if (!response.ok) {
          throw new Error("A resposta da rede não foi OK");
        }
        const data = await response.json();
        // Verifica se a resposta do backend indica sucesso
        if (data.status === "sucesso") {
          setDbStatus(`Sistema Online`);
        } else {
          setDbStatus(
            `Falha na conexão: ${data.message || "Erro desconhecido."}`
          );
        }
      } catch (error) {
        console.error("Erro ao buscar dados da API:", error);
        setDbStatus(
          `Falha na conexão: Verifique se a API e o DB estão rodando.`
        );
      } finally {
        setIsLoading(false); // Finaliza o carregamento
      }
    };

    testConnection();
  }, []); // O array vazio garante que o useEffect rode apenas uma vez

  // Determina se a conexão está online com base na mensagem de status
  const isOnline = dbStatus === "Sistema Online";

  return (
    <div className="flex flex-col items-center justify-center min-h-[50px] p-4">
      <div className="flex items-center gap-2">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        ) : (
          <Badge variant="outline" className="flex items-center gap-1">
            <div
              className={`w-3 h-3 rounded-full ${
                isOnline ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            {isOnline ? "Online" : "Offline"}
          </Badge>
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <LoginForm />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute module="dashboard">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contratos"
          element={
            <ProtectedRoute module="contratos">
              <Contratos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fornecedores"
          element={
            <ProtectedRoute module="fornecedores">
              <Fornecedores />
            </ProtectedRoute>
          }
        />
        <Route
          path="/unidades"
          element={
            <ProtectedRoute module="unidades">
              <Unidades />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pedidos"
          element={
            <ProtectedRoute module="pedidos">
              <Pedidos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recibos"
          element={
            <ProtectedRoute module="recibos">
              <Recibos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/confirmacoes"
          element={
            <ProtectedRoute module="confirmacoes">
              <Confirmacoes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estoque"
          element={
            <ProtectedRoute module="estoque">
              <Estoque />
            </ProtectedRoute>
          }
        />
        <Route
          path="/relatorios"
          element={
            <ProtectedRoute module="relatorios">
              <Relatorios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute module="usuarios">
              <Usuarios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/confirmacao-recebimento/:id"
          element={<ConfirmacaoRecebimento />}
        />
        <Route
          path="/saida-estoque-qrcode/:estoqueId"
          element={<SaidaEstoqueQRCode />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <DatabaseConnectionTest />
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

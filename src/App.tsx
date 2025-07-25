import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Contratos from "./pages/Contratos";
import Fornecedores from "./pages/Fornecedores";
import Unidades from "./pages/Unidades";
import Pedidos from "./pages/Pedidos";
import Recibos from "./pages/Recibos";
import Confirmacoes from "./pages/Confirmacoes";
import Relatorios from "./pages/Relatorios";
import ConfirmacaoRecebimento from "./pages/ConfirmacaoRecebimento";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/contratos" element={<Contratos />} />
            <Route path="/fornecedores" element={<Fornecedores />} />
            <Route path="/unidades" element={<Unidades />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/recibos" element={<Recibos />} />
            <Route path="/confirmacoes" element={<Confirmacoes />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/confirmacao-recebimento/:id" element={<ConfirmacaoRecebimento />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

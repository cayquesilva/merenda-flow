import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  ShoppingCart,
  Calendar,
  DollarSign,
  Package,
  Loader2,
} from "lucide-react";
import { NovoPedidoDialog } from "@/components/pedidos/NovoPedidoDialog";
import { PedidoDetailDialog } from "@/components/pedidos/PedidoDetailDialog";
// COMENTÁRIO: O tipo 'Pedido' global pode ser removido se não for mais usado aqui.

// ALTERAÇÃO: Criamos um tipo específico que corresponde exatamente ao que a nossa API de listagem retorna.
// Isto resolve o erro de tipagem.
interface PedidoDaLista {
  id: string;
  numero: string;
  dataPedido: string;
  dataEntregaPrevista: string;
  status: string;
  valorTotal: number;
  contrato: {
    fornecedor: {
      nome: string;
    };
  };
  _count: {
    itens: number;
  };
}

// COMENTÁRIO: Hook para "debouncing", que evita chamadas excessivas à API ao digitar na busca.
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Pedidos() {
  const [busca, setBusca] = useState("");
  const debouncedBusca = useDebounce(busca, 300);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [refreshKey, setRefreshKey] = useState(0);

  // ALTERAÇÃO: O estado agora usa o nosso novo tipo 'PedidoDaLista'.
  const [pedidos, setPedidos] = useState<PedidoDaLista[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    entregues: 0,
    valorTotal: 0,
  });

  const handleSuccess = () => setRefreshKey((prev) => prev + 1);

  // COMENTÁRIO: Efeito que busca os pedidos e as estatísticas da API.
  useEffect(() => {
    const fetchPedidosEStats = async () => {
      setIsLoading(true);
      try {
        const [pedidosRes, statsRes] = await Promise.all([
          fetch(
            `${
              import.meta.env.VITE_API_URL || "http://localhost:3001"
            }/api/pedidos?q=${debouncedBusca}&status=${statusFilter}`
          ),
          fetch(
            `${
              import.meta.env.VITE_API_URL || "http://localhost:3001"
            }/api/pedidos/stats`
          ),
        ]);
        if (!pedidosRes.ok || !statsRes.ok)
          throw new Error("Falha ao buscar dados dos pedidos.");

        setPedidos(await pedidosRes.json());
        setStats(await statsRes.json());
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPedidosEStats();
  }, [debouncedBusca, statusFilter, refreshKey]);

  // COMENTÁRIO: Função de ajuda para renderizar o badge de status.
  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: "secondary",
      confirmado: "default",
      entregue: "default",
      cancelado: "destructive",
    } as const;

    const labels = {
      pendente: "Pendente",
      confirmado: "Confirmado",
      entregue: "Entregue",
      cancelado: "Cancelado",
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pedidos</h2>
          <p className="text-muted-foreground">
            Gerencie os pedidos de merenda escolar
          </p>
        </div>
        <NovoPedidoDialog onSuccess={handleSuccess} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Cards de Estatísticas */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total de Pedidos
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pendentes
                </p>
                <p className="text-2xl font-bold">{stats.pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Package className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Entregues
                </p>
                <p className="text-2xl font-bold">{stats.entregues}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Valor Total
                </p>
                <p className="text-2xl font-bold">
                  {stats.valorTotal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número do pedido ou fornecedor..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "todos" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("todos")}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === "pendente" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pendente")}
              >
                Pendentes
              </Button>
              <Button
                variant={statusFilter === "entregue" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("entregue")}
              >
                Entregues
              </Button>
              <Button
                variant={statusFilter === "cancelado" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("cancelado")}
              >
                Cancelados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os pedidos de merenda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 text-muted-foreground mx-auto animate-spin" />
            </div>
          ) : pedidos.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhum pedido encontrado</h3>
              <p className="text-muted-foreground">
                {busca || statusFilter !== "todos"
                  ? "Tente ajustar os filtros"
                  : "Comece criando seu primeiro pedido"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data do Pedido</TableHead>
                  <TableHead>Entrega Prevista</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidos.map((pedido) => (
                  <TableRow key={pedido.id}>
                    <TableCell className="font-mono">{pedido.numero}</TableCell>
                    {/* ALTERAÇÃO: Removido o 'as any'. Agora é seguro aceder diretamente. */}
                    <TableCell>{pedido.contrato.fornecedor.nome}</TableCell>
                    <TableCell>
                      {new Date(pedido.dataPedido).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {new Date(pedido.dataEntregaPrevista).toLocaleDateString(
                        "pt-BR"
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(pedido.status)}</TableCell>
                    <TableCell className="font-medium">
                      {pedido.valorTotal.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    {/* ALTERAÇÃO: Removido o 'as any'. Agora é seguro aceder diretamente. */}
                    <TableCell>
                      <Badge variant="outline">
                        {pedido._count.itens}{" "}
                        {pedido._count.itens === 1 ? "item" : "itens"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <PedidoDetailDialog pedidoId={pedido.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

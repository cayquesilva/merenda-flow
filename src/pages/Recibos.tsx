import { useEffect, useState } from "react";
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
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Receipt,
  XCircle,
  CheckCheck,
  PackageCheck,
} from "lucide-react";
import { GerarReciboDialog } from "@/components/recibos/GerarReciboDialog";
import { ReciboDetailDialog } from "@/components/recibos/ReciboDetailDialog";
import { useNavigate } from "react-router-dom";

// ALTERAÇÃO: Criamos um tipo específico que corresponde exatamente ao que a nossa API de listagem retorna.
// Isto resolve o erro de tipagem.
interface ReciboDaLista {
  id: string;
  numero: string;
  dataEntrega: string;
  status: string;
  pedido: {
    numero: string;
    contrato: {
      fornecedor: {
        nome: string;
      };
    };
  };
  _count: {
    itens: number;
  };
}

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Recibos() {
  const [busca, setBusca] = useState("");
  const navigate = useNavigate();

  const debouncedBusca = useDebounce(busca, 300);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [refreshKey, setRefreshKey] = useState(0);

  const [recibos, setRecibos] = useState<ReciboDaLista[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    confirmados: 0,
    parciais: 0,
    ajustados: 0,
    complementares: 0,
  });

  useEffect(() => {
    const fetchRecibosEStats = async () => {
      setIsLoading(true);
      try {
        const [recibosRes, statsRes] = await Promise.all([
          fetch(
            `${
              import.meta.env.VITE_API_URL || "http://localhost:3001"
            }/api/recibos?q=${debouncedBusca}&status=${statusFilter}`
          ),
          fetch(
            `${
              import.meta.env.VITE_API_URL || "http://localhost:3001"
            }/api/recibos/stats`
          ),
        ]);
        if (!recibosRes.ok || !statsRes.ok)
          throw new Error("Falha ao buscar dados dos recibos.");

        setRecibos(await recibosRes.json());
        setStats(await statsRes.json());
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecibosEStats();
  }, [debouncedBusca, statusFilter, refreshKey]);

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: "secondary",
      confirmado: "default",
      parcial: "outline",
      rejeitado: "destructive",
      ajustado: "outline",
      complementar: "secondary",
    } as const;

    const labels = {
      pendente: "Pendente",
      confirmado: "Confirmado",
      parcial: "Parcial",
      rejeitado: "Rejeitado",
      ajustado: "Ajustado",
      complementar: "Complementar",
    };

    const icons = {
      pendente: <Clock className="h-3 w-3 mr-1" />,
      confirmado: <CheckCircle className="h-3 w-3 mr-1" />,
      parcial: <AlertTriangle className="h-3 w-3 mr-1" />,
      rejeitado: <XCircle className="h-3 w-3 mr-1" />,
      ajustado: <CheckCheck className="h-3 w-3 mr-1" />,
      complementar: <PackageCheck className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const abrirConfirmacao = (reciboId: string) => {
    navigate(`/confirmacao-recebimento/${reciboId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Recibos de Entrega
          </h2>
          <p className="text-muted-foreground">
            Gerencie os recibos de entrega com QR Code
          </p>
        </div>
        <GerarReciboDialog onSuccess={handleSuccess} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total de Recibos
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Confirmados
                </p>
                <p className="text-2xl font-bold">{stats.confirmados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCheck className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ajustados
                </p>
                <p className="text-2xl font-bold">{stats.ajustados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <PackageCheck className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Complementares
                </p>
                <p className="text-2xl font-bold">{stats.complementares}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Parciais
                </p>
                <p className="text-2xl font-bold">{stats.parciais}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-orange-500" />
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
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número do recibo, pedido ou fornecedor..."
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
                variant={statusFilter === "confirmado" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("confirmado")}
              >
                Confirmados
              </Button>
              <Button
                variant={statusFilter === "ajustado" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("ajustado")}
              >
                Ajustados
              </Button>
              <Button
                variant={
                  statusFilter === "complementar" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setStatusFilter("complementar")}
              >
                Complementares
              </Button>
              <Button
                variant={statusFilter === "parcial" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("parcial")}
              >
                Parciais
              </Button>
              <Button
                variant={statusFilter === "pendente" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pendente")}
              >
                Pendentes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Recibos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os recibos de entrega
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 text-muted-foreground mx-auto animate-spin" />
            </div>
          ) : recibos.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhum recibo encontrado</h3>
              <p className="text-muted-foreground">
                {busca || statusFilter !== "todos"
                  ? "Tente ajustar os filtros"
                  : "Comece gerando seu primeiro recibo"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data de Entrega</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recibos.map((recibo) => (
                  <TableRow key={recibo.id}>
                    <TableCell className="font-mono">{recibo.numero}</TableCell>
                    <TableCell className="font-mono">
                      {recibo.pedido.numero}
                    </TableCell>
                    <TableCell>
                      {recibo.pedido.contrato.fornecedor.nome}
                    </TableCell>
                    <TableCell>
                      {new Date(recibo.dataEntrega).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>{getStatusBadge(recibo.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-center px-2">
                        {recibo._count.itens}{" "}
                        {recibo._count.itens === 1 ? "item" : "itens"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirConfirmacao(recibo.id)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Confirmar
                        </Button>
                        <ReciboDetailDialog reciboId={recibo.id} />
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

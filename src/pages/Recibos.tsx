import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  QrCode, 
  FileText, 
  Calendar,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Download,
  ExternalLink
} from "lucide-react";
import { recibos } from "@/data/mockData";
import { GerarReciboDialog } from "@/components/recibos/GerarReciboDialog";

export default function Recibos() {
  const [busca, setBusca] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [refreshKey, setRefreshKey] = useState(0);

  const recibosFiltrados = recibos.filter(recibo => {
    const matchBusca = recibo.numero.toLowerCase().includes(busca.toLowerCase()) ||
                      recibo.pedido.numero.toLowerCase().includes(busca.toLowerCase()) ||
                      recibo.pedido.contrato.fornecedor.nome.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = statusFilter === "todos" || recibo.status === statusFilter;
    return matchBusca && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: "secondary",
      confirmado: "default",
      parcial: "outline", 
      rejeitado: "destructive"
    } as const;
    
    const labels = {
      pendente: "Pendente",
      confirmado: "Confirmado",
      parcial: "Parcial",
      rejeitado: "Rejeitado"
    };

    const icons = {
      pendente: <Clock className="h-3 w-3 mr-1" />,
      confirmado: <CheckCircle className="h-3 w-3 mr-1" />,
      parcial: <AlertTriangle className="h-3 w-3 mr-1" />,
      rejeitado: <AlertTriangle className="h-3 w-3 mr-1" />
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const abrirQRCode = (qrcode: string) => {
    window.open(qrcode, '_blank');
  };

  const abrirConfirmacao = (reciboId: string) => {
    window.open(`/confirmacao-recebimento/${reciboId}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Recibos de Entrega</h2>
          <p className="text-muted-foreground">
            Gerencie os recibos de entrega com QR Code
          </p>
        </div>
        <GerarReciboDialog onSuccess={handleSuccess} />
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Recibos</p>
                <p className="text-2xl font-bold">{recibos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">
                  {recibos.filter(r => r.status === 'pendente').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confirmados</p>
                <p className="text-2xl font-bold">
                  {recibos.filter(r => r.status === 'confirmado').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Parciais</p>
                <p className="text-2xl font-bold">
                  {recibos.filter(r => r.status === 'parcial').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
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
                variant={statusFilter === "pendente" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pendente")}
              >
                Pendentes
              </Button>
              <Button
                variant={statusFilter === "confirmado" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("confirmado")}
              >
                Confirmados
              </Button>
              <Button
                variant={statusFilter === "parcial" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("parcial")}
              >
                Parciais
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Recibos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Recibos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os recibos de entrega
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recibosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhum recibo encontrado</h3>
              <p className="text-muted-foreground">
                {busca ? "Tente ajustar os filtros de busca" : "Comece gerando seu primeiro recibo"}
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
                  <TableHead>Responsável Entrega</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recibosFiltrados.map((recibo) => (
                  <TableRow key={recibo.id}>
                    <TableCell className="font-mono">{recibo.numero}</TableCell>
                    <TableCell className="font-mono">{recibo.pedido.numero}</TableCell>
                    <TableCell>{recibo.pedido.contrato.fornecedor.nome}</TableCell>
                    <TableCell>
                      {new Date(recibo.dataEntrega).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{recibo.responsavelEntrega}</TableCell>
                    <TableCell>{getStatusBadge(recibo.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {recibo.itens.length} {recibo.itens.length === 1 ? 'item' : 'itens'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => abrirQRCode(recibo.qrcode)}
                        >
                          <QrCode className="h-3 w-3 mr-1" />
                          QR Code
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => abrirConfirmacao(recibo.id)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Confirmar
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
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
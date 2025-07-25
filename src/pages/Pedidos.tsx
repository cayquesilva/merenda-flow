import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  ShoppingCart, 
  Calendar, 
  DollarSign, 
  Package, 
  Building2,
  Eye,
  FileText,
  Filter
} from "lucide-react";
import { pedidos } from "@/data/mockData";
import { NovoPedidoDialog } from "@/components/pedidos/NovoPedidoDialog";

export default function Pedidos() {
  const [busca, setBusca] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [refreshKey, setRefreshKey] = useState(0);

  const pedidosFiltrados = pedidos.filter(pedido => {
    const matchBusca = pedido.numero.toLowerCase().includes(busca.toLowerCase()) ||
                      pedido.contrato.fornecedor.nome.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = statusFilter === "todos" || pedido.status === statusFilter;
    return matchBusca && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: "secondary",
      confirmado: "default", 
      entregue: "default",
      cancelado: "destructive"
    } as const;
    
    const labels = {
      pendente: "Pendente",
      confirmado: "Confirmado",
      entregue: "Entregue", 
      cancelado: "Cancelado"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
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

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Pedidos</p>
                <p className="text-2xl font-bold">{pedidos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Calendar className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">
                  {pedidos.filter(p => p.status === 'pendente').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-success/10 rounded-lg">
                <Package className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entregues</p>
                <p className="text-2xl font-bold">
                  {pedidos.filter(p => p.status === 'entregue').length}
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  R$ {pedidos.reduce((sum, p) => sum + p.valorTotal, 0).toFixed(2)}
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
                variant={statusFilter === "confirmado" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("confirmado")}
              >
                Confirmados
              </Button>
              <Button
                variant={statusFilter === "entregue" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("entregue")}
              >
                Entregues
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os pedidos de merenda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pedidosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhum pedido encontrado</h3>
              <p className="text-muted-foreground">
                {busca ? "Tente ajustar os filtros de busca" : "Comece criando seu primeiro pedido"}
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
                {pedidosFiltrados.map((pedido) => (
                  <TableRow key={pedido.id}>
                    <TableCell className="font-mono">{pedido.numero}</TableCell>
                    <TableCell>{pedido.contrato.fornecedor.nome}</TableCell>
                    <TableCell>
                      {new Date(pedido.dataPedido).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {new Date(pedido.dataEntregaPrevista).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{getStatusBadge(pedido.status)}</TableCell>
                    <TableCell className="font-medium">
                      R$ {pedido.valorTotal.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {pedido.itens.length} {pedido.itens.length === 1 ? 'item' : 'itens'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                        {pedido.status === 'confirmado' && (
                          <Button variant="outline" size="sm">
                            <FileText className="h-3 w-3 mr-1" />
                            Recibo
                          </Button>
                        )}
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
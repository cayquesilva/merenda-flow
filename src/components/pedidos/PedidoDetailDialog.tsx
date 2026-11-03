import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  Package,
  Building2,
  User,
  FileText,
  Loader2,
  Search,
  Layers,
} from "lucide-react";
import { Pedido } from "@/types";
import { useEffect, useMemo, useState } from "react";

interface PedidoDetailDialogProps {
  pedidoId: string;
}

export function PedidoDetailDialog({ pedidoId }: PedidoDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [buscaItemOuEscola, setBuscaItemOuEscola] = useState("");

  useEffect(() => {
    if (open && pedidoId) {
      const fetchPedidoDetails = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(
            `${
              import.meta.env.VITE_API_URL || "http://localhost:3001"
            }/api/pedidos/${pedidoId}`
          );
          if (!response.ok)
            throw new Error("Falha ao buscar detalhes do pedido.");
          setPedido(await response.json());
        } catch (error) {
          console.error("Erro ao buscar detalhes:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPedidoDetails();
    } else if (!open) {
      setBuscaItemOuEscola("");
    }
  }, [open, pedidoId]);

  const consolidadoPorProduto = useMemo(() => {
    if (!pedido) return [];
    const mapa = new Map<
      string,
      {
        id: string;
        nome: string;
        sigla: string;
        valorUnitario: number;
        quantidadeTotal: number;
        totalEscolas: number;
        subtotal: number;
      }
    >();

    for (const item of pedido.itens) {
      const key = item.itemContrato.id;
      const atual = mapa.get(key);
      if (atual) {
        atual.quantidadeTotal += item.quantidade;
        atual.totalEscolas += 1;
        atual.subtotal += item.quantidade * item.itemContrato.valorUnitario;
      } else {
        mapa.set(key, {
          id: key,
          nome: item.itemContrato.nome,
          sigla: item.itemContrato.unidadeMedida.sigla,
          valorUnitario: item.itemContrato.valorUnitario,
          quantidadeTotal: item.quantidade,
          totalEscolas: 1,
          subtotal: item.quantidade * item.itemContrato.valorUnitario,
        });
      }
    }

    return Array.from(mapa.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR")
    );
  }, [pedido]);

  const itensFiltrados = useMemo(() => {
    if (!pedido) return [];
    const termo = buscaItemOuEscola.trim().toLowerCase();
    if (!termo) return pedido.itens.slice(0, 150);
    return pedido.itens
      .filter(
        (item) =>
          item.itemContrato.nome.toLowerCase().includes(termo) ||
          item.unidadeEducacional.nome.toLowerCase().includes(termo) ||
          item.unidadeEducacional.codigo.toLowerCase().includes(termo)
      )
      .slice(0, 200);
  }, [pedido, buscaItemOuEscola]);

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-3 w-3 mr-1" />
          Ver
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes do Pedido {pedido?.numero}
          </DialogTitle>
          <DialogDescription>
            Visualize o consolidado por produto e a distribuição por unidade
            educacional
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : pedido ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-4 w-4" />
                    Informações do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Número:</span>
                    <span className="font-mono">{pedido.numero}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    {getStatusBadge(pedido.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Data do Pedido:
                    </span>
                    <span>
                      {new Date(pedido.dataPedido).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Entrega Prevista:
                    </span>
                    <span>
                      {new Date(pedido.dataEntregaPrevista).toLocaleDateString(
                        "pt-BR"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-muted-foreground font-medium">
                      Valor Total:
                    </span>
                    <span className="font-bold text-lg">
                      {pedido.valorTotal.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-4 w-4" />
                    Contrato e Fornecedor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contrato:</span>
                    <span className="font-mono">{pedido.contrato.numero}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fornecedor:</span>
                    <span className="font-medium">
                      {pedido.contrato.fornecedor.nome}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CNPJ:</span>
                    <span className="font-mono text-sm">
                      {pedido.contrato.fornecedor.cnpj}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Total de Lançamentos:
                    </span>
                    <span className="font-medium">
                      {pedido.itens.length.toLocaleString("pt-BR")} entregas (
                      {consolidadoPorProduto.length} produtos)
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="consolidado" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="consolidado">
                  <Layers className="h-4 w-4 mr-2" />
                  Consolidado por Produto ({consolidadoPorProduto.length})
                </TabsTrigger>
                <TabsTrigger value="escolas">
                  <Building2 className="h-4 w-4 mr-2" />
                  Distribuição por Escola ({pedido.itens.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="consolidado" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead className="text-right">
                            Escolas Atendidas
                          </TableHead>
                          <TableHead className="text-right">
                            Qtd. Consolidada
                          </TableHead>
                          <TableHead className="text-right">
                            Valor Unitário
                          </TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {consolidadoPorProduto.map((prod) => (
                          <TableRow key={prod.id}>
                            <TableCell className="font-medium">
                              {prod.nome}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {prod.totalEscolas}
                            </TableCell>
                            <TableCell className="text-right font-bold font-mono">
                              {prod.quantidadeTotal.toLocaleString("pt-BR")}{" "}
                              <span className="text-xs font-normal text-muted-foreground">
                                {prod.sigla}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {prod.valorUnitario.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {prod.subtotal.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="escolas" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Package className="h-4 w-4" />
                        Itens por Escola ({pedido.itens.length})
                      </CardTitle>
                      <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por escola ou produto..."
                          value={buscaItemOuEscola}
                          onChange={(e) => setBuscaItemOuEscola(e.target.value)}
                          className="pl-9 h-9"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {itensFiltrados.map((item) => (
                        <Card key={item.id} className="p-3">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                            <div className="md:col-span-2">
                              <h4 className="font-medium text-sm">
                                {item.itemContrato.nome}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {item.unidadeEducacional.nome} (
                                  {item.unidadeEducacional.codigo})
                                </span>
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">
                                Quantidade:
                              </span>
                              <p className="font-medium text-sm">
                                {item.quantidade.toLocaleString("pt-BR")}{" "}
                                {item.itemContrato.unidadeMedida.sigla}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">
                                Subtotal
                              </div>
                              <div className="text-sm font-bold">
                                {(
                                  item.quantidade *
                                  item.itemContrato.valorUnitario
                                ).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                      {pedido.itens.length > itensFiltrados.length && (
                        <p className="text-xs text-center text-muted-foreground py-2">
                          Exibindo {itensFiltrados.length} de{" "}
                          {pedido.itens.length} registros. Utilize a busca acima
                          para filtrar uma escola ou produto específico.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Total Geral:</span>
                <span className="text-2xl font-bold">
                  {pedido.valorTotal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p>Não foi possível carregar os dados.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

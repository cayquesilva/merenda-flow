import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Package, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Pedido } from "@/types";

interface PedidoParaRecibo {
  id: string;
  numero: string;
  contrato: {
    fornecedor: {
      nome: string;
    };
  };
}

interface GerarReciboDialogProps {
  onSuccess: () => void;
}

export function GerarReciboDialog({ onSuccess }: GerarReciboDialogProps) {
  const [open, setOpen] = useState(false);
  const [pedidosDisponiveis, setPedidosDisponiveis] = useState<
    PedidoParaRecibo[]
  >([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(
    null
  );
  const [selectedPedidoId, setSelectedPedidoId] = useState<
    string | undefined
  >();
  const [dataEntrega, setDataEntrega] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const fetchPedidos = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(
            `${
              import.meta.env.VITE_API_URL || "http://localhost:3001"
            }/api/pedidos-para-recibo`
          );
          if (!response.ok)
            throw new Error("Falha ao carregar pedidos disponíveis.");
          setPedidosDisponiveis(await response.json());
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Erro desconhecido.";
          toast({
            title: "Erro",
            description: errorMessage,
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchPedidos();
    } else {
      setPedidoSelecionado(null);
      setSelectedPedidoId(undefined);
      setDataEntrega("");
    }
  }, [open, toast]);

  const handleSelecionarPedido = async (pedidoId: string) => {
    setSelectedPedidoId(pedidoId);
    if (!pedidoId) {
      setPedidoSelecionado(null);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/pedidos/${pedidoId}`
      );
      if (!response.ok) throw new Error("Falha ao buscar detalhes do pedido.");
      setPedidoSelecionado(await response.json());
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido.";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validarRecibo = () => {
    if (!pedidoSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um pedido",
        variant: "destructive",
      });
      return false;
    }

    if (!dataEntrega) {
      toast({
        title: "Erro",
        description: "Informe o prazo de entrega",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleGerar = async () => {
    if (!validarRecibo()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/recibos`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pedidoId: selectedPedidoId,
            dataEntrega,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Falha ao gerar recibo.");

      toast({ title: "Sucesso!", description: result.message });
      setOpen(false);
      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro desconhecido.";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <QrCode className="mr-2 h-4 w-4" />
          Gerar Recibo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Gerar Recibo de Entrega
          </DialogTitle>
          <DialogDescription>
            Selecione um pedido confirmado e gere o recibo com QR Code
          </DialogDescription>
        </DialogHeader>

        {isLoading && !pedidoSelecionado ? (
          <div className="flex justify-center p-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden py-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
              <div>
                <Label htmlFor="pedido">Pedido *</Label>
                <Select
                  value={selectedPedidoId}
                  onValueChange={handleSelecionarPedido}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um pedido confirmado" />
                  </SelectTrigger>
                  <SelectContent>
                    {pedidosDisponiveis.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.numero} - {p.contrato.fornecedor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dataEntrega">Prazo de Entrega *</Label>
                <DatePicker
                  id="dataEntrega"
                  value={dataEntrega}
                  onChange={(v) => setDataEntrega(v)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            {pedidoSelecionado && (
              <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <CardHeader className="py-3 px-4 shrink-0 border-b">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package className="h-4 w-4" />
                      Detalhes do Pedido {pedidoSelecionado.numero} (
                      {pedidoSelecionado.itens.length} itens)
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        <strong>Contrato:</strong>{" "}
                        {pedidoSelecionado.contrato.numero}
                      </span>
                      <span>
                        <strong>Fornecedor:</strong>{" "}
                        {pedidoSelecionado.contrato.fornecedor.nome}
                      </span>
                      <span>
                        <strong>Data:</strong>{" "}
                        {new Date(
                          pedidoSelecionado.dataPedido
                        ).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="text-foreground font-semibold">
                        Total: R$ {pedidoSelecionado.valorTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Unidade Educacional</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pedidoSelecionado.itens.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.itemContrato.nome}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.unidadeEducacional.nome}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {item.quantidade}{" "}
                            {item.itemContrato.unidadeMedida.sigla}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            R${" "}
                            {(
                              item.quantidade * item.itemContrato.valorUnitario
                            ).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter className="shrink-0 pt-3 border-t">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGerar}
            disabled={isLoading || !pedidoSelecionado}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <QrCode className="mr-2 h-4 w-4" />
            )}
            Gerar Recibo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

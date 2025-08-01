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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Package, Truck, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Pedido } from "@/types"; // Usaremos o tipo Pedido para os detalhes

// ALTERAÇÃO: Criado um tipo específico para a lista de pedidos que vem da API de consulta.
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
  // ALTERAÇÃO: O estado da lista agora usa o tipo específico 'PedidoParaRecibo'.
  const [pedidosDisponiveis, setPedidosDisponiveis] = useState<
    PedidoParaRecibo[]
  >([]);
  // ALTERAÇÃO: O estado do pedido selecionado continua a usar o tipo 'Pedido' completo, pois ele será preenchido com os detalhes da API.
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(
    null
  );
  const [selectedPedidoId, setSelectedPedidoId] = useState<
    string | undefined
  >();
  const [responsavelEntrega, setResponsavelEntrega] = useState("");
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
      // Limpa o formulário ao fechar
      setPedidoSelecionado(null);
      setSelectedPedidoId(undefined);
      setResponsavelEntrega("");
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
      // Busca os detalhes completos do pedido selecionado
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

    if (!responsavelEntrega.trim()) {
      toast({
        title: "Erro",
        description: "Informe o responsável pela entrega",
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

  const gerarQRCode = (reciboId: string) => {
    const url = `${window.location.origin}/confirmacao-recebimento/${reciboId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      url
    )}`;
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
            responsavelEntrega,
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Input
                  id="dataEntrega"
                  type="date"
                  value={dataEntrega}
                  onChange={(e) => setDataEntrega(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="responsavel">Responsável pela Entrega *</Label>
              <Input
                id="responsavel"
                placeholder="Nome do responsável pela entrega"
                value={responsavelEntrega}
                onChange={(e) => setResponsavelEntrega(e.target.value)}
              />
            </div>
            {pedidoSelecionado && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Detalhes do Pedido {pedidoSelecionado.numero}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Contrato:</span>
                        <p>{pedidoSelecionado.contrato.numero}</p>
                      </div>
                      <div>
                        <span className="font-medium">Fornecedor:</span>
                        <p>{pedidoSelecionado.contrato.fornecedor.nome}</p>
                      </div>
                      <div>
                        <span className="font-medium">Data do Pedido:</span>
                        <p>
                          {new Date(
                            pedidoSelecionado.dataPedido
                          ).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Valor Total:</span>
                        <p className="font-semibold">
                          R$ {pedidoSelecionado.valorTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Itens do Pedido:</h4>
                      <div className="space-y-2">
                        {pedidoSelecionado.itens.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center p-3 bg-muted rounded-lg"
                          >
                            <div>
                              <span className="font-medium">
                                {item.itemContrato.nome}
                              </span>
                              <p className="text-sm text-muted-foreground">
                                {item.unidadeEducacional.nome}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {item.quantidade}{" "}
                                {item.itemContrato.unidadeMedida.sigla}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                R${" "}
                                {(
                                  item.quantidade *
                                  item.itemContrato.valorUnitario
                                ).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-primary/5 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-primary mb-2">
                        <QrCode className="h-4 w-4" />
                        <span className="font-medium">
                          Fluxo de Entrega e Confirmação
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          1. <strong>Recibo será gerado</strong> com QR Code
                          único
                        </p>
                        <p>
                          2. <strong>Entrega realizada</strong> pelo responsável
                          informado
                        </p>
                        <p>
                          3. <strong>QR Code escaneado</strong> no local de
                          entrega
                        </p>
                        <p>
                          4. <strong>Confirmação de recebimento</strong> via
                          smartphone
                        </p>
                        <p>
                          5. <strong>Saldos atualizados</strong> automaticamente
                          no sistema
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        <DialogFooter>
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
            <QrCode className="mr-2 h-4 w-4" />
            Gerar Recibo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

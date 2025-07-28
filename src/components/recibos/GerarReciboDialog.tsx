import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, Package, Truck, Calendar } from "lucide-react";
import { pedidos } from "@/data/mockData";
import { Pedido } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface GerarReciboDialogProps {
  onSuccess: () => void;
}

export function GerarReciboDialog({ onSuccess }: GerarReciboDialogProps) {
  const [open, setOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
  const [responsavelEntrega, setResponsavelEntrega] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const { toast } = useToast();

  const handleSelecionarPedido = (pedidoId: string) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    setPedidoSelecionado(pedido || null);
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
        description: "Informe a data de entrega",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const gerarQRCode = (reciboId: string) => {
    const url = `${window.location.origin}/confirmacao-recebimento/${reciboId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  const handleGerar = () => {
    if (!validarRecibo()) return;

    // Simular geração de recibos por unidade
    const unidadesEnvolvidas = [...new Set(pedidoSelecionado!.itens.map(item => item.unidadeEducacional.id))];
    const quantidadeRecibos = unidadesEnvolvidas.length;

    toast({
      title: "Recibo gerado com sucesso!",
      description: `${quantidadeRecibos} recibo(s) gerado(s) - um para cada unidade educacional. Cada recibo possui seu próprio QR Code.`,
    });

    // Reset form
    setOpen(false);
    setPedidoSelecionado(null);
    setResponsavelEntrega("");
    setDataEntrega("");
    onSuccess();
  };

  const pedidosDisponiveis = pedidos.filter(p => p.status === 'confirmado');

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

        <div className="space-y-6">
          {/* Seleção de Pedido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pedido">Pedido *</Label>
              <Select onValueChange={handleSelecionarPedido}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um pedido confirmado" />
                </SelectTrigger>
                <SelectContent>
                  {pedidosDisponiveis.map(pedido => (
                    <SelectItem key={pedido.id} value={pedido.id}>
                      {pedido.numero} - {pedido.contrato.fornecedor.nome} - R$ {pedido.valorTotal.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dataEntrega">Data de Entrega *</Label>
              <Input
                id="dataEntrega"
                type="date"
                value={dataEntrega}
                onChange={(e) => setDataEntrega(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
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

          {/* Detalhes do Pedido */}
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
                      <p>{new Date(pedidoSelecionado.dataPedido).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <span className="font-medium">Valor Total:</span>
                      <p className="font-semibold">R$ {pedidoSelecionado.valorTotal.toFixed(2)}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Itens do Pedido:</h4>
                    <div className="space-y-2">
                      {pedidoSelecionado.itens.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <div>
                            <span className="font-medium">{item.itemContrato.nome}</span>
                            <p className="text-sm text-muted-foreground">
                              {item.unidadeEducacional.nome}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {item.quantidade} {item.itemContrato.unidadeMedida.sigla}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              R$ {(item.quantidade * item.itemContrato.valorUnitario).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-primary/5 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <QrCode className="h-4 w-4" />
                      <span className="font-medium">Fluxo de Entrega e Confirmação</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>1. <strong>Recibo será gerado</strong> com QR Code único</p>
                      <p>2. <strong>Entrega realizada</strong> pelo responsável informado</p>
                      <p>3. <strong>QR Code escaneado</strong> no local de entrega</p>
                      <p>4. <strong>Confirmação de recebimento</strong> via smartphone</p>
                      <p>5. <strong>Saldos atualizados</strong> automaticamente no sistema</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGerar} disabled={!pedidoSelecionado}>
            <QrCode className="mr-2 h-4 w-4" />
            Gerar Recibo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, ShoppingCart, Package2, Calendar } from "lucide-react";
import { contratos, unidadesEducacionais } from "@/data/mockData";
import { Contrato, ItemContrato, UnidadeEducacional } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface ItemPedidoForm {
  itemContrato: ItemContrato;
  unidades: {
    unidadeId: string;
    quantidade: number;
  }[];
}

interface NovoPedidoDialogProps {
  onSuccess: () => void;
}

export function NovoPedidoDialog({ onSuccess }: NovoPedidoDialogProps) {
  const [open, setOpen] = useState(false);
  const [contratoSelecionado, setContratoSelecionado] = useState<Contrato | null>(null);
  const [dataEntrega, setDataEntrega] = useState("");
  const [itensPedido, setItensPedido] = useState<ItemPedidoForm[]>([]);
  const { toast } = useToast();

  const handleSelecionarContrato = (contratoId: string) => {
    const contrato = contratos.find(c => c.id === contratoId);
    setContratoSelecionado(contrato || null);
    setItensPedido([]);
  };

  const handleAdicionarItem = (item: ItemContrato) => {
    if (itensPedido.find(ip => ip.itemContrato.id === item.id)) return;
    
    setItensPedido(prev => [...prev, {
      itemContrato: item,
      unidades: unidadesEducacionais.map(u => ({
        unidadeId: u.id,
        quantidade: 0
      }))
    }]);
  };

  const handleRemoverItem = (itemId: string) => {
    setItensPedido(prev => prev.filter(ip => ip.itemContrato.id !== itemId));
  };

  const handleQuantidadeChange = (itemId: string, unidadeId: string, quantidade: number) => {
    setItensPedido(prev => prev.map(ip => 
      ip.itemContrato.id === itemId 
        ? {
            ...ip,
            unidades: ip.unidades.map(u => 
              u.unidadeId === unidadeId 
                ? { ...u, quantidade: Math.max(0, quantidade) }
                : u
            )
          }
        : ip
    ));
  };

  const calcularTotalItem = (item: ItemPedidoForm) => {
    const totalQuantidade = item.unidades.reduce((sum, u) => sum + u.quantidade, 0);
    return totalQuantidade * item.itemContrato.valorUnitario;
  };

  const calcularTotalPedido = () => {
    return itensPedido.reduce((sum, item) => sum + calcularTotalItem(item), 0);
  };

  const validarPedido = () => {
    if (!contratoSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um contrato",
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

    if (itensPedido.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item ao pedido",
        variant: "destructive",
      });
      return false;
    }

    // Verificar se há quantidades > 0
    const temQuantidades = itensPedido.some(item => 
      item.unidades.some(u => u.quantidade > 0)
    );

    if (!temQuantidades) {
      toast({
        title: "Erro",
        description: "Informe as quantidades dos itens",
        variant: "destructive",
      });
      return false;
    }

    // Verificar saldo disponível
    for (const item of itensPedido) {
      const totalSolicitado = item.unidades.reduce((sum, u) => sum + u.quantidade, 0);
      if (totalSolicitado > item.itemContrato.saldoAtual) {
        toast({
          title: "Erro",
          description: `Quantidade solicitada de ${item.itemContrato.nome} excede o saldo disponível (${item.itemContrato.saldoAtual})`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSalvar = () => {
    if (!validarPedido()) return;

    // Simular criação do pedido e geração automática de recibos por unidade
    const unidadesEnvolvidas = [...new Set(itensPedido.flatMap(item => 
      item.unidades.filter(u => u.quantidade > 0).map(u => u.unidadeId)
    ))];

    toast({
      title: "Pedido criado!",
      description: `Pedido criado com sucesso! ${unidadesEnvolvidas.length} recibo(s) foram gerados automaticamente para as unidades.`,
    });

    // Reset form
    setOpen(false);
    setContratoSelecionado(null);
    setDataEntrega("");
    setItensPedido([]);
    onSuccess();
  };

  const itensDisponiveis = contratoSelecionado?.itens.filter(item => 
    item.saldoAtual > 0 && !itensPedido.find(ip => ip.itemContrato.id === item.id)
  ) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Pedido
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Novo Pedido
          </DialogTitle>
          <DialogDescription>
            Selecione um contrato e configure as quantidades por unidade educacional
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção de Contrato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contrato">Contrato *</Label>
              <Select onValueChange={handleSelecionarContrato}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um contrato" />
                </SelectTrigger>
                <SelectContent>
                  {contratos.filter(c => c.status === 'ativo').map(contrato => (
                    <SelectItem key={contrato.id} value={contrato.id}>
                      {contrato.numero} - {contrato.fornecedor.nome}
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

          {contratoSelecionado && (
            <>
              {/* Itens Disponíveis */}
              {itensDisponiveis.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package2 className="h-4 w-4" />
                      Itens Disponíveis no Contrato
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {itensDisponiveis.map(item => (
                        <Card key={item.id} className="p-3">
                          <div className="space-y-2">
                            <div>
                              <h4 className="font-medium text-sm">{item.nome}</h4>
                              <p className="text-xs text-muted-foreground">
                                Saldo: {item.saldoAtual} {item.unidadeMedida.sigla}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                R$ {item.valorUnitario.toFixed(2)} / {item.unidadeMedida.sigla}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleAdicionarItem(item)}
                              className="w-full"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Adicionar
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Itens do Pedido */}
              {itensPedido.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Itens do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {itensPedido.map(item => (
                        <div key={item.itemContrato.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{item.itemContrato.nome}</h4>
                              <p className="text-sm text-muted-foreground">
                                Saldo disponível: {item.itemContrato.saldoAtual} {item.itemContrato.unidadeMedida.sigla} | 
                                R$ {item.itemContrato.valorUnitario.toFixed(2)} / {item.itemContrato.unidadeMedida.sigla}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                Total: R$ {calcularTotalItem(item).toFixed(2)}
                              </Badge>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleRemoverItem(item.itemContrato.id)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {unidadesEducacionais.map(unidade => {
                              const unidadeItem = item.unidades.find(u => u.unidadeId === unidade.id);
                              return (
                                <div key={unidade.id} className="space-y-2">
                                  <Label className="text-sm font-medium">{unidade.nome}</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max={item.itemContrato.saldoAtual}
                                    value={unidadeItem?.quantidade || 0}
                                    onChange={(e) => handleQuantidadeChange(
                                      item.itemContrato.id,
                                      unidade.id,
                                      parseInt(e.target.value) || 0
                                    )}
                                    placeholder="Quantidade"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total do Pedido:</span>
                      <span className="text-lg font-bold">R$ {calcularTotalPedido().toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={!contratoSelecionado || itensPedido.length === 0}>
            Criar Pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
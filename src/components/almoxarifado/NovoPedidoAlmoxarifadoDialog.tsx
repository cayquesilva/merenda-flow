import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus, ShoppingCart, Package2, Loader2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";

// COMENTÁRIO: Interfaces para os tipos de dados que vamos manipular.
interface ContratoAtivo {
  id: string;
  numero: string;
  fornecedor: { nome: string };
}
interface UnidadeEducacional {
  id: string;
  nome: string;
}
interface Insumo {
  id: string;
  nome: string;
  saldo: number;
  valorUnitario: number;
  unidadeMedida: { sigla: string };
}
interface ItemPedidoForm {
  insumo: Insumo;
  unidades: {
    unidadeId: string;
    quantidade: number;
    unidadeNome: string;
  }[];
}

export function NovoPedidoAlmoxarifadoDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [contratos, setContratos] = useState<ContratoAtivo[]>([]);
  const [unidades, setUnidades] = useState<UnidadeEducacional[]>([]);
  const [insumosContrato, setInsumosContrato] = useState<Insumo[]>([]);
  const [selectedContratoId, setSelectedContratoId] = useState<string | undefined>();
  const [dataEntrega, setDataEntrega] = useState("");
  const [itensPedido, setItensPedido] = useState<ItemPedidoForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // COMENTÁRIO: Busca os dados iniciais (contratos e unidades) quando o diálogo é aberto.
  useEffect(() => {
    if (open) {
      apiService.getContratosAlmoxarifadoAtivos().then(setContratos);
      apiService.getUnidadesAtivas().then(setUnidades);
    } else {
      // COMENTÁRIO: Limpa o estado quando o diálogo é fechado.
      setSelectedContratoId(undefined);
      setInsumosContrato([]);
      setItensPedido([]);
      setDataEntrega("");
    }
  }, [open]);

  // COMENTÁRIO: Busca os insumos do contrato selecionado.
  const handleSelecionarContrato = async (contratoId: string) => {
    setSelectedContratoId(contratoId);
    if (!contratoId) {
        setInsumosContrato([]);
        return;
    }
    setIsLoading(true);
    try {
      const data = await apiService.getInsumosPorContrato(contratoId);
      setInsumosContrato(data);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível carregar os insumos do contrato.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // COMENTÁRIO: Funções para manipular os itens no pedido (adicionar, remover, alterar quantidade).
  const handleAdicionarItem = (insumo: Insumo) => {
    if (itensPedido.find(ip => ip.insumo.id === insumo.id)) return;
    const unidadesParaItem = unidades.map(u => ({
      unidadeId: u.id,
      quantidade: 0,
      unidadeNome: u.nome,
    }));
    setItensPedido(prev => [...prev, { insumo, unidades: unidadesParaItem }]);
  };

  const handleRemoverItem = (insumoId: string) => setItensPedido(prev => prev.filter(ip => ip.insumo.id !== insumoId));

  const handleQuantidadeChange = (insumoId: string, unidadeId: string, quantidade: number) => {
    setItensPedido(prev => prev.map(ip =>
      ip.insumo.id === insumoId ? {
        ...ip,
        unidades: ip.unidades.map(u => u.unidadeId === unidadeId ? { ...u, quantidade: Math.max(0, quantidade) } : u),
      } : ip
    ));
  };

  // COMENTÁRIO: Cálculos para o total do pedido.
  const calcularTotalItem = (item: ItemPedidoForm) => item.unidades.reduce((sum, u) => sum + u.quantidade, 0) * item.insumo.valorUnitario;
  const calcularTotalPedido = () => itensPedido.reduce((sum, item) => sum + calcularTotalItem(item), 0);

  // COMENTÁRIO: Lógica de submissão do pedido.
  const handleSalvar = async () => {
    if (!selectedContratoId || !dataEntrega || itensPedido.length === 0) {
      toast({ title: "Erro de Validação", description: "Preencha todos os campos obrigatórios e adicione itens ao pedido.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const itensPayload = itensPedido.flatMap(item =>
      item.unidades
        .filter(u => u.quantidade > 0)
        .map(u => ({
          itemAlmoxarifadoId: item.insumo.id,
          unidadeEducacionalId: u.unidadeId,
          quantidade: u.quantidade,
        }))
    );

    if(itensPayload.length === 0) {
      toast({ title: "Erro", description: "Nenhum item com quantidade maior que zero foi adicionado.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const pedidoPayload = {
      contratoId: selectedContratoId,
      dataEntregaPrevista: dataEntrega,
      valorTotal: calcularTotalPedido(),
      itens: itensPayload,
    };

    try {
      await apiService.createPedidoAlmoxarifado(pedidoPayload);
      toast({ title: "Sucesso!", description: "Pedido de almoxarifado criado com sucesso." });
      onSuccess();
      setOpen(false);
    } catch (error) {
      toast({ title: "Erro ao Salvar", description: error instanceof Error ? error.message : "Ocorreu um erro.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const insumosDisponiveis = insumosContrato.filter(insumo => insumo.saldo > 0 && !itensPedido.find(ip => ip.insumo.id === insumo.id));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo Pedido</Button></DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><ShoppingCart /> Novo Pedido de Almoxarifado</DialogTitle>
                <DialogDescription>Selecione um contrato e adicione os insumos para as unidades.</DialogDescription>
            </DialogHeader>

            {/* Conteúdo principal do diálogo... */}
            <div className="space-y-6">
                {/* Seleção de Contrato e Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select value={selectedContratoId} onValueChange={handleSelecionarContrato}>
                        <SelectTrigger><SelectValue placeholder="Selecione um contrato..." /></SelectTrigger>
                        <SelectContent>{contratos.map(c => <SelectItem key={c.id} value={c.id}>{c.numero} - {c.fornecedor.nome}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input id="dataEntrega" type="date" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} />
                </div>

                {/* Lista de Insumos Disponíveis */}
                {selectedContratoId && (
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Package2 /> Itens Disponíveis</CardTitle></CardHeader>
                        <CardContent>
                          {isLoading ? <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div> :
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {insumosDisponiveis.map(insumo => (
                                    <Card key={insumo.id} className="p-3">
                                        <h4 className="font-medium text-sm">{insumo.nome}</h4>
                                        <p className="text-xs text-muted-foreground">Saldo: {insumo.saldo} {insumo.unidadeMedida.sigla}</p>
                                        <Button size="sm" onClick={() => handleAdicionarItem(insumo)} className="w-full mt-2"><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
                                    </Card>
                                ))}
                            </div>
                          }
                        </CardContent>
                    </Card>
                )}
                
                {/* Itens Adicionados ao Pedido */}
                {itensPedido.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle>Itens do Pedido</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {itensPedido.map(item => (
                                <div key={item.insumo.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                      <h4 className="font-medium">{item.insumo.nome}</h4>
                                      <Button variant="destructive" size="sm" onClick={() => handleRemoverItem(item.insumo.id)}><Minus className="h-3 w-3" /></Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                                        {item.unidades.map(unidade => (
                                            <div key={unidade.unidadeId} className="space-y-2">
                                                <Label className="text-sm font-medium flex items-center gap-1"><Building2 className="h-3 w-3"/>{unidade.unidadeNome}</Label>
                                                <Input type="number" min="0" max={item.insumo.saldo} value={unidade.quantidade || 0} onChange={(e) => handleQuantidadeChange(item.insumo.id, unidade.unidadeId, parseInt(e.target.value) || 0)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div className="flex justify-end items-center font-bold text-lg">
                                Total do Pedido: R$ {calcularTotalPedido().toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                )}

            </div>
            
            <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>Cancelar</Button>
                <Button onClick={handleSalvar} disabled={isLoading}><Loader2 className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : 'hidden'}`} /> Criar Pedido</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
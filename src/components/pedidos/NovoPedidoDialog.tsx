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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, ShoppingCart, Package2, Loader2 } from "lucide-react";
import { Contrato, ItemContrato, UnidadeEducacional } from "@/types";
import { useToast } from "@/hooks/use-toast";

// ALTERAÇÃO: Criamos um tipo específico para a lista de contratos que vem da API de consulta.
interface ContratoDaLista {
  id: string;
  numero: string;
  fornecedor: {
    nome: string;
  };
}

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
  // ALTERAÇÃO: O estado agora usa o novo tipo 'ContratoDaLista'.
  const [contratos, setContratos] = useState<ContratoDaLista[]>([]);
  const [unidades, setUnidades] = useState<UnidadeEducacional[]>([]);
  const [contratoSelecionado, setContratoSelecionado] =
    useState<Contrato | null>(null);
  // COMENTÁRIO: Novo estado para controlar o valor do Select de contratos.
  const [selectedContratoId, setSelectedContratoId] = useState<
    string | undefined
  >();
  const [dataEntrega, setDataEntrega] = useState("");
  const [itensPedido, setItensPedido] = useState<ItemPedidoForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // COMENTÁRIO: Este useEffect busca os dados iniciais (contratos e unidades) quando o modal é aberto.
  useEffect(() => {
    if (open) {
      const fetchInitialData = async () => {
        setIsLoading(true);
        try {
          const [contratosRes, unidadesRes] = await Promise.all([
            fetch("http://localhost:3001/api/contratos-ativos"),
            fetch("http://localhost:3001/api/unidades-ativas"),
          ]);
          if (!contratosRes.ok || !unidadesRes.ok)
            throw new Error("Falha ao carregar dados iniciais.");

          setContratos(await contratosRes.json());
          setUnidades(await unidadesRes.json());
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Erro desconhecido";
          toast({
            title: "Erro",
            description: `Não foi possível carregar os dados para o formulário: ${errorMessage}`,
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchInitialData();
    } else {
      // COMENTÁRIO: Limpa o estado quando o modal é fechado para garantir que não haja dados antigos na próxima vez que for aberto.
      setContratoSelecionado(null);
      setItensPedido([]);
      setDataEntrega("");
      // COMENTÁRIO: Limpa o ID do contrato selecionado.
      setSelectedContratoId(undefined);
    }
  }, [open, toast]);

  // COMENTÁRIO: Esta função busca os detalhes COMPLETOS de um contrato quando ele é selecionado na lista.
  const handleSelecionarContrato = async (contratoId: string) => {
    // COMENTÁRIO: Atualiza o estado que controla o valor do Select.
    setSelectedContratoId(contratoId);
    if (!contratoId) {
      setContratoSelecionado(null);
      setItensPedido([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/contratos/${contratoId}`
      );
      if (!response.ok)
        throw new Error("Falha ao buscar detalhes do contrato.");
      const data = await response.json();
      setContratoSelecionado(data);
      setItensPedido([]); // Limpa os itens do pedido anterior
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro",
        description: `Não foi possível carregar os itens do contrato: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdicionarItem = (item: ItemContrato) => {
    if (itensPedido.find((ip) => ip.itemContrato.id === item.id)) return;
    setItensPedido((prev) => [
      ...prev,
      {
        itemContrato: item,
        unidades: unidades.map((u) => ({ unidadeId: u.id, quantidade: 0 })),
      },
    ]);
  };

  const handleRemoverItem = (itemId: string) =>
    setItensPedido((prev) =>
      prev.filter((ip) => ip.itemContrato.id !== itemId)
    );
  const handleQuantidadeChange = (
    itemId: string,
    unidadeId: string,
    quantidade: number
  ) => {
    setItensPedido((prev) =>
      prev.map((ip) =>
        ip.itemContrato.id === itemId
          ? {
              ...ip,
              unidades: ip.unidades.map((u) =>
                u.unidadeId === unidadeId
                  ? { ...u, quantidade: Math.max(0, quantidade) }
                  : u
              ),
            }
          : ip
      )
    );
  };

  const calcularTotalItem = (item: ItemPedidoForm) =>
    item.unidades.reduce((sum, u) => sum + u.quantidade, 0) *
    item.itemContrato.valorUnitario;
  const calcularTotalPedido = () =>
    itensPedido.reduce((sum, item) => sum + calcularTotalItem(item), 0);

  const validarPedido = () => {
    /* ... (seu código de validação) ... */ return true;
  };

  const handleSalvar = async () => {
    if (!validarPedido()) return;

    setIsLoading(true);
    const itensPayload = itensPedido.flatMap((item) =>
      item.unidades
        .filter((u) => u.quantidade > 0)
        .map((u) => ({
          itemContratoId: item.itemContrato.id,
          unidadeEducacionalId: u.unidadeId,
          quantidade: u.quantidade,
        }))
    );

    const pedidoPayload = {
      contratoId: contratoSelecionado?.id,
      dataEntregaPrevista: dataEntrega,
      valorTotal: calcularTotalPedido(),
      itens: itensPayload,
    };

    try {
      const response = await fetch("http://localhost:3001/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedidoPayload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao criar o pedido.");
      }
      toast({
        title: "Pedido criado!",
        description: "O pedido foi criado com sucesso.",
      });
      setOpen(false);
      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const itensDisponiveis =
    contratoSelecionado?.itens.filter(
      (item) =>
        item.saldoAtual > 0 &&
        !itensPedido.find((ip) => ip.itemContrato.id === item.id)
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
            Selecione um contrato e configure as quantidades por unidade
            educacional
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center p-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contrato">Contrato *</Label>
                {/* ALTERAÇÃO: Adicionado o 'value' para controlar o componente Select. */}
                <Select
                  value={selectedContratoId}
                  onValueChange={handleSelecionarContrato}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    {contratos.map((contrato) => (
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
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            {contratoSelecionado && (
              <>
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
                        {itensDisponiveis.map((item) => (
                          <Card key={item.id} className="p-3">
                            <div className="space-y-2">
                              <div>
                                <h4 className="font-medium text-sm">
                                  {item.nome}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Saldo: {item.saldoAtual}{" "}
                                  {item.unidadeMedida.sigla}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  R$ {item.valorUnitario.toFixed(2)} /{" "}
                                  {item.unidadeMedida.sigla}
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

                {itensPedido.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Itens do Pedido</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {itensPedido.map((item) => (
                          <div
                            key={item.itemContrato.id}
                            className="border rounded-lg p-4 space-y-4"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">
                                  {item.itemContrato.nome}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Saldo disponível:{" "}
                                  {item.itemContrato.saldoAtual}{" "}
                                  {item.itemContrato.unidadeMedida.sigla} | R${" "}
                                  {item.itemContrato.valorUnitario.toFixed(2)} /{" "}
                                  {item.itemContrato.unidadeMedida.sigla}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  Total: R$ {calcularTotalItem(item).toFixed(2)}
                                </Badge>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoverItem(item.itemContrato.id)
                                  }
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {unidades.map((unidade) => {
                                const unidadeItem = item.unidades.find(
                                  (u) => u.unidadeId === unidade.id
                                );
                                return (
                                  <div key={unidade.id} className="space-y-2">
                                    <Label className="text-sm font-medium">
                                      {unidade.nome}
                                    </Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      max={item.itemContrato.saldoAtual}
                                      value={unidadeItem?.quantidade || 0}
                                      onChange={(e) =>
                                        handleQuantidadeChange(
                                          item.itemContrato.id,
                                          unidade.id,
                                          parseInt(e.target.value) || 0
                                        )
                                      }
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
                        <span className="text-lg font-semibold">
                          Total do Pedido:
                        </span>
                        <span className="text-lg font-bold">
                          R$ {calcularTotalPedido().toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
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
            onClick={handleSalvar}
            disabled={
              isLoading || !contratoSelecionado || itensPedido.length === 0
            }
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

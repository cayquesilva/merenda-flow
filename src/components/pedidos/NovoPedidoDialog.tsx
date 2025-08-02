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
import {
  Plus,
  Minus,
  ShoppingCart,
  Package2,
  Loader2,
  Building2,
} from "lucide-react";
// Importar as interfaces completas do seu arquivo de tipos
import {
  Contrato,
  ItemContrato,
  UnidadeEducacional,
  TipoEstudante,
  PercapitaItem,
} from "@/types";
import { useToast } from "@/hooks/use-toast";

// Interface para o item de contrato com a nova estrutura de estoque
interface ItemContratoDetalhado extends ItemContrato {
  unidadeMedida: {
    id: string;
    sigla: string;
    nome: string;
  };
  contrato: {
    id: string;
    numero: string;
    fornecedor: {
      nome: string;
    };
  };
  percapitas: PercapitaItem[]; // Adicionado para incluir a percápita
}

// Interface para a lista de contratos que vem da API
interface ContratoDaLista {
  id: string;
  numero: string;
  fornecedor: {
    nome: string;
  };
}

// Interface para os itens do formulário de pedido
interface ItemPedidoForm {
  itemContrato: ItemContratoDetalhado;
  unidades: {
    unidadeId: string;
    quantidade: number;
    unidadeNome: string;
    tipoEstoque: string;
    sugestao: number; // Nova propriedade para armazenar a sugestão de quantidade
  }[];
}

interface NovoPedidoDialogProps {
  onSuccess: () => void;
}

export function NovoPedidoDialog({ onSuccess }: NovoPedidoDialogProps) {
  const [open, setOpen] = useState(false);
  const [contratos, setContratos] = useState<ContratoDaLista[]>([]);
  const [unidades, setUnidades] = useState<UnidadeEducacional[]>([]);
  const [contratoSelecionado, setContratoSelecionado] =
    useState<Contrato | null>(null);
  const [selectedContratoId, setSelectedContratoId] = useState<
    string | undefined
  >();
  const [dataEntrega, setDataEntrega] = useState("");
  const [itensPedido, setItensPedido] = useState<ItemPedidoForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tiposEstudante, setTiposEstudante] = useState<TipoEstudante[]>([]);
  const { toast } = useToast();

  // COMENTÁRIO: Estado para armazenar os itens do contrato com suas percápitas
  const [itensContratoComPercapita, setItensContratoComPercapita] = useState<
    ItemContratoDetalhado[]
  >([]);

  useEffect(() => {
    if (open) {
      const fetchInitialData = async () => {
        setIsLoading(true);
        try {
          // Busca a lista de contratos e as unidades com detalhes de estudantes
          const [contratosRes, unidadesRes, tiposEstudanteRes] =
            await Promise.all([
              fetch(
                `${
                  import.meta.env.VITE_API_URL || "http://localhost:3001"
                }/api/contratos-ativos`
              ),
              fetch(
                `${
                  import.meta.env.VITE_API_URL || "http://localhost:3001"
                }/api/unidades-ativas-detalhes`
              ),
              fetch(
                `${
                  import.meta.env.VITE_API_URL || "http://localhost:3001"
                }/api/tipos-estudante`
              ),
            ]);

          if (!contratosRes.ok || !unidadesRes.ok || !tiposEstudanteRes.ok)
            throw new Error("Falha ao carregar dados iniciais.");

          setContratos(await contratosRes.json());
          setUnidades(await unidadesRes.json());
          setTiposEstudante(await tiposEstudanteRes.json());
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
      setContratoSelecionado(null);
      setItensPedido([]);
      setDataEntrega("");
      setSelectedContratoId(undefined);
      setItensContratoComPercapita([]);
    }
  }, [open, toast]);

  const handleSelecionarContrato = async (contratoId: string) => {
    setSelectedContratoId(contratoId);
    if (!contratoId) {
      setContratoSelecionado(null);
      setItensPedido([]);
      setItensContratoComPercapita([]);
      return;
    }
    setIsLoading(true);
    try {
      const [contratoRes, itensPercapitaRes] = await Promise.all([
        fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:3001"
          }/api/contratos/${contratoId}`
        ),
        fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:3001"
          }/api/percapita/itens-por-contrato/${contratoId}`
        ),
      ]);

      if (!contratoRes.ok || !itensPercapitaRes.ok)
        throw new Error("Falha ao buscar detalhes do contrato ou percápitas.");

      const contratoData = await contratoRes.json();
      const itensPercapitaData: ItemContratoDetalhado[] =
        await itensPercapitaRes.json();

      setContratoSelecionado(contratoData);
      setItensContratoComPercapita(itensPercapitaData);
      setItensPedido([]);
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

  const calcularSugestaoQuantidade = (
    itemContrato: ItemContratoDetalhado,
    unidade: UnidadeEducacional
  ) => {
    let quantidadeSugerida = 0;

    // Itera sobre as percápitas DO ITEM ESPECÍFICO, e não sobre todos os tipos de estudante
    itemContrato.percapitas.forEach((percapita) => {
      let numEstudantes = 0;

      // Mapeia a contagem de estudantes com base no tipo de estudante da percápita
      switch (percapita.tipoEstudante.id) {
        case "bercario":
          numEstudantes = unidade.estudantesBercario;
          break;
        case "maternal":
          numEstudantes = unidade.estudantesMaternal;
          break;
        case "pre":
          numEstudantes = unidade.estudantesPreEscola;
          break;
        case "regular":
          numEstudantes = unidade.estudantesRegular;
          break;
        case "integral":
          numEstudantes = unidade.estudantesIntegral;
          break;
        case "eja":
          numEstudantes = unidade.estudantesEja;
          break;
      }

      if (numEstudantes > 0) {
        const consumoMensalG =
          percapita.gramagemPorEstudante * percapita.frequenciaMensal;

        const fatorConversao =
          itemContrato.unidadeMedida.sigla.toLowerCase() === "kg" ? 1000 : 1;

        quantidadeSugerida += (consumoMensalG * numEstudantes) / fatorConversao;
      }
    });

    return Math.max(0, Math.ceil(quantidadeSugerida));
  };

  const handleAdicionarItem = (item: ItemContratoDetalhado) => {
    if (itensPedido.find((ip) => ip.itemContrato.id === item.id)) return;

    const unidadesComSugestao = unidades.map((u) => {
      const isCreche =
        u.estudantesBercario > 0 ||
        u.estudantesMaternal > 0 ||
        u.estudantesPreEscola > 0;
      const tipoEstoque = isCreche ? "creche" : "escola";

      const sugestao = calcularSugestaoQuantidade(item, u);

      return {
        unidadeId: u.id,
        quantidade: sugestao,
        unidadeNome: u.nome,
        tipoEstoque,
        sugestao,
      };
    });

    setItensPedido((prev) => [
      ...prev,
      {
        itemContrato: item,
        unidades: unidadesComSugestao,
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
    if (!contratoSelecionado || !dataEntrega) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o contrato e o prazo de entrega.",
        variant: "destructive",
      });
      return false;
    }

    if (itensPedido.length === 0) {
      toast({
        title: "Nenhum item adicionado",
        description: "Adicione pelo menos um item ao pedido.",
        variant: "destructive",
      });
      return false;
    }

    const saldosCreche: Record<string, number> = {};
    const saldosEscola: Record<string, number> = {};

    contratoSelecionado.itens.forEach((item) => {
      saldosCreche[item.id] = item.saldoCreche;
      saldosEscola[item.id] = item.saldoEscola;
    });

    for (const item of itensPedido) {
      let totalCrechePedido = 0;
      let totalEscolaPedido = 0;

      item.unidades.forEach((u) => {
        const unidade = unidades.find((un) => un.id === u.unidadeId);
        if (!unidade) return;

        const isCreche =
          unidade.estudantesBercario > 0 ||
          unidade.estudantesMaternal > 0 ||
          unidade.estudantesPreEscola > 0;
        if (isCreche) {
          totalCrechePedido += u.quantidade;
        } else {
          totalEscolaPedido += u.quantidade;
        }
      });

      if (totalCrechePedido > (saldosCreche[item.itemContrato.id] ?? 0)) {
        toast({
          title: "Saldo Insuficiente (Creche)",
          description: `O item "${item.itemContrato.nome}" ultrapassa o saldo disponível para creches.`,
          variant: "destructive",
        });
        return false;
      }

      if (totalEscolaPedido > (saldosEscola[item.itemContrato.id] ?? 0)) {
        toast({
          title: "Saldo Insuficiente (Escola)",
          description: `O item "${item.itemContrato.nome}" ultrapassa o saldo disponível para escolas.`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
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
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/pedidos`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pedidoPayload),
        }
      );
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
    itensContratoComPercapita.filter(
      (item) =>
        (item.saldoCreche > 0 || item.saldoEscola > 0) &&
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
                                  Saldo: Cre: {item.saldoCreche} | Esc:{" "}
                                  {item.saldoEscola} | Total: {item.saldoAtual}{" "}
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
                              {item.unidades.map((unidade) => {
                                return (
                                  <div
                                    key={unidade.unidadeId}
                                    className="space-y-2"
                                  >
                                    <Label className="text-sm font-medium">
                                      <div className="flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        {unidade.unidadeNome}
                                        {unidade.tipoEstoque && (
                                          <Badge
                                            variant="secondary"
                                            className="ml-2"
                                          >
                                            {unidade.tipoEstoque}
                                          </Badge>
                                        )}
                                      </div>
                                    </Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      max={
                                        unidade.tipoEstoque === "creche"
                                          ? item.itemContrato.saldoCreche
                                          : item.itemContrato.saldoEscola
                                      }
                                      value={unidade.quantidade || 0}
                                      onChange={(e) =>
                                        handleQuantidadeChange(
                                          item.itemContrato.id,
                                          unidade.unidadeId,
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                      placeholder={
                                        unidade.sugestao > 0
                                          ? `Sugestão: ${unidade.sugestao}`
                                          : "0"
                                      }
                                      disabled={unidade.sugestao === 0} // Desabilita o input se não houver sugestão
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {unidade.sugestao > 0
                                        ? `Sugerido: ${unidade.sugestao}${" "}${item.itemContrato.unidadeMedida.sigla}`
                                        : "Cadastre a percápita"}
                                    </p>
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

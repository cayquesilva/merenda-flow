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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [tipoDePedidoAtivo, setTipoDePedidoAtivo] = useState<
    "creche" | "escola" | null
  >(null); // NOVO ESTADO

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
      setTipoDePedidoAtivo(null); // RESETAR AQUI
    }
  }, [open, toast]);

  const handleSelecionarContrato = async (contratoId: string) => {
    setSelectedContratoId(contratoId);
    if (!contratoId) {
      setContratoSelecionado(null);
      setItensPedido([]);
      setItensContratoComPercapita([]);
      setTipoDePedidoAtivo(null); // E RESETAR AQUI TAMBÉM

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
        throw new Error("Falha ao buscar detalhes do contrato ou per cápitas.");

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
    // 1. Calcula o consumo total necessário em GRAMAS para a unidade educacional
    let totalConsumoEmGramas = 0;
    itemContrato.percapitas.forEach((percapita) => {
      let numEstudantes = 0;
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

      if (numEstudantes > 0 && percapita.ativo) {
        const consumoMensalPorEstudante =
          percapita.gramagemPorEstudante * percapita.frequenciaMensal;
        totalConsumoEmGramas += consumoMensalPorEstudante * numEstudantes;
      }
    });

    if (totalConsumoEmGramas === 0) {
      return 0;
    }

    // 2. Converte o total em gramas para a unidade de medida do CONTRATO
    let quantidadeSugerida = 0;
    const siglaUnidade = itemContrato.unidadeMedida.sigla.toLowerCase();
    const gramagemPacote = itemContrato.gramagemPorPacote;

    if (siglaUnidade === "pct" && gramagemPacote && gramagemPacote > 0) {
      // Se for pacote, divide o total de gramas pela gramagem do pacote
      quantidadeSugerida = totalConsumoEmGramas / gramagemPacote;
    } else if (siglaUnidade === "kg") {
      // Se for Kg, divide por 1000
      quantidadeSugerida = totalConsumoEmGramas / 1000;
    } else {
      // Para outras unidades (Un, L, etc.), a sugestão considera 1 para 1 (assumindo que a percápita representa a unidade)
      // Esta parte pode ser ajustada se a lógica for diferente
      quantidadeSugerida = totalConsumoEmGramas;
    }

    // 3. Arredonda para cima, pois não se pode pedir frações de um pacote ou item.
    return Math.ceil(quantidadeSugerida);
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
        quantidade: 0,
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

  const handleTabChange = (novoTipoAtivo: "creche" | "escola") => {
    // Define o tipo de pedido para a sessão atual do diálogo
    setTipoDePedidoAtivo(novoTipoAtivo);

    // Itera sobre todos os itens já adicionados ao pedido
    setItensPedido((prevItens) =>
      prevItens.map((item) => {
        // Recalcula as quantidades para todas as unidades baseado na aba selecionada
        const novasUnidades = item.unidades.map((unidade) => {
          let novaQuantidade = 0;
          // Se a unidade pertence à aba ativa, calcula a sugestão
          if (unidade.tipoEstoque === novoTipoAtivo) {
            novaQuantidade = calcularSugestaoQuantidade(
              item.itemContrato,
              unidades.find((u) => u.id === unidade.unidadeId)! // Encontra a unidade completa para o cálculo
            );
          }
          // Se não pertence, a quantidade é 0.
          return { ...unidade, quantidade: novaQuantidade };
        });

        return { ...item, unidades: novasUnidades };
      })
    );
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

    if (calcularTotalPedido() <= 0) {
      toast({
        title: "Pedido sem valor",
        description:
          "O valor total do pedido não pode ser R$ 0,00. Verifique as quantidades.",
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
                            {/* NOVO: Estrutura de Abas para separar Creches e Escolas */}
                            <Tabs
                              defaultValue="creches"
                              className="w-full"
                              value={tipoDePedidoAtivo ?? ""}
                              onValueChange={(value) =>
                                handleTabChange(value as "creche" | "escola")
                              }
                            >
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="creche">
                                  Pedido para Creches
                                </TabsTrigger>
                                <TabsTrigger value="escola">
                                  Pedido para Escolas
                                </TabsTrigger>
                              </TabsList>

                              {/* Conteúdo da Aba de Creches */}
                              <TabsContent value="creche">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                                  {item.unidades
                                    .filter(
                                      (unidade) =>
                                        unidade.tipoEstoque === "creche"
                                    )
                                    .map((unidade) => (
                                      <div
                                        key={unidade.unidadeId}
                                        className="space-y-2"
                                      >
                                        <Label className="text-sm font-medium">
                                          <div className="flex items-center gap-1">
                                            <Building2 className="h-3 w-3" />
                                            {unidade.unidadeNome}
                                          </div>
                                        </Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          max={item.itemContrato.saldoCreche}
                                          value={unidade.quantidade || 0}
                                          onChange={(e) =>
                                            handleQuantidadeChange(
                                              item.itemContrato.id,
                                              unidade.unidadeId,
                                              parseInt(e.target.value) || 0
                                            )
                                          }
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Sugerido: {unidade.sugestao}{" "}
                                          {
                                            item.itemContrato.unidadeMedida
                                              .sigla
                                          }
                                        </p>
                                      </div>
                                    ))}
                                </div>
                              </TabsContent>

                              {/* Conteúdo da Aba de Escolas */}
                              <TabsContent value="escola">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                                  {item.unidades
                                    .filter(
                                      (unidade) =>
                                        unidade.tipoEstoque === "escola"
                                    )
                                    .map((unidade) => (
                                      <div
                                        key={unidade.unidadeId}
                                        className="space-y-2"
                                      >
                                        <Label className="text-sm font-medium">
                                          <div className="flex items-center gap-1">
                                            <Building2 className="h-3 w-3" />
                                            {unidade.unidadeNome}
                                          </div>
                                        </Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          max={item.itemContrato.saldoEscola}
                                          value={unidade.quantidade || 0}
                                          onChange={(e) =>
                                            handleQuantidadeChange(
                                              item.itemContrato.id,
                                              unidade.unidadeId,
                                              parseInt(e.target.value) || 0
                                            )
                                          }
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Sugerido: {unidade.sugestao}{" "}
                                          {
                                            item.itemContrato.unidadeMedida
                                              .sigla
                                          }
                                        </p>
                                      </div>
                                    ))}
                                </div>
                              </TabsContent>
                            </Tabs>
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
              isLoading ||
              !contratoSelecionado ||
              itensPedido.length === 0 ||
              calcularTotalPedido() <= 0
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

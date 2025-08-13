import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Package, Loader2 } from "lucide-react";
// Importar as interfaces completas do seu arquivo de tipos
import { Contrato, ItemContrato, Fornecedor, UnidadeMedida } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface FornecedorLista {
  id: string;
  nome: string;
}
interface UnidadeMedidaLista {
  id: string;
  nome: string;
  sigla: string;
}
type ContratoStatus = "ativo" | "inativo" | "vencido"; // Ajustado para corresponder aos seus tipos de contrato

interface ContratoDialogProps {
  contrato?: Contrato | null; // Pode ser Contrato completo ou nulo/indefinido
  onSuccess: () => void;
  open?: boolean; // Adicionado para controlar o diálogo externamente
  onOpenChange?: (open: boolean) => void; // Adicionado para controlar o diálogo externamente
}

export function ContratoDialog({
  contrato,
  onSuccess,
  open: propOpen,
  onOpenChange,
}: ContratoDialogProps) {
  // Usar o estado interno se não for controlado por props, caso contrário, usar propOpen
  const [open, setOpen] = useState(propOpen !== undefined ? propOpen : false);
  useEffect(() => {
    if (propOpen !== undefined) {
      setOpen(propOpen);
    }
  }, [propOpen]);

  const { toast } = useToast();
  const isEdicao = !!contrato;

  const [formData, setFormData] = useState({
    numero: "",
    fornecedorId: "",
    dataInicio: "",
    dataFim: "",
    valorTotal: 0,
    status: "ativo" as ContratoStatus,
  });
  const [itens, setItens] = useState<Partial<ItemContrato>[]>([]); // Inicializa como array vazio

  const [fornecedores, setFornecedores] = useState<FornecedorLista[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadeMedidaLista[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // COMENTÁRIO: Este useEffect foi reestruturado para ser mais robusto.
  useEffect(() => {
    if (open) {
      // Apenas executa quando o diálogo está aberto
      const fetchInitialData = async () => {
        setIsLoading(true);
        try {
          // 1. Busca os dados de suporte (fornecedores e unidades) em paralelo.
          const [fornecedoresRes, unidadesRes] = await Promise.all([
            fetch(
              `${
                import.meta.env.VITE_API_URL || "http://localhost:3001"
              }/api/fornecedores/lista`
            ),
            fetch(
              `${
                import.meta.env.VITE_API_URL || "http://localhost:3001"
              }/api/unidades-medida`
            ),
          ]);

          if (!fornecedoresRes.ok || !unidadesRes.ok) {
            throw new Error(
              "Falha ao carregar dados de suporte do formulário."
            );
          }

          setFornecedores(await fornecedoresRes.json());
          setUnidadesMedida(await unidadesRes.json());

          // 2. Popula o formulário se estiver em modo de edição e 'contrato' estiver disponível
          if (isEdicao && contrato) {
            setFormData({
              numero: contrato.numero,
              fornecedorId: contrato.fornecedor.id, // Acessa o ID do fornecedor completo
              dataInicio: new Date(contrato.dataInicio)
                .toISOString()
                .split("T")[0],
              dataFim: new Date(contrato.dataFim).toISOString().split("T")[0],
              valorTotal: contrato.valorTotal,
              status: contrato.status as ContratoStatus,
            });
            setItens(contrato.itens); // Assume que contrato.itens já é o tipo correto
          } else {
            // Se for modo de criação, reseta o formulário.
            resetForm();
          }
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
          // Se houver um erro ao carregar dados, feche o diálogo
          if (onOpenChange) onOpenChange(false);
          setOpen(false); // Garante que o estado interno também seja atualizado
        } finally {
          setIsLoading(false);
        }
      };
      fetchInitialData();
    } else {
      // Quando o diálogo fecha, reseta o formulário para o próximo uso
      resetForm();
    }
  }, [open, contrato, isEdicao, toast, onOpenChange]); // Adicionado onOpenChange às dependências

  const resetForm = () => {
    setFormData({
      numero: "",
      fornecedorId: "",
      dataInicio: "",
      dataFim: "",
      valorTotal: 0,
      status: "ativo",
    });
    setItens([
      {
        nome: "",
        unidadeMedidaId: "",
        valorUnitario: 0,
        quantidadeOriginal: 0,
        saldoAtual: 0,
        // Novos campos
        quantidadeCreche: 0,
        quantidadeEscola: 0,
        saldoCreche: 0,
        saldoEscola: 0,
      },
    ]);
  };

  useEffect(() => {
    const total = itens.reduce(
      (acc, item) =>
        acc +
        (item.valorUnitario || 0) *
          ((item.quantidadeCreche || 0) + (item.quantidadeEscola || 0)),
      0
    );
    setFormData((prev) => ({ ...prev, valorTotal: total }));
  }, [itens]);

  const adicionarItem = () =>
    setItens([
      ...itens,
      {
        nome: "",
        unidadeMedidaId: "",
        valorUnitario: 0,
        quantidadeOriginal: 0,
        saldoAtual: 0,
        quantidadeCreche: 0,
        quantidadeEscola: 0,
        saldoCreche: 0,
        saldoEscola: 0,
        gramagemPorPacote: 0,
      },
    ]);

  const removerItem = (index: number) => {
    if (itens.length > 1) setItens(itens.filter((_, i) => i !== index));
  };

  type CamposItem =
    | "nome"
    | "unidadeMedidaId"
    | "valorUnitario"
    | "quantidadeOriginal"
    | "saldoAtual"
    | "quantidadeCreche"
    | "quantidadeEscola"
    | "saldoCreche"
    | "saldoEscola"
    | "gramagemPorPacote";

  // Função para atualizar item com tipagem forte usando sobrecarga
  function atualizarItem(
    index: number,
    campo: "nome" | "unidadeMedidaId",
    valor: string
  ): void;
  function atualizarItem(
    index: number,
    campo:
      | "valorUnitario"
      | "quantidadeCreche"
      | "quantidadeEscola"
      | "gramagemPorPacote",
    valor: number
  ): void;
  function atualizarItem(
    index: number,
    campo: CamposItem,
    valor: string | number
  ) {
    setItens((prevItens) => {
      const novosItens = [...prevItens];
      const item = novosItens[index];

      // Atualiza o campo específico
      if (typeof valor === "string") {
        item[campo as "nome" | "unidadeMedidaId"] = valor;
      } else if (typeof valor === "number") {
        item[
          campo as
            | "valorUnitario"
            | "quantidadeCreche"
            | "quantidadeEscola"
            | "gramagemPorPacote"
        ] = valor;
      }

      // Lógica de cálculo inversa para quantidadeOriginal e saldoAtual
      if (campo === "quantidadeCreche" || campo === "quantidadeEscola") {
        const quantidadeCreche = novosItens[index].quantidadeCreche || 0;
        const quantidadeEscola = novosItens[index].quantidadeEscola || 0;
        const novaQuantidadeOriginal = quantidadeCreche + quantidadeEscola;

        novosItens[index].quantidadeOriginal = novaQuantidadeOriginal;
        novosItens[index].saldoAtual = novaQuantidadeOriginal;
      }

      return novosItens;
    });
  }

  const handleSubmit = async () => {
    if (
      !formData.numero.trim() ||
      !formData.fornecedorId ||
      !formData.dataInicio ||
      !formData.dataFim
    ) {
      toast({
        title: "Campos Obrigatórios",
        description:
          "Por favor, preencha o número do contrato, fornecedor e as datas.",
        variant: "destructive",
      });
      return;
    }

    // Validação dos itens
    if (
      itens.some(
        (item) =>
          !item.nome ||
          !item.unidadeMedidaId ||
          (item.quantidadeCreche || 0) + (item.quantidadeEscola || 0) <= 0
      )
    ) {
      toast({
        title: "Itens Inválidos",
        description:
          "Verifique se todos os itens possuem nome, unidade de medida e pelo menos uma quantidade (creche ou escola) maior que zero.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // O payload agora usará os campos de quantidade separados
    const itensPayload = itens.map((item) => ({
      nome: item.nome,
      unidadeMedidaId: item.unidadeMedidaId,
      valorUnitario: Number(item.valorUnitario),
      // Campos calculados no frontend para o backend
      quantidadeOriginal:
        Number(item.quantidadeCreche || 0) + Number(item.quantidadeEscola || 0),
      saldoAtual:
        Number(item.quantidadeCreche || 0) + Number(item.quantidadeEscola || 0),
      // Novos campos de quantidade
      quantidadeCreche: Number(item.quantidadeCreche),
      quantidadeEscola: Number(item.quantidadeEscola),
      saldoCreche: Number(item.quantidadeCreche),
      saldoEscola: Number(item.quantidadeEscola),
      gramagemPorPacote: Number(item.gramagemPorPacote) || null,
    }));

    const contratoPayload = {
      ...formData,
      dataInicio: new Date(formData.dataInicio).toISOString(),
      dataFim: new Date(formData.dataFim).toISOString(),
      // Itens só são enviados na criação
      ...(!isEdicao && { itens: itensPayload }),
    };

    try {
      // O contrato.id só estará disponível se isEdicao for true e contrato não for null
      const url =
        isEdicao && contrato?.id
          ? `${
              import.meta.env.VITE_API_URL || "http://localhost:3001"
            }/api/contratos/${contrato.id}`
          : `${
              import.meta.env.VITE_API_URL || "http://localhost:3001"
            }/api/contratos`;
      const method = isEdicao ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contratoPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ocorreu um erro no servidor.");
      }

      toast({
        title: "Sucesso!",
        description: `Contrato ${
          isEdicao ? "atualizado" : "cadastrado"
        } com sucesso.`,
      });
      // Se o diálogo for controlado externamente, use onOpenChange
      if (onOpenChange) onOpenChange(false);
      setOpen(false); // Garante que o estado interno também seja atualizado
      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro desconhecido.";
      toast({
        title: "Erro ao Salvar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para lidar com a mudança de estado do diálogo (interno ou externo)
  const handleOpenChangeInternal = (newOpenState: boolean) => {
    setOpen(newOpenState);
    if (onOpenChange) {
      onOpenChange(newOpenState);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChangeInternal}>
      <DialogTrigger asChild>
        {/* Renderiza o botão de "Novo Contrato" apenas se não estiver em modo de edição */}
        {!isEdicao && (
          <Button variant="default">
            <Plus className="mr-2 h-4 w-4" />
            Novo Contrato
          </Button>
        )}
        {/* Se estiver em modo de edição, o botão de edição será renderizado no componente pai (Contratos.tsx) */}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-popover-foreground">
            {isEdicao ? "Editar Contrato" : "Novo Contrato"}
          </DialogTitle>
          <DialogDescription>
            {isEdicao
              ? "Edite as informações do contrato"
              : "Cadastre um novo contrato de merenda"}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center p-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero">Número do Contrato *</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) =>
                    setFormData({ ...formData, numero: e.target.value })
                  }
                  placeholder="CT-2024-001"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="fornecedor">Fornecedor *</Label>
                <Select
                  value={formData.fornecedorId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, fornecedorId: value })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((fornecedor) => (
                      <SelectItem key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dataInicio">Data de Início *</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) =>
                    setFormData({ ...formData, dataInicio: e.target.value })
                  }
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="dataFim">Data de Fim *</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={formData.dataFim}
                  onChange={(e) =>
                    setFormData({ ...formData, dataFim: e.target.value })
                  }
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: ContratoStatus) =>
                    setFormData({ ...formData, status: value })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Itens do Contrato
                  </CardTitle>
                  <Button
                    onClick={adicionarItem}
                    size="sm"
                    disabled={isSubmitting || isEdicao}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {itens.map((item, index) => {
                    // NOVO: Lógica para verificar se a unidade selecionada é "Pacote"
                    const unidadeSelecionada = unidadesMedida.find(
                      (u) => u.id === item.unidadeMedidaId
                    );
                    const isPacote =
                      unidadeSelecionada?.sigla.toLowerCase() === "pct";

                    return (
                      <Card key={item.id || index} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
                          <div className="md:col-span-2">
                            <Label>Nome do Item *</Label>
                            <Input
                              value={item.nome || ""}
                              onChange={(e) =>
                                atualizarItem(index, "nome", e.target.value)
                              }
                              placeholder="Ex: Arroz integral"
                              disabled={isSubmitting || isEdicao}
                            />
                          </div>
                          <div>
                            <Label>Unidade de Medida *</Label>
                            <Select
                              value={item.unidadeMedidaId || ""}
                              onValueChange={(value) =>
                                atualizarItem(index, "unidadeMedidaId", value)
                              }
                              disabled={isSubmitting || isEdicao}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar" />
                              </SelectTrigger>
                              <SelectContent>
                                {unidadesMedida.map((unidade) => (
                                  <SelectItem
                                    key={unidade.id}
                                    value={unidade.id}
                                  >
                                    {unidade.sigla} - {unidade.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* NOVO: Campo condicional para Gramagem do Pacote */}
                          {isPacote && (
                            <div>
                              <Label>Gramagem (g) *</Label>
                              <Input
                                type="number"
                                value={item.gramagemPorPacote || ""}
                                onChange={(e) =>
                                  atualizarItem(
                                    index,
                                    "gramagemPorPacote",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="Ex: 500"
                                disabled={isEdicao}
                              />
                            </div>
                          )}

                          {/* Campos de quantidade separados */}
                          <div>
                            <Label>Qtd. Creches *</Label>
                            <Input
                              type="number"
                              value={item.quantidadeCreche || ""}
                              onChange={(e) =>
                                atualizarItem(
                                  index,
                                  "quantidadeCreche",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              disabled={isEdicao}
                            />
                          </div>
                          <div>
                            <Label>Qtd. Escolas *</Label>
                            <Input
                              type="number"
                              value={item.quantidadeEscola || ""}
                              onChange={(e) =>
                                atualizarItem(
                                  index,
                                  "quantidadeEscola",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              disabled={isEdicao}
                            />
                          </div>
                          <div>
                            <Label>Valor Unitário *</Label>
                            <Input
                              type="number"
                              step="1"
                              value={item.valorUnitario || ""}
                              onChange={(e) =>
                                atualizarItem(
                                  index,
                                  "valorUnitario",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0,00"
                              disabled={isEdicao}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            {itens.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removerItem(index)}
                                className="text-destructive"
                                disabled={isEdicao}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                            <div>
                              Total Geral:{" "}
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(
                                (item.valorUnitario || 0) *
                                  ((item.quantidadeCreche || 0) +
                                    (item.quantidadeEscola || 0))
                              )}
                            </div>
                            <div>
                              Creches:{" "}
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(
                                (item.valorUnitario || 0) *
                                  (item.quantidadeCreche || 0)
                              )}
                            </div>
                            <div>
                              Escolas:{" "}
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(
                                (item.valorUnitario || 0) *
                                  (item.quantidadeEscola || 0)
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      Valor Total do Contrato:
                    </span>
                    <Badge variant="outline" className="text-lg font-bold">
                      {" "}
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(formData.valorTotal)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChangeInternal(false)}
            disabled={isSubmitting || isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoading}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdicao ? "Atualizar" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

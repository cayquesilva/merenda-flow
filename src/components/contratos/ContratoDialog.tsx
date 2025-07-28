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
import { Contrato, ItemContrato } from "@/types";
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
type ContratoStatus = "ativo" | "suspenso" | "finalizado";

interface ContratoDialogProps {
  contrato?: Contrato;
  onSuccess: () => void;
}

export function ContratoDialog({ contrato, onSuccess }: ContratoDialogProps) {
  const [open, setOpen] = useState(false);
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
  const [itens, setItens] = useState<Partial<ItemContrato>[]>([
    {
      nome: "",
      unidadeMedidaId: "",
      valorUnitario: 0,
      quantidadeOriginal: 0,
      saldoAtual: 0,
    },
  ]);

  const [fornecedores, setFornecedores] = useState<FornecedorLista[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadeMedidaLista[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // COMENTÁRIO: Este useEffect foi reestruturado para ser mais robusto.
  useEffect(() => {
    if (open) {
      const fetchInitialData = async () => {
        setIsLoading(true);
        try {
          // 1. Busca os dados de suporte (fornecedores e unidades) em paralelo.
          const [fornecedoresRes, unidadesRes] = await Promise.all([
            fetch("http://localhost:3001/api/fornecedores/lista"),
            fetch("http://localhost:3001/api/unidades-medida"),
          ]);

          if (!fornecedoresRes.ok || !unidadesRes.ok) {
            throw new Error(
              "Falha ao carregar dados de suporte do formulário."
            );
          }

          setFornecedores(await fornecedoresRes.json());
          setUnidadesMedida(await unidadesRes.json());

          // 2. Verifica se está em modo de edição.
          if (isEdicao && contrato) {
            // ALTERAÇÃO: Em vez de usar os dados parciais do 'contrato', buscamos os detalhes completos.
            const detailsRes = await fetch(
              `http://localhost:3001/api/contratos/${contrato.id}`
            );
            if (!detailsRes.ok) {
              throw new Error(
                "Falha ao carregar os detalhes do contrato para edição."
              );
            }
            const fullContratoData: Contrato = await detailsRes.json();

            // 3. Popula o formulário com os dados completos recebidos da API.
            setFormData({
              numero: fullContratoData.numero,
              fornecedorId: fullContratoData.fornecedor.id,
              dataInicio: new Date(fullContratoData.dataInicio)
                .toISOString()
                .split("T")[0],
              dataFim: new Date(fullContratoData.dataFim)
                .toISOString()
                .split("T")[0],
              valorTotal: fullContratoData.valorTotal,
              status: fullContratoData.status as ContratoStatus,
            });
            // Agora `fullContratoData.itens` é uma lista válida e não causará o erro.
            setItens(fullContratoData.itens);
          } else {
            // 4. Se for modo de criação, reseta o formulário.
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
          setOpen(false);
        } finally {
          setIsLoading(false);
        }
      };
      fetchInitialData();
    }
  }, [open, contrato, isEdicao, toast]);

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
      },
    ]);
  };

  useEffect(() => {
    const total = itens.reduce(
      (acc, item) =>
        acc + (item.valorUnitario || 0) * (item.quantidadeOriginal || 0),
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
      },
    ]);
  const removerItem = (index: number) => {
    if (itens.length > 1) setItens(itens.filter((_, i) => i !== index));
  };
  const atualizarItem = (index: number, campo: string, valor: any) => {
    const novosItens = [...itens];
    novosItens[index] = { ...novosItens[index], [campo]: valor };
    if (campo === "quantidadeOriginal") novosItens[index].saldoAtual = valor;
    setItens(novosItens);
  };

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

    setIsSubmitting(true);

    const itensPayload = itens.map((item) => ({
      nome: item.nome,
      unidadeMedidaId: item.unidadeMedidaId,
      valorUnitario: Number(item.valorUnitario),
      quantidadeOriginal: Number(item.quantidadeOriginal),
      saldoAtual: Number(item.quantidadeOriginal),
    }));

    const contratoPayload = {
      ...formData,
      dataInicio: new Date(formData.dataInicio).toISOString(),
      dataFim: new Date(formData.dataFim).toISOString(),
      ...(!isEdicao && { itens: itensPayload }),
    };

    try {
      const url = isEdicao
        ? `http://localhost:3001/api/contratos/${contrato.id}`
        : "http://localhost:3001/api/contratos";
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
      setOpen(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isEdicao ? "outline" : "default"}
          size={isEdicao ? "sm" : "default"}
        >
          {isEdicao ? (
            <Edit className="h-3 w-3" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isEdicao ? "" : "Novo Contrato"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
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
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
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
                  {itens.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
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
                                <SelectItem key={unidade.id} value={unidade.id}>
                                  {unidade.sigla} - {unidade.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Valor Unitário *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.valorUnitario || ""}
                            onChange={(e) =>
                              atualizarItem(
                                index,
                                "valorUnitario",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0,00"
                            disabled={isSubmitting || isEdicao}
                          />
                        </div>
                        <div>
                          <Label>Quantidade *</Label>
                          <Input
                            type="number"
                            value={item.quantidadeOriginal || ""}
                            onChange={(e) =>
                              atualizarItem(
                                index,
                                "quantidadeOriginal",
                                parseInt(e.target.value) || 0
                              )
                            }
                            placeholder="0"
                            disabled={isSubmitting || isEdicao}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          {itens.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removerItem(index)}
                              className="text-destructive"
                              disabled={isSubmitting || isEdicao}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {item.valorUnitario && item.quantidadeOriginal && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Subtotal: R${" "}
                          {(
                            (item.valorUnitario || 0) *
                            (item.quantidadeOriginal || 0)
                          ).toFixed(2)}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      Valor Total do Contrato:
                    </span>
                    <Badge variant="outline" className="text-lg font-bold">
                      R$ {formData.valorTotal.toFixed(2)}
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
            onClick={() => setOpen(false)}
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

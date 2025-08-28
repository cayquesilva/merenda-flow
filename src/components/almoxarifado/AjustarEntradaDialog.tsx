// src/components/almoxarifado/AjustarEntradaDialog.tsx

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
import { Plus, Trash, Loader2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService, EntradaAlmoxarifadoPayload } from "@/services/api";

// COMENTÁRIO: Interfaces para os dados. Reutilizamos as mesmas do NovaEntradaDialog.
interface Fornecedor {
  id: string;
  nome: string;
}
interface UnidadeMedida {
  id: string;
  nome: string;
  sigla: string;
}
// COMENTÁRIO: O formulário usa o nome e a unidade do insumo para permitir a criação on-the-fly.
interface ItemFormData {
  nome: string;
  unidadeMedidaId: string;
  quantidade: number;
  valorUnitario: number;
}

// COMENTÁRIO: Interface para a prop 'entrada', que contém todos os detalhes para edição.
interface EntradaDetalhada {
  id: string;
  notaFiscal: string;
  dataEntrada: string;
  fornecedor: { id: string; nome: string; cnpj: string };
  itens: {
    id: string;
    quantidade: number;
    valorUnitario: number | null;
    insumo: {
      nome: string;
      unidadeMedida: { id: string; sigla: string };
    };
  }[];
}

interface AjustarEntradaDialogProps {
  entrada: EntradaDetalhada;
  onSuccess: () => void;
}

export function AjustarEntradaDialog({
  entrada,
  onSuccess,
}: AjustarEntradaDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadeMedida[]>([]);

  const [notaFiscal, setNotaFiscal] = useState("");
  const [dataEntrada, setDataEntrada] = useState("");
  const [fornecedorId, setFornecedorId] = useState<string | undefined>();
  const [itens, setItens] = useState<ItemFormData[]>([]);

  // COMENTÁRIO: Efeito que pré-preenche todo o formulário com os dados da entrada existente quando o diálogo é aberto.
  useEffect(() => {
    if (open) {
      // Busca os dados para os selects
      apiService.getFornecedoresLista().then(setFornecedores);
      apiService.getUnidadesMedida().then(setUnidadesMedida);

      // Preenche os campos do formulário com os dados da prop 'entrada'
      setNotaFiscal(entrada.notaFiscal);
      setDataEntrada(new Date(entrada.dataEntrada).toISOString().split("T")[0]); // Formata a data para o input
      setFornecedorId(entrada.fornecedor.id);
      setItens(
        entrada.itens.map((item) => ({
          nome: item.insumo.nome,
          unidadeMedidaId: item.insumo.unidadeMedida.id,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario || 0,
        }))
      );
    }
  }, [open, entrada]);

  // Funções para manipular a lista de itens (adicionar, remover, alterar)
  const handleAddItem = () =>
    setItens([
      ...itens,
      { nome: "", unidadeMedidaId: "", quantidade: 0, valorUnitario: 0 },
    ]);
  const handleRemoveItem = (index: number) =>
    setItens(itens.filter((_, i) => i !== index));
  const handleItemChange = (
    index: number,
    field: keyof ItemFormData,
    value: string | number
  ) => {
    const novosItens = [...itens];
    novosItens[index] = { ...novosItens[index], [field]: value };
    setItens(novosItens);
  };

  // COMENTÁRIO: Função de submissão que chama a nova rota de AJUSTE.
  const handleSubmit = async () => {
    if (
      !notaFiscal ||
      !dataEntrada ||
      !fornecedorId ||
      itens.some((i) => !i.nome || !i.unidadeMedidaId || i.quantidade <= 0)
    ) {
      toast({
        title: "Erro de Validação",
        description: "Preencha todos os campos obrigatórios (*).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: EntradaAlmoxarifadoPayload = {
        notaFiscal,
        dataEntrada,
        fornecedorId,
        valorTotal: itens.reduce(
          (sum, item) => sum + item.quantidade * item.valorUnitario,
          0
        ),
        itens: itens.map((item) => ({
          nome: item.nome,
          unidadeMedidaId: item.unidadeMedidaId,
          quantidade: Number(item.quantidade),
          valorUnitario: Number(item.valorUnitario),
        })),
      };

      // Chama a rota de AJUSTE, passando o ID da entrada original
      await apiService.ajustarEntradaAlmoxarifado(entrada.id, payload);

      toast({
        title: "Sucesso!",
        description:
          "Entrada de estoque ajustada com sucesso. Uma nova versão foi criada.",
      });
      onSuccess();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao Ajustar",
        description:
          error instanceof Error ? error.message : "Ocorreu um erro.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Ajustar Entrada
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Ajustar Entrada de Estoque (NF: {entrada.notaFiscal})
          </DialogTitle>
          <DialogDescription>
            Modifique as informações abaixo. Salvar irá estornar a entrada
            original e criar uma nova versão corrigida, mantendo o histórico.
          </DialogDescription>
        </DialogHeader>

        {/* O JSX do formulário é idêntico ao de 'NovaEntradaDialog', mas os inputs são controlados pelos estados pré-preenchidos */}
        <div className="grid md:grid-cols-3 gap-4 py-4">
          <div>
            <Label htmlFor="notaFiscal">Nota Fiscal *</Label>
            <Input
              id="notaFiscal"
              value={notaFiscal}
              onChange={(e) => setNotaFiscal(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="dataEntrada">Data da Entrada *</Label>
            <Input
              id="dataEntrada"
              type="date"
              value={dataEntrada}
              onChange={(e) => setDataEntrada(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fornecedor">Fornecedor *</Label>
            <Select value={fornecedorId} onValueChange={setFornecedorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fornecedor..." />
              </SelectTrigger>
              <SelectContent>
                {fornecedores.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-lg font-semibold">Itens da Nota *</Label>
          {itens.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 items-end border-b pb-2"
            >
              <div className="col-span-5">
                <Label>Nome do Insumo *</Label>
                <Input
                  placeholder="Ex: Resma de papel A4"
                  value={item.nome}
                  onChange={(e) =>
                    handleItemChange(index, "nome", e.target.value)
                  }
                />
              </div>
              <div className="col-span-2">
                <Label>Unidade *</Label>
                <Select
                  value={item.unidadeMedidaId}
                  onValueChange={(value) =>
                    handleItemChange(index, "unidadeMedidaId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ex: UN" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesMedida.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.sigla}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Quantidade *</Label>
                <Input
                  type="number"
                  value={item.quantidade}
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      "quantidade",
                      Number(e.target.value)
                    )
                  }
                />
              </div>
              <div className="col-span-2">
                <Label>Valor Unit. (Opcional)</Label>
                <Input
                  type="number"
                  value={item.valorUnitario}
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      "valorUnitario",
                      Number(e.target.value)
                    )
                  }
                />
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={handleAddItem}>
            <Plus className="h-4 w-4 mr-2" /> Adicionar Item
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Ajuste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

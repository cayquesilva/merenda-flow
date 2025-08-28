// src/components/almoxarifado/NovaEntradaDialog.tsx

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
import { Plus, Trash, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";

// Interfaces para os dados
interface Fornecedor {
  id: string;
  nome: string;
}
interface InsumoCatalogo {
  id: string;
  nome: string;
  unidadeMedida: { sigla: string };
}
interface ItemFormData {
  insumoId: string;
  quantidade: number;
  valorUnitario: number;
}

export function NovaEntradaDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para os dados dos selects
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [insumosCatalogo, setInsumosCatalogo] = useState<InsumoCatalogo[]>([]);

  // Estados do formulário principal
  const [notaFiscal, setNotaFiscal] = useState("");
  const [dataEntrada, setDataEntrada] = useState("");
  const [fornecedorId, setFornecedorId] = useState<string | undefined>();
  const [itens, setItens] = useState<ItemFormData[]>([
    { insumoId: "", quantidade: 0, valorUnitario: 0 },
  ]);

  // Busca dados para os selects quando o diálogo abre
  useEffect(() => {
    if (open) {
      apiService.getFornecedoresLista().then(setFornecedores);
      apiService.getInsumos().then(setInsumosCatalogo);
    } else {
      // Limpa o formulário ao fechar
      setNotaFiscal("");
      setDataEntrada("");
      setFornecedorId(undefined);
      setItens([{ insumoId: "", quantidade: 0, valorUnitario: 0 }]);
    }
  }, [open]);

  // Funções para manipular a lista de itens
  const handleAddItem = () =>
    setItens([...itens, { insumoId: "", quantidade: 0, valorUnitario: 0 }]);
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

  const handleSubmit = async () => {
    if (
      !notaFiscal ||
      !dataEntrada ||
      !fornecedorId ||
      itens.some((i) => !i.insumoId || i.quantidade <= 0)
    ) {
      toast({
        title: "Erro de Validação",
        description: "Preencha todos os campos da nota e dos itens.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        notaFiscal,
        dataEntrada,
        fornecedorId,
        valorTotal: itens.reduce(
          (sum, item) => sum + item.quantidade * item.valorUnitario,
          0
        ),
        itens: itens.map((item) => ({
          ...item,
          quantidade: Number(item.quantidade),
          valorUnitario: Number(item.valorUnitario),
        })),
      };

      await apiService.createEntradaAlmoxarifado(payload);

      toast({
        title: "Sucesso!",
        description: "Entrada de estoque registrada com sucesso.",
      });
      onSuccess();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao Salvar",
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
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Registrar Entrada
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Registrar Entrada de Insumos no Almoxarifado
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da nota fiscal e os itens recebidos.
          </DialogDescription>
        </DialogHeader>

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
              <div className="col-span-6">
                <Label>Insumo</Label>
                <Select
                  value={item.insumoId}
                  onValueChange={(value) =>
                    handleItemChange(index, "insumoId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o insumo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {insumosCatalogo.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.nome} ({i.unidadeMedida.sigla})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Quantidade</Label>
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
              <div className="col-span-2 flex items-center justify-end">
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
            Salvar Entrada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

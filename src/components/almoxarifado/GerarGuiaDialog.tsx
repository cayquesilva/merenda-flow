// src/components/almoxarifado/GerarGuiaDialog.tsx

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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Send, Loader2, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService, GuiaDeRemessaPayload } from "@/services/api";
import { ItemEstoqueCentral } from "@/pages/EstoqueCentral";
import { cn } from "@/lib/utils";

// Interfaces locais
interface UnidadeEducacional {
  id: string;
  nome: string;
}
interface ItemGuiaForm {
  insumoId: string;
  nome: string;
  unidadeMedida: string;
  estoqueDisponivel: number;
  quantidadeEnviada: number;
}

export function GerarGuiaDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dados para os selects e combobox
  const [unidades, setUnidades] = useState<UnidadeEducacional[]>([]);
  const [estoqueCentral, setEstoqueCentral] = useState<ItemEstoqueCentral[]>(
    []
  );
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Estado do formulário
  const [unidadeDestinoId, setUnidadeDestinoId] = useState<
    string | undefined
  >();
  const [itensGuia, setItensGuia] = useState<ItemGuiaForm[]>([]);

  useEffect(() => {
    if (open) {
      setIsDataLoading(true);
      Promise.all([
        apiService.getUnidadesAtivas(),
        apiService.getEstoqueCentral(),
      ])
        .then(([unidadesData, estoqueData]) => {
          setUnidades(unidadesData);
          setEstoqueCentral(estoqueData);
        })
        .catch(() => {
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados necessários.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsDataLoading(false);
        });
    } else {
      setUnidadeDestinoId(undefined);
      setItensGuia([]);
    }
  }, [open, toast]);

  // Funções de manipulação dos itens
  const handleAddItem = (itemEstoque: ItemEstoqueCentral) => {
    if (itensGuia.find((i) => i.insumoId === itemEstoque.insumo.id)) return;
    setItensGuia([
      ...itensGuia,
      {
        insumoId: itemEstoque.insumo.id,
        nome: itemEstoque.insumo.nome,
        unidadeMedida: itemEstoque.insumo.unidadeMedida.sigla,
        estoqueDisponivel: itemEstoque.quantidadeAtual,
        quantidadeEnviada: 1,
      },
    ]);
  };
  const handleRemoveItem = (insumoId: string) =>
    setItensGuia(itensGuia.filter((i) => i.insumoId !== insumoId));
  const handleQuantidadeChange = (insumoId: string, quantidade: number) => {
    setItensGuia(
      itensGuia.map((i) =>
        i.insumoId === insumoId
          ? { ...i, quantidadeEnviada: Math.max(0, quantidade) }
          : i
      )
    );
  };

  const handleSubmit = async () => {
    if (
      !unidadeDestinoId ||
      itensGuia.length === 0 ||
      itensGuia.some(
        (i) =>
          i.quantidadeEnviada <= 0 || i.quantidadeEnviada > i.estoqueDisponivel
      )
    ) {
      toast({
        title: "Erro de Validação",
        description:
          "Selecione uma unidade e adicione itens com quantidades válidas.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: GuiaDeRemessaPayload = {
        unidadeEducacionalId: unidadeDestinoId,
        itens: itensGuia.map((i) => ({
          insumoId: i.insumoId,
          quantidadeEnviada: i.quantidadeEnviada,
        })),
      };
      await apiService.createGuiaDeRemessa(payload);
      toast({
        title: "Sucesso!",
        description: "Guia de Remessa gerada com sucesso.",
      });
      onSuccess();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível gerar a guia.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const insumosDisponiveisParaAdicionar = estoqueCentral.filter(
    (item) => !itensGuia.find((i) => i.insumoId === item.insumo.id)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Send className="mr-2 h-4 w-4" /> Gerar Guia de Remessa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Gerar Guia de Remessa para Unidade</DialogTitle>
          <DialogDescription>
            Selecione a unidade de destino e adicione os insumos a serem
            enviados.
          </DialogDescription>
        </DialogHeader>

        {isDataLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div>
              <Label>Unidade de Destino *</Label>
              <Select
                value={unidadeDestinoId}
                onValueChange={setUnidadeDestinoId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade..." />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Adicionar Insumo do Estoque Central</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    Selecionar insumo...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar insumo..." />
                    <CommandEmpty>Nenhum insumo encontrado.</CommandEmpty>
                    <CommandGroup>
                      {insumosDisponiveisParaAdicionar.map((item) => (
                        <CommandItem
                          key={item.id}
                          onSelect={() => handleAddItem(item)}
                        >
                          <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                          {item.insumo.nome} ({item.quantidadeAtual}{" "}
                          {item.insumo.unidadeMedida.sigla})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {itensGuia.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <Label className="font-semibold">Itens a Enviar</Label>
                {itensGuia.map((item) => (
                  <div
                    key={item.insumoId}
                    className="grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-6 font-medium">
                      {item.nome}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({item.unidadeMedida})
                      </span>
                    </div>
                    <div className="col-span-5">
                      <Input
                        type="number"
                        value={item.quantidadeEnviada}
                        onChange={(e) =>
                          handleQuantidadeChange(
                            item.insumoId,
                            Number(e.target.value)
                          )
                        }
                        max={item.estoqueDisponivel}
                      />
                      <p className="text-xs text-muted-foreground">
                        Disponível: {item.estoqueDisponivel}
                      </p>
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveItem(item.insumoId)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isDataLoading}
          >
            <Loader2
              className={`mr-2 h-4 w-4 ${
                isSubmitting ? "animate-spin" : "hidden"
              }`}
            />{" "}
            Gerar Guia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

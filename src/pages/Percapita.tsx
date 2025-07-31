import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Plus,
  Edit,
  Calculator,
  Package,
  Loader2,
  Scale,
  Calendar,
} from "lucide-react";
import {
  TipoEstudante,
  PercapitaItem,
  ItemContrato,
  UnidadeMedida,
  Contrato,
  Fornecedor,
} from "@/types";
import { useToast } from "@/hooks/use-toast";

interface ItemContratoDetalhado extends ItemContrato {
  unidadeMedida: UnidadeMedida;
  contrato: Contrato & {
    fornecedor: Fornecedor;
  };
}

interface PercapitaItemDetalhado extends PercapitaItem {
  itemContrato: ItemContratoDetalhado;
  tipoEstudante: TipoEstudante;
}

interface PercapitaDialogProps {
  percapita?: PercapitaItemDetalhado;
  onSuccess: () => void;
}

function PercapitaDialog({ percapita, onSuccess }: PercapitaDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    itemContratoId: "",
    tipoEstudanteId: "",
    gramagemPorEstudante: 0,
    frequenciaSemanal: 5,
    ativo: true,
  });
  const [itensContrato, setItensContrato] = useState<ItemContratoDetalhado[]>(
    []
  );
  const [tiposEstudante, setTiposEstudante] = useState<TipoEstudante[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isEdicao = !!percapita;

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [itensRes, tiposRes] = await Promise.all([
            fetch(
              `${
                import.meta.env.VITE_API_URL || "http://localhost:3001"
              }/api/contratos-ativos`
            ),
            fetch(
              `${
                import.meta.env.VITE_API_URL || "http://localhost:3001"
              }/api/tipos-estudante`
            ),
          ]);

          if (!itensRes.ok || !tiposRes.ok) {
            throw new Error("Falha ao carregar dados do formulário");
          }

          const contratos: Contrato[] = await itensRes.json();
          const itens = contratos.flatMap((c: Contrato) =>
            c.itens.map((item: ItemContrato) => ({
              ...item,
              contrato: { ...c, itens: undefined },
            }))
          );

          setItensContrato(itens);
          setTiposEstudante(await tiposRes.json());

          if (isEdicao && percapita) {
            setFormData({
              itemContratoId: percapita.itemContratoId,
              tipoEstudanteId: percapita.tipoEstudanteId,
              gramagemPorEstudante: percapita.gramagemPorEstudante,
              frequenciaSemanal: percapita.frequenciaSemanal,
              ativo: percapita.ativo,
            });
          }
        } catch (error) {
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados do formulário",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    } else {
      setFormData({
        itemContratoId: "",
        tipoEstudanteId: "",
        gramagemPorEstudante: 0,
        frequenciaSemanal: 5,
        ativo: true,
      });
    }
  }, [open, percapita, isEdicao, toast]);

  const handleSubmit = async () => {
    if (
      !formData.itemContratoId ||
      !formData.tipoEstudanteId ||
      formData.gramagemPorEstudante <= 0
    ) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEdicao
        ? `${
            import.meta.env.VITE_API_URL || "http://localhost:3001"
          }/api/percapita/${percapita!.id}`
        : `${
            import.meta.env.VITE_API_URL || "http://localhost:3001"
          }/api/percapita`;

      const method = isEdicao ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao salvar percápita");
      }

      toast({
        title: "Sucesso!",
        description: `Percápita ${
          isEdicao ? "atualizada" : "cadastrada"
        } com sucesso`,
      });

      setOpen(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
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
          {isEdicao ? "" : "Nova Percápita"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-popover-foreground">
            {isEdicao ? "Editar Percápita" : "Nova Percápita"}
          </DialogTitle>
          <DialogDescription>
            {isEdicao
              ? "Edite as informações da percápita"
              : "Configure a percápita de consumo por tipo de estudante"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="itemContrato">Item do Contrato *</Label>
                <Select
                  value={formData.itemContratoId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, itemContratoId: value })
                  }
                  disabled={isSubmitting || isEdicao}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um item" />
                  </SelectTrigger>
                  <SelectContent>
                    {itensContrato.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.nome} - {item.contrato.numero}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tipoEstudante">Tipo de Estudante *</Label>
                <Select
                  value={formData.tipoEstudanteId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipoEstudanteId: value })
                  }
                  disabled={isSubmitting || isEdicao}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposEstudante.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id}>
                        {tipo.nome} ({tipo.categoria})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gramagem">Gramagem por Estudante (g) *</Label>
                <Input
                  id="gramagem"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.gramagemPorEstudante}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gramagemPorEstudante: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.0"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="frequencia">Frequência Semanal (dias) *</Label>
                <Input
                  id="frequencia"
                  type="number"
                  min="1"
                  max="7"
                  value={formData.frequenciaSemanal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      frequenciaSemanal: parseInt(e.target.value) || 5,
                    })
                  }
                  placeholder="5"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ativo: checked })
                }
                disabled={isSubmitting}
              />
              <Label htmlFor="ativo">Percápita ativa</Label>
            </div>

            {formData.gramagemPorEstudante > 0 &&
              formData.frequenciaSemanal > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Cálculo Estimado</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      Consumo diário: {formData.gramagemPorEstudante}g por
                      estudante
                    </p>
                    <p>
                      Consumo semanal:{" "}
                      {(
                        formData.gramagemPorEstudante *
                        formData.frequenciaSemanal
                      ).toFixed(1)}
                      g por estudante
                    </p>
                    <p>
                      Consumo mensal:{" "}
                      {(
                        formData.gramagemPorEstudante *
                        formData.frequenciaSemanal *
                        4.33
                      ).toFixed(1)}
                      g por estudante
                    </p>
                  </div>
                </div>
              )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
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

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Percapita() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [refreshKey, setRefreshKey] = useState(0);
  const [percapitas, setPercapitas] = useState<PercapitaItemDetalhado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchPercapitas = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:3001"
          }/api/percapita?q=${debouncedSearchTerm}`
        );
        if (!response.ok) throw new Error("Falha ao buscar percápitas");
        const data = await response.json();
        setPercapitas(data);
      } catch (error) {
        console.error("Erro ao buscar percápitas:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as percápitas",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPercapitas();
  }, [debouncedSearchTerm, refreshKey, toast]);

  const handleDelete = async (id: string, itemNome: string) => {
    if (
      !confirm(
        `Tem certeza que deseja deletar a percápita do item ${itemNome}?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/percapita/${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao deletar percápita");
      }

      toast({
        title: "Percápita deletada!",
        description: `Percápita do item ${itemNome} foi removida com sucesso`,
      });
      handleSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const getCategoriaColor = (categoria: string) => {
    return categoria === "creche"
      ? "bg-blue-100 text-blue-800"
      : "bg-green-100 text-green-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Percápita de Estudantes
          </h2>
          <p className="text-muted-foreground">
            Configure a gramagem e frequência de consumo por tipo de estudante
          </p>
        </div>
        <PercapitaDialog onSuccess={handleSuccess} />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por item ou tipo de estudante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Percápitas */}
      <Card>
        <CardHeader>
          <CardTitle>Percápitas Cadastradas</CardTitle>
          <CardDescription>
            {percapitas.length} percápita(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {percapitas.length === 0 && !isLoading ? (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">
                Nenhuma percápita encontrada
              </h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Tente ajustar os filtros de busca"
                  : "Comece cadastrando a primeira percápita"}
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 mx-auto animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Tipo de Estudante</TableHead>
                  <TableHead>Gramagem</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Consumo Semanal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {percapitas.map((percapita) => (
                  <TableRow key={percapita.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                        {percapita.itemContrato.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-mono text-sm">
                          {percapita.itemContrato.contrato.numero}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {percapita.itemContrato.contrato.fornecedor.nome}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getCategoriaColor(
                          percapita.tipoEstudante.categoria
                        )}
                      >
                        {percapita.tipoEstudante.nome}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Scale className="mr-1 h-3 w-3" />
                        {percapita.gramagemPorEstudante}g
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        {percapita.frequenciaSemanal}x/semana
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {(
                        percapita.gramagemPorEstudante *
                        percapita.frequenciaSemanal
                      ).toFixed(1)}
                      g
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={percapita.ativo ? "default" : "secondary"}
                      >
                        {percapita.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PercapitaDialog
                          percapita={percapita}
                          onSuccess={handleSuccess}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDelete(
                              percapita.id,
                              percapita.itemContrato.nome
                            )
                          }
                          className="text-destructive hover:text-destructive"
                        >
                          Deletar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

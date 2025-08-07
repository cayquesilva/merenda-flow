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
  Trash2,
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

// Interfaces detalhadas para corresponder ao retorno das APIs
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

// NOVO: Interface para o formulário de criação em lote
interface PercapitaCreateFormItem {
  tipoEstudanteId: string;
  gramagemPorEstudante: number;
  frequenciaMensal: number;
  ativo: boolean;
  tipoEstudanteNome: string;
  tipoEstudanteCategoria: string;
}

interface PercapitaCreateDialogProps {
  onSuccess: () => void;
}

// NOVO: Componente de diálogo para CRIAR percápitas
export function PercapitaCreateDialog({ onSuccess }: PercapitaCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    itemContratoId: "",
    percapitas: [] as PercapitaCreateFormItem[],
  });

  const [itensContrato, setItensContrato] = useState<ItemContratoDetalhado[]>(
    []
  );
  const [tiposEstudante, setTiposEstudante] = useState<TipoEstudante[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [itensRes, tiposRes] = await Promise.all([
            fetch(
              `${
                import.meta.env.VITE_API_URL || "http://localhost:3001"
              }/api/percapita/itens-contrato-ativos`
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

          const itens = await itensRes.json();
          const tipos = await tiposRes.json();

          setItensContrato(itens);
          setTiposEstudante(tipos);
          
          setFormData({
            itemContratoId: "",
            percapitas: tipos.map((tipo: TipoEstudante) => ({
              tipoEstudanteId: tipo.id,
              gramagemPorEstudante: 0,
              frequenciaMensal: 5,
              ativo: true,
              tipoEstudanteNome: tipo.nome,
              tipoEstudanteCategoria: tipo.categoria,
            })),
          });

        } catch (error) {
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados do formulário",
            variant: "destructive",
          });
          setOpen(false);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [open, toast]);

  const handlePercapitaChange = (
    index: number, 
    field: keyof PercapitaCreateFormItem, 
    value: string | number | boolean
  ) => {
    setFormData((prev) => {
      const novasPercapitas = [...prev.percapitas];
      novasPercapitas[index] = { ...novasPercapitas[index], [field]: value };
      return { ...prev, percapitas: novasPercapitas };
    });
  };

  const handleSubmit = async () => {
    if (!formData.itemContratoId) {
      toast({
        title: "Erro",
        description: "Selecione um item de contrato",
        variant: "destructive",
      });
      return;
    }
    
    const percápitasValidas = formData.percapitas.filter(p => p.gramagemPorEstudante > 0);
    if (percápitasValidas.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha a gramagem para pelo menos um tipo de preparação.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/percapita/create-batch`;
      const method = "POST";
      
      const payload = {
          itemContratoId: formData.itemContratoId,
          percapitas: percápitasValidas.map(p => ({
              tipoEstudanteId: p.tipoEstudanteId,
              gramagemPorEstudante: p.gramagemPorEstudante,
              frequenciaMensal: p.frequenciaMensal,
              ativo: p.ativo,
          }))
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao salvar percápitas em lote.");
      }

      toast({
        title: "Sucesso!",
        description: "Percápitas cadastradas com sucesso.",
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

  const getCategoriaColor = (categoria: string) => {
    return categoria === "creche"
      ? "bg-blue-100 text-blue-800"
      : "bg-green-100 text-green-800";
  };
  
  const selectedItemContrato = itensContrato.find(i => i.id === formData.itemContratoId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Plus className="mr-2 h-4 w-4" />
          Nova Percápita
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"> {/* Ajustado para altura máxima e rolagem */}
        <DialogHeader>
          <DialogTitle className="text-popover-foreground">
            Nova Percápita
          </DialogTitle>
          <DialogDescription>
            Configure a percápita de consumo por tipo de estudante
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <Label htmlFor="itemContrato">Item do Contrato *</Label>
                <Select
                  value={formData.itemContratoId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, itemContratoId: value })
                  }
                  disabled={isSubmitting}
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
            </div>
            
            {formData.itemContratoId && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-4 w-4" />
                            Definir Percápita por Estudante
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {formData.percapitas.map((percapita, index) => (
                                <Card key={percapita.tipoEstudanteId} className="p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h5 className="font-semibold">{percapita.tipoEstudanteNome} ({percapita.tipoEstudanteCategoria})</h5>
                                        <Badge variant={percapita.ativo ? "default" : "secondary"}>
                                            {percapita.ativo ? "Ativo" : "Inativo"}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor={`gramagem-${percapita.tipoEstudanteId}`}>Gramagem por Estudante (g) *</Label>
                                            <Input
                                                id={`gramagem-${percapita.tipoEstudanteId}`}
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={percapita.gramagemPorEstudante}
                                                onChange={(e) =>
                                                    handlePercapitaChange(
                                                        index,
                                                        "gramagemPorEstudante",
                                                        parseFloat(e.target.value) || 0
                                                    )
                                                }
                                                placeholder="0.0"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor={`frequencia-${percapita.tipoEstudanteId}`}>Frequência Mensal *</Label>
                                            <Input
                                                id={`frequencia-${percapita.tipoEstudanteId}`}
                                                type="number"
                                                min="1"
                                                max="30"
                                                value={percapita.frequenciaMensal}
                                                onChange={(e) =>
                                                    handlePercapitaChange(
                                                        index,
                                                        "frequenciaMensal",
                                                        parseInt(e.target.value) || 0
                                                    )
                                                }
                                                placeholder="5"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                    {percapita.gramagemPorEstudante > 0 && percapita.frequenciaMensal > 0 && (
                                      <p className="text-sm text-muted-foreground mt-2">
                                        Consumo mensal: {(percapita.gramagemPorEstudante * percapita.frequenciaMensal).toFixed(1)}g
                                      </p>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
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
            Cadastrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PercapitaEditDialogProps {
    percapita: PercapitaItemDetalhado;
    onSuccess: () => void;
}

// NOVO: Componente de diálogo para EDITAR uma única percápita
export function PercapitaEditDialog({ percapita, onSuccess }: PercapitaEditDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        gramagemPorEstudante: percapita.gramagemPorEstudante,
        frequenciaMensal: percapita.frequenciaMensal,
        ativo: percapita.ativo,
    });

    const handleSubmit = async () => {
      if (formData.gramagemPorEstudante <= 0 || formData.frequenciaMensal <= 0) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos corretamente.",
          variant: "destructive",
        });
        return;
      }
  
      setIsSubmitting(true);
      try {
        const url = `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/percapita/${percapita.id}`;
        const method = "PUT";
  
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Falha ao salvar percápita.");
        }
  
        toast({
          title: "Sucesso!",
          description: "Percápita atualizada com sucesso.",
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
                <Button variant="outline" size="sm">
                    <Edit className="h-3 w-3" />
                    Editar
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-popover-foreground">
                        Editar Percápita
                    </DialogTitle>
                    <DialogDescription>
                        Edite a percápita para o item{" "}
                        <span className="font-semibold">{percapita.itemContrato.nome}</span>
                        {" "}do estudante{" "}
                        <span className="font-semibold">{percapita.tipoEstudante.nome}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div>
                        <Label htmlFor="gramagem">Gramagem por Estudante (g) *</Label>
                        <Input
                            id="gramagem"
                            type="number"
                            min="0"
                            step="1"
                            value={formData.gramagemPorEstudante}
                            onChange={(e) =>
                                setFormData({ ...formData, gramagemPorEstudante: parseFloat(e.target.value) || 0 })
                            }
                            placeholder="0.0"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <Label htmlFor="frequencia">Frequência Mensal *</Label>
                        <Input
                            id="frequencia"
                            type="number"
                            min="1"
                            max="30"
                            value={formData.frequenciaMensal}
                            onChange={(e) =>
                                setFormData({ ...formData, frequenciaMensal: parseInt(e.target.value) || 0 })
                            }
                            placeholder="5"
                            disabled={isSubmitting}
                        />
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
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Atualizar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [percapitaToDelete, setPercapitaToDelete] = useState<{ id: string; nome: string } | null>(null);

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

  const handleDelete = async () => {
    if (!percapitaToDelete) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/percapita/${percapitaToDelete.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao deletar percápita");
      }

      toast({
        title: "Percápita deletada!",
        description: `Percápita do item ${percapitaToDelete.nome} foi removida com sucesso`,
      });
      setIsDeleteDialogOpen(false); // Fecha o modal após o sucesso
      setPercapitaToDelete(null); // Limpa o estado
      handleSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false); // Fecha o modal mesmo em caso de erro
    }
  };

  const handleOpenDeleteDialog = (id: string, itemNome: string) => {
    setPercapitaToDelete({ id, nome: itemNome });
    setIsDeleteDialogOpen(true);
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
            Configure a gramagem e frequência de consumo por tipo de preparação
          </p>
        </div>
        <PercapitaCreateDialog onSuccess={handleSuccess} />
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
              placeholder="Buscar por item ou tipo de preparação..."
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
                  <TableHead>Tipo de Preparação</TableHead>
                  <TableHead>Gramagem</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Consumo Mensal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px] text-center">Ações</TableHead>
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
                        {percapita.frequenciaMensal}x/mês
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {(
                        percapita.gramagemPorEstudante *
                        percapita.frequenciaMensal
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
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <PercapitaEditDialog
                          percapita={percapita}
                          onSuccess={handleSuccess}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleOpenDeleteDialog(
                              percapita.id,
                              percapita.itemContrato.nome
                            )
                          }
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 />
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
      {/* NOVO: Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmação de Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar a percápita do item{" "}
              <span className="font-bold">{percapitaToDelete?.nome}</span>?
              Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

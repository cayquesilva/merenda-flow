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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Building2,
  Plus,
  Minus,
  Edit,
  History,
  BarChart3,
  Loader2,
} from "lucide-react";
import { Estoque, MovimentacaoEstoque, UnidadeEducacional } from "@/types";
import { useToast } from "@/hooks/use-toast";

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface MovimentacaoDialogProps {
  estoque: Estoque | null;
  onSuccess: () => void;
}

function MovimentacaoDialog({ estoque, onSuccess }: MovimentacaoDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo: "saida" as "entrada" | "saida" | "ajuste",
    quantidade: "",
    motivo: "",
    responsavel: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!estoque || !formData.quantidade || !formData.motivo || !formData.responsavel) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const quantidade = Number(formData.quantidade);
    if (quantidade <= 0) {
      toast({
        title: "Erro",
        description: "A quantidade deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    if (formData.tipo === "saida" && quantidade > estoque.quantidadeAtual) {
      toast({
        title: "Erro",
        description: "Quantidade insuficiente em estoque",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:3001/api/estoque/movimentacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estoqueId: estoque.id,
          ...formData,
          quantidade,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao registrar movimentação");
      }

      toast({
        title: "Sucesso!",
        description: "Movimentação registrada com sucesso",
      });

      setOpen(false);
      setFormData({
        tipo: "saida",
        quantidade: "",
        motivo: "",
        responsavel: "",
      });
      onSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
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
          <Edit className="h-3 w-3 mr-1" />
          Movimentar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Movimentação</DialogTitle>
          <DialogDescription>
            {estoque && `${estoque.itemContrato.nome} - ${estoque.unidadeEducacional.nome}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="tipo">Tipo de Movimentação *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: "entrada" | "saida" | "ajuste") =>
                setFormData({ ...formData, tipo: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
                <SelectItem value="ajuste">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantidade">Quantidade *</Label>
            <Input
              id="quantidade"
              type="number"
              min="0"
              step="0.01"
              value={formData.quantidade}
              onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
              placeholder="0"
            />
            {estoque && (
              <p className="text-xs text-muted-foreground mt-1">
                Estoque atual: {estoque.quantidadeAtual} {estoque.itemContrato.unidadeMedida.sigla}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="responsavel">Responsável *</Label>
            <Input
              id="responsavel"
              value={formData.responsavel}
              onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              placeholder="Nome do responsável"
            />
          </div>

          <div>
            <Label htmlFor="motivo">Motivo *</Label>
            <Textarea
              id="motivo"
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              placeholder="Descreva o motivo da movimentação"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Estoque() {
  const [busca, setBusca] = useState("");
  const debouncedBusca = useDebounce(busca, 300);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("todas");
  const [refreshKey, setRefreshKey] = useState(0);

  const [estoque, setEstoque] = useState<Estoque[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [unidades, setUnidades] = useState<UnidadeEducacional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItens: 0,
    itensComEstoque: 0,
    itensAbaixoMinimo: 0,
    valorTotalEstoque: 0,
  });

  const { toast } = useToast();

  useEffect(() => {
    const fetchUnidades = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/unidades-ativas");
        if (response.ok) {
          setUnidades(await response.json());
        }
      } catch (error) {
        console.error("Erro ao buscar unidades:", error);
      }
    };
    fetchUnidades();
  }, []);

  useEffect(() => {
    const fetchEstoque = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedBusca) params.append("q", debouncedBusca);
        if (unidadeSelecionada !== "todas") params.append("unidadeId", unidadeSelecionada);

        const [estoqueRes, movimentacoesRes] = await Promise.all([
          fetch(`http://localhost:3001/api/estoque/consolidado?${params}`),
          fetch(`http://localhost:3001/api/estoque/movimentacoes?${params}`),
        ]);

        if (!estoqueRes.ok || !movimentacoesRes.ok) {
          throw new Error("Falha ao buscar dados do estoque");
        }

        const estoqueData = await estoqueRes.json();
        const movimentacoesData = await movimentacoesRes.json();

        setEstoque(estoqueData);
        setMovimentacoes(movimentacoesData);

        // Calcular estatísticas
        const totalItens = estoqueData.length;
        const itensComEstoque = estoqueData.filter((e: Estoque) => e.quantidadeAtual > 0).length;
        const itensAbaixoMinimo = estoqueData.filter((e: Estoque) => 
          e.quantidadeMinima > 0 && e.quantidadeAtual < e.quantidadeMinima
        ).length;
        const valorTotalEstoque = estoqueData.reduce((sum: number, e: Estoque) => 
          sum + (e.quantidadeAtual * e.itemContrato.valorUnitario), 0
        );

        setStats({
          totalItens,
          itensComEstoque,
          itensAbaixoMinimo,
          valorTotalEstoque,
        });
      } catch (error) {
        console.error("Erro:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do estoque",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEstoque();
  }, [debouncedBusca, unidadeSelecionada, refreshKey, toast]);

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const getStatusBadge = (estoque: Estoque) => {
    if (estoque.quantidadeAtual === 0) {
      return <Badge variant="destructive">Sem Estoque</Badge>;
    }
    if (estoque.quantidadeMinima > 0 && estoque.quantidadeAtual < estoque.quantidadeMinima) {
      return <Badge variant="outline" className="border-warning text-warning">Abaixo do Mínimo</Badge>;
    }
    return <Badge variant="default">Normal</Badge>;
  };

  const getTipoMovimentacaoBadge = (tipo: string) => {
    const variants = {
      entrada: "default",
      saida: "destructive",
      ajuste: "outline",
    } as const;

    const icons = {
      entrada: <Plus className="h-3 w-3 mr-1" />,
      saida: <Minus className="h-3 w-3 mr-1" />,
      ajuste: <Edit className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge variant={variants[tipo as keyof typeof variants] || "outline"}>
        {icons[tipo as keyof typeof icons]}
        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Controle de Estoque</h2>
          <p className="text-muted-foreground">
            Gerencie o estoque de cada unidade educacional
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Itens</p>
                <p className="text-2xl font-bold">{stats.totalItens}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-success/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Com Estoque</p>
                <p className="text-2xl font-bold">{stats.itensComEstoque}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Abaixo do Mínimo</p>
                <p className="text-2xl font-bold">{stats.itensAbaixoMinimo}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  R$ {stats.valorTotalEstoque.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome do item..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <Select value={unidadeSelecionada} onValueChange={setUnidadeSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as unidades</SelectItem>
                  {unidades.map((unidade) => (
                    <SelectItem key={unidade.id} value={unidade.id}>
                      {unidade.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="estoque" className="space-y-4">
        <TabsList>
          <TabsTrigger value="estoque">
            <Package className="mr-2 h-4 w-4" />
            Estoque Atual
          </TabsTrigger>
          <TabsTrigger value="movimentacoes">
            <History className="mr-2 h-4 w-4" />
            Movimentações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="estoque">
          <Card>
            <CardHeader>
              <CardTitle>Estoque por Unidade</CardTitle>
              <CardDescription>
                Visualize e gerencie o estoque de cada unidade educacional
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 text-muted-foreground mx-auto animate-spin" />
                </div>
              ) : estoque.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Nenhum item em estoque</h3>
                  <p className="text-muted-foreground">
                    {busca || unidadeSelecionada !== "todas"
                      ? "Tente ajustar os filtros"
                      : "O estoque será criado automaticamente conforme os recebimentos"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Quantidade Atual</TableHead>
                      <TableHead>Quantidade Mínima</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Última Atualização</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estoque.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.itemContrato.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.itemContrato.contrato.numero}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span className="text-sm">{item.unidadeEducacional.nome}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.itemContrato.contrato.fornecedor.nome}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {item.quantidadeAtual} {item.itemContrato.unidadeMedida.sigla}
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.quantidadeMinima} {item.itemContrato.unidadeMedida.sigla}
                        </TableCell>
                        <TableCell>{getStatusBadge(item)}</TableCell>
                        <TableCell className="font-medium">
                          R$ {(item.quantidadeAtual * item.itemContrato.valorUnitario).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {new Date(item.ultimaAtualizacao).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <MovimentacaoDialog estoque={item} onSuccess={handleSuccess} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movimentacoes">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
              <CardDescription>
                Acompanhe todas as movimentações de estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 text-muted-foreground mx-auto animate-spin" />
                </div>
              ) : movimentacoes.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma movimentação encontrada</h3>
                  <p className="text-muted-foreground">
                    As movimentações aparecerão aqui conforme forem registradas
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Saldo Anterior</TableHead>
                      <TableHead>Saldo Novo</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimentacoes.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell>
                          {new Date(mov.dataMovimentacao).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>{getTipoMovimentacaoBadge(mov.tipo)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{mov.estoque.itemContrato.nome}</p>
                            {mov.recibo && (
                              <p className="text-xs text-muted-foreground">
                                Recibo: {mov.recibo.numero}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{mov.estoque.unidadeEducacional.nome}</TableCell>
                        <TableCell>
                          <span className={mov.tipo === "saida" ? "text-destructive" : "text-success"}>
                            {mov.tipo === "saida" ? "-" : "+"}{mov.quantidade}{" "}
                            {mov.estoque.itemContrato.unidadeMedida.sigla}
                          </span>
                        </TableCell>
                        <TableCell>
                          {mov.quantidadeAnterior} {mov.estoque.itemContrato.unidadeMedida.sigla}
                        </TableCell>
                        <TableCell className="font-medium">
                          {mov.quantidadeNova} {mov.estoque.itemContrato.unidadeMedida.sigla}
                        </TableCell>
                        <TableCell>{mov.responsavel}</TableCell>
                        <TableCell>
                          <span className="text-sm">{mov.motivo}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
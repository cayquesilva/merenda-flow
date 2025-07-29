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
  QrCode, // Adicionado para o QR Code
} from "lucide-react";
// Importar todas as interfaces necessárias do seu arquivo de tipos
import {
  Contrato,
  Fornecedor,
  ItemContrato,
  UnidadeMedida,
  UnidadeEducacional,
  Recibo as BaseRecibo,
} from "@/types";
import { useToast } from "@/hooks/use-toast";

// Refinando a interface Estoque para refletir os includes do backend
interface EstoqueDetalhado {
  id: string;
  itemContratoId: string;
  unidadeEducacionalId: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  ultimaAtualizacao: string;
  createdAt: string;
  updatedAt: string;

  itemContrato: ItemContrato & {
    unidadeMedida: UnidadeMedida;
    contrato: Contrato & {
      fornecedor: Fornecedor;
    };
  };
  unidadeEducacional: UnidadeEducacional;
}

// Refinando a interface MovimentacaoEstoque para refletir os includes do backend
interface MovimentacaoEstoqueDetalhada {
  id: string;
  estoqueId: string;
  dataMovimentacao: string;
  tipo: "entrada" | "saida" | "ajuste";
  quantidade: number;
  quantidadeAnterior: number;
  quantidadeNova: number;
  motivo: string;
  responsavel: string;
  reciboId: string | null;
  createdAt: string;
  updatedAt: string;

  estoque: {
    id: string;
    itemContrato: ItemContrato & {
      unidadeMedida: UnidadeMedida;
    };
    unidadeEducacional: UnidadeEducacional;
  };
  recibo: {
    numero: string;
  } | null; // Pode ser nulo se não houver recibo associado
}

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface MovimentacaoDialogProps {
  estoque: EstoqueDetalhado | null; // Usar a interface detalhada
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
    if (
      !estoque ||
      !formData.quantidade ||
      !formData.motivo ||
      !formData.responsavel
    ) {
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
      const response = await fetch(
        "http://localhost:3001/api/estoque/movimentacao",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            estoqueId: estoque.id,
            ...formData,
            quantidade,
          }),
        }
      );

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
          <Edit className="h-3 w-3 mr-1" />
          Movimentar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Movimentação</DialogTitle>
          <DialogDescription>
            {estoque &&
              `${estoque.itemContrato.nome} - ${estoque.unidadeEducacional.nome}`}
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
              onChange={(e) =>
                setFormData({ ...formData, quantidade: e.target.value })
              }
              placeholder="0"
            />
            {estoque && (
              <p className="text-xs text-muted-foreground mt-1">
                Estoque atual: {estoque.quantidadeAtual}{" "}
                {estoque.itemContrato.unidadeMedida.sigla}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="responsavel">Responsável *</Label>
            <Input
              id="responsavel"
              value={formData.responsavel}
              onChange={(e) =>
                setFormData({ ...formData, responsavel: e.target.value })
              }
              placeholder="Nome do responsável"
            />
          </div>

          <div>
            <Label htmlFor="motivo">Motivo *</Label>
            <Textarea
              id="motivo"
              value={formData.motivo}
              onChange={(e) =>
                setFormData({ ...formData, motivo: e.target.value })
              }
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

// NOVO COMPONENTE: Dialog para exibir o QR Code
interface QRCodeDialogProps {
  estoqueId: string;
  itemName: string;
  unidadeNome: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function QRCodeDialog({
  estoqueId,
  itemName,
  unidadeNome,
  open,
  onOpenChange,
}: QRCodeDialogProps) {
  // CORREÇÃO: Usar window.location.origin para obter a base URL dinâmica do frontend
  const frontendBaseUrl = window.location.origin;
  // URL que será codificada no QR Code, levando para a página de saída via QR Code
  const qrcodeDataUrl = `${frontendBaseUrl}/saida-estoque-qrcode/${estoqueId}`;
  // URL para o serviço de geração de QR Code
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    qrcodeDataUrl
  )}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader>
          <DialogTitle>QR Code para Saída de Estoque</DialogTitle>
          <DialogDescription>
            Escaneie este QR Code para registrar a saída de 1 unidade de:
            <br />
            <span className="font-bold text-primary">{itemName}</span> na
            unidade{" "}
            <span className="font-bold text-primary">{unidadeNome}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center p-4">
          <img
            src={qrCodeImageUrl}
            alt={`QR Code para ${itemName}`}
            className="w-48 h-48 border border-gray-300 rounded-lg"
          />
        </div>
        <DialogFooter className="flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            URL:{" "}
            <a
              href={qrcodeDataUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline break-all"
            >
              {qrcodeDataUrl}
            </a>
          </p>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Fechar
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

  const [estoque, setEstoque] = useState<EstoqueDetalhado[]>([]); // Usar a interface detalhada
  const [movimentacoes, setMovimentacoes] = useState<
    MovimentacaoEstoqueDetalhada[]
  >([]); // Usar a interface detalhada
  const [unidades, setUnidades] = useState<UnidadeEducacional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItens: 0,
    itensComEstoque: 0,
    itensAbaixoMinimo: 0,
    valorTotalEstoque: 0,
  });

  const { toast } = useToast();

  // Estados para o Dialog de QR Code
  const [isQRCodeDialogOpen, setIsQRCodeDialogOpen] = useState(false);
  const [selectedQRCodeEstoque, setSelectedQRCodeEstoque] =
    useState<EstoqueDetalhado | null>(null);

  useEffect(() => {
    const fetchUnidades = async () => {
      try {
        const response = await fetch(
          "http://localhost:3001/api/unidades-ativas"
        );
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
        if (unidadeSelecionada !== "todas")
          params.append("unidadeId", unidadeSelecionada);

        const [estoqueRes, movimentacoesRes] = await Promise.all([
          fetch(`http://localhost:3001/api/estoque/consolidado?${params}`),
          fetch(`http://localhost:3001/api/estoque/movimentacoes?${params}`),
        ]);

        if (!estoqueRes.ok || !movimentacoesRes.ok) {
          throw new Error("Falha ao buscar dados do estoque");
        }

        const estoqueData: EstoqueDetalhado[] = await estoqueRes.json(); // Tipagem aqui
        const movimentacoesData: MovimentacaoEstoqueDetalhada[] =
          await movimentacoesRes.json(); // Tipagem aqui

        setEstoque(estoqueData);
        setMovimentacoes(movimentacoesData);

        // Calcular estatísticas
        const totalItens = estoqueData.length;
        const itensComEstoque = estoqueData.filter(
          (e) => e.quantidadeAtual > 0
        ).length;
        const itensAbaixoMinimo = estoqueData.filter(
          (e) =>
            e.quantidadeMinima > 0 && e.quantidadeAtual < e.quantidadeMinima
        ).length;
        const valorTotalEstoque = estoqueData.reduce(
          (sum, e) => sum + e.quantidadeAtual * e.itemContrato.valorUnitario,
          0
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

  const getStatusBadge = (estoque: EstoqueDetalhado) => {
    if (estoque.quantidadeAtual === 0) {
      return <Badge variant="destructive">Sem Estoque</Badge>;
    }
    if (
      estoque.quantidadeMinima > 0 &&
      estoque.quantidadeAtual < estoque.quantidadeMinima
    ) {
      return (
        <Badge variant="outline" className="border-warning text-warning">
          Abaixo do Mínimo
        </Badge>
      );
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

  const handleGenerateQRCode = (item: EstoqueDetalhado) => {
    setSelectedQRCodeEstoque(item);
    setIsQRCodeDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Controle de Estoque
          </h2>
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
                <p className="text-sm font-medium text-muted-foreground">
                  Total de Itens
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">
                  Com Estoque
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">
                  Abaixo do Mínimo
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">
                  Valor Total
                </p>
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
              <Select
                value={unidadeSelecionada}
                onValueChange={setUnidadeSelecionada}
              >
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
                  <h3 className="text-lg font-medium">
                    Nenhum item em estoque
                  </h3>
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
                            <p className="font-medium">
                              {item.itemContrato.nome}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.itemContrato.contrato.numero}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span className="text-sm">
                              {item.unidadeEducacional.nome}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.itemContrato.contrato.fornecedor.nome}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {item.quantidadeAtual}{" "}
                            {item.itemContrato.unidadeMedida.sigla}
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.quantidadeMinima}{" "}
                          {item.itemContrato.unidadeMedida.sigla}
                        </TableCell>
                        <TableCell>{getStatusBadge(item)}</TableCell>
                        <TableCell className="font-medium">
                          R${" "}
                          {(
                            item.quantidadeAtual *
                            item.itemContrato.valorUnitario
                          ).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {new Date(item.ultimaAtualizacao).toLocaleDateString(
                            "pt-BR"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center space-x-2 justify-end">
                            <MovimentacaoDialog
                              estoque={item}
                              onSuccess={handleSuccess}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateQRCode(item)}
                            >
                              <QrCode className="h-3 w-3" />
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
                  <h3 className="text-lg font-medium">
                    Nenhuma movimentação encontrada
                  </h3>
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
                          {new Date(mov.dataMovimentacao).toLocaleDateString(
                            "pt-BR"
                          )}
                        </TableCell>
                        <TableCell>
                          {getTipoMovimentacaoBadge(mov.tipo)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {mov.estoque.itemContrato.nome}
                            </p>
                            {mov.recibo && (
                              <p className="text-xs text-muted-foreground">
                                Recibo: {mov.recibo.numero}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {mov.estoque.unidadeEducacional.nome}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              mov.tipo === "saida"
                                ? "text-destructive"
                                : "text-success"
                            }
                          >
                            {mov.tipo === "saida" ? "-" : "+"}
                            {mov.quantidade}{" "}
                            {mov.estoque.itemContrato.unidadeMedida.sigla}
                          </span>
                        </TableCell>
                        <TableCell>
                          {mov.quantidadeAnterior}{" "}
                          {mov.estoque.itemContrato.unidadeMedida.sigla}
                        </TableCell>
                        <TableCell className="font-medium">
                          {mov.quantidadeNova}{" "}
                          {mov.estoque.itemContrato.unidadeMedida.sigla}
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

      {/* Dialog para exibir o QR Code */}
      {isQRCodeDialogOpen && selectedQRCodeEstoque && (
        <QRCodeDialog
          open={isQRCodeDialogOpen}
          onOpenChange={setIsQRCodeDialogOpen}
          estoqueId={selectedQRCodeEstoque.id}
          itemName={selectedQRCodeEstoque.itemContrato.nome}
          unidadeNome={selectedQRCodeEstoque.unidadeEducacional.nome}
        />
      )}
    </div>
  );
}

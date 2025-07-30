import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress";
import {
  Package,
  Download,
  Building2,
  TrendingUp,
  TrendingDown,
  Filter,
  AlertTriangle,
  BarChart3,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Importar as interfaces base do seu arquivo de tipos
import {
  Estoque as BaseEstoque,
  MovimentacaoEstoque as BaseMovimentacaoEstoque,
  UnidadeEducacional,
  ItemContrato,
  Contrato,
  Fornecedor,
  UnidadeMedida,
  Recibo,
} from "@/types";

// Interfaces detalhadas para corresponder ao retorno da API
interface ItemContratoDetalhado extends ItemContrato {
  contrato: Contrato & {
    fornecedor: Fornecedor;
  };
  unidadeMedida: UnidadeMedida;
}

interface EstoqueDetalhadoRelatorio extends BaseEstoque {
  itemContrato: ItemContratoDetalhado;
  unidadeEducacional: UnidadeEducacional;
}

// CORREÇÃO: Usando Omit para remover 'estoque' e 'recibo' da interface base
interface MovimentacaoEstoqueDetalhadaRelatorio
  extends Omit<BaseMovimentacaoEstoque, "estoque" | "recibo"> {
  estoque: {
    id: string; // O ID do estoque é o único que vem diretamente aqui, o resto está aninhado
    itemContrato: ItemContratoDetalhado; // Reutiliza a interface detalhada
    unidadeEducacional: UnidadeEducacional;
  };
  recibo: {
    numero: string;
  } | null; // Pode ser nulo
}

interface RelatorioEstoqueData {
  estoque: EstoqueDetalhadoRelatorio[]; // Usar a interface detalhada aqui
  movimentacoes: MovimentacaoEstoqueDetalhadaRelatorio[]; // Usar a interface detalhada aqui
  estatisticas: {
    totalItens: number;
    itensComEstoque: number;
    itensAbaixoMinimo: number;
    valorTotalEstoque: number;
    totalEntradas: number;
    totalSaidas: number;
    totalMovimentacoes: number;
  };
}

export function RelatorioEstoque() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("all");
  const [dados, setDados] = useState<RelatorioEstoqueData | null>(null);
  const [unidades, setUnidades] = useState<UnidadeEducacional[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUnidades = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/unidades-ativas`
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

  const gerarRelatorio = async () => {
    if (!dataInicio || !dataFim) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o período para gerar o relatório",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        dataInicio,
        dataFim,
        ...(unidadeSelecionada !== "all" && { unidadeId: unidadeSelecionada }),
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/relatorios/estoque-unidade?${params}`
      );

      if (response.ok) {
        const data: RelatorioEstoqueData = await response.json(); // Tipagem aqui
        setDados(data);
        toast({
          title: "Relatório gerado!",
          description: "Relatório de estoque gerado com sucesso",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao gerar relatório");
      }
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível gerar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportarPDF = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A exportação em PDF será implementada em breve",
      variant: "destructive",
    });
  };

  const getStatusBadge = (estoque: EstoqueDetalhadoRelatorio) => {
    // Usar a interface detalhada
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
      entrada: <TrendingUp className="h-3 w-3 mr-1" />,
      saida: <TrendingDown className="h-3 w-3 mr-1" />,
      ajuste: <BarChart3 className="h-3 w-3 mr-1" />,
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Relatório de Estoque
          </CardTitle>
          <CardDescription>
            Analise o estoque e movimentações por unidade educacional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="unidade">Unidade (Opcional)</Label>
              <Select
                value={unidadeSelecionada}
                onValueChange={setUnidadeSelecionada}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as unidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as unidades</SelectItem>
                  {unidades.map((unidade) => (
                    <SelectItem key={unidade.id} value={unidade.id}>
                      {unidade.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={gerarRelatorio} disabled={isLoading}>
                <Filter className="mr-2 h-4 w-4" />
                Gerar Relatório
              </Button>
              {dados && (
                <Button variant="outline" onClick={exportarPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {dados && (
        <>
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
                    <p className="text-2xl font-bold">
                      {dados.estatisticas.totalItens}
                    </p>
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
                    <p className="text-2xl font-bold">
                      {dados.estatisticas.itensComEstoque}
                    </p>
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
                    <p className="text-2xl font-bold">
                      {dados.estatisticas.itensAbaixoMinimo}
                    </p>
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
                      R$ {dados.estatisticas.valorTotalEstoque.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo de Movimentações */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Movimentações no Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-success">
                      {dados.estatisticas.totalEntradas}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total de Entradas
                    </p>
                    <Progress
                      value={
                        dados.estatisticas.totalMovimentacoes > 0
                          ? (dados.estatisticas.totalEntradas /
                              dados.estatisticas.totalMovimentacoes) *
                            100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-destructive">
                      {dados.estatisticas.totalSaidas}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total de Saídas
                    </p>
                    <Progress
                      value={
                        dados.estatisticas.totalMovimentacoes > 0
                          ? (dados.estatisticas.totalSaidas /
                              dados.estatisticas.totalMovimentacoes) *
                            100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-primary">
                      {dados.estatisticas.totalMovimentacoes}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total de Movimentações
                    </p>
                    <Progress value={100} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estoque Atual */}
          <Card>
            <CardHeader>
              <CardTitle>Estoque Atual por Unidade</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Mínimo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dados.estoque.map((item) => (
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
                          item.quantidadeAtual * item.itemContrato.valorUnitario
                        ).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Movimentações */}
          <Card>
            <CardHeader>
              <CardTitle>Movimentações no Período</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dados.movimentacoes.map((mov) => (
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
                      <TableCell>{mov.responsavel}</TableCell>
                      <TableCell>
                        <span className="text-sm">{mov.motivo}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

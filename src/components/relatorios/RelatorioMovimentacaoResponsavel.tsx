import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Loader2,
  Filter,
  User,
  Calendar,
  Package,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Building2,
  Trash2,
  Truck,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  MovimentacaoEstoque,
  Estoque,
  ItemContrato,
  UnidadeMedida,
  Contrato,
  Fornecedor,
  UnidadeEducacional,
  Recibo,
} from "@/types";
import { Progress } from "../ui/progress";

// Interfaces detalhadas para corresponder ao retorno da API
interface ItemContratoRelatorio extends ItemContrato {
  unidadeMedida: UnidadeMedida;
  contrato: Contrato & {
    fornecedor: Fornecedor;
  };
}

interface EstoqueRelatorio extends Estoque {
  itemContrato: ItemContratoRelatorio;
  unidadeEducacional: UnidadeEducacional;
}

interface MovimentacaoEstoqueRelatorio extends MovimentacaoEstoque {
  estoque: EstoqueRelatorio;
  recibo: Recibo | null;
  unidadeDestino?: UnidadeEducacional | null;
  fotoDescarte?: { url: string } | null;
}

interface RelatorioMovimentacaoData {
  movimentacoes: MovimentacaoEstoqueRelatorio[];
  estatisticas: {
    totalMovimentacoes: number;
    totalEntradas: number;
    totalSaidas: number;
    totalAjustes: number;
    totalDescartes: number;
    totalRemanejamentos: number;
    contaEntradas: number;
    contaSaidas: number;
    contaDescartes: number;
    contaRemanejamentos: number;
    contaAjustes: number;
  };
}

// NOVO: Interface para as unidades com tipo de estoque
interface UnidadeComTipoEstoque extends UnidadeEducacional {
  tipoEstoque: "creche" | "escola";
}

export default function RelatorioMovimentacaoResponsavel() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [responsavelSelecionado, setResponsavelSelecionado] = useState("all");
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("all");
  const [tipoMovimentacaoSelecionada, setTipoMovimentacaoSelecionada] =
    useState("all");
  const [responsaveis, setResponsaveis] = useState<string[]>([]);
  const [unidades, setUnidades] = useState<UnidadeComTipoEstoque[]>([]);
  const [dados, setDados] = useState<RelatorioMovimentacaoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { toast } = useToast();

  // Busca a lista de responsáveis e unidades
  useEffect(() => {
    const fetchDadosIniciais = async () => {
      try {
        const [responsaveisRes, unidadesRes] = await Promise.all([
          fetch(
            `${
              import.meta.env.VITE_API_URL || "http://localhost:3001"
            }/api/movimentacoes/responsaveis`
          ),
          fetch(
            `${
              import.meta.env.VITE_API_URL || "http://localhost:3001"
            }/api/unidades-com-tipo-estoque`
          ),
        ]);

        if (responsaveisRes.ok) {
          setResponsaveis(await responsaveisRes.json());
        }
        if (unidadesRes.ok) {
          setUnidades(await unidadesRes.json());
        }
      } catch (error) {
        console.error("Erro ao buscar dados iniciais:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados para os filtros.",
          variant: "destructive",
        });
      }
    };
    fetchDadosIniciais();
  }, [toast]);

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
        ...(responsavelSelecionado !== "all" && {
          responsavel: responsavelSelecionado,
        }),
        ...(unidadeSelecionada !== "all" && {
          unidadeId: unidadeSelecionada,
        }),
        ...(tipoMovimentacaoSelecionada !== "all" && {
          tipoMovimentacao: tipoMovimentacaoSelecionada,
        }),
      });

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/relatorios/movimentacao-responsavel?${params}`
      );

      if (response.ok) {
        const data: RelatorioMovimentacaoData = await response.json();
        setDados(data);
        toast({
          title: "Relatório gerado!",
          description:
            "Relatório de movimentação por responsável gerado com sucesso.",
          variant: "default",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao gerar relatório.");
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro ao Gerar Relatório",
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

  const exportarPDF = async () => {
    if (!dados || isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/relatorios/movimentacao-responsavel-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dataInicio,
            dataFim,
            responsavel: responsavelSelecionado,
            unidadeId: unidadeSelecionada,
            tipoMovimentacao: tipoMovimentacaoSelecionada,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao gerar o PDF.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-movimentacao-${dataInicio}_${dataFim}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "PDF gerado!",
        description: "O relatório de movimentação foi exportado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível exportar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getTipoMovimentacaoBadge = (
    tipo: string,
    anterior: number,
    novo: number
  ) => {
    const variants = {
      entrada: "default",
      saida: "destructive",
      ajuste: "outline",
      descarte: "destructive",
      remanejamento: anterior > novo ? "destructive" : "default",
    } as const;

    const icons = {
      entrada: <TrendingUp className="h-3 w-3 mr-1" />,
      saida: <TrendingDown className="h-3 w-3 mr-1" />,
      ajuste: <BarChart3 className="h-3 w-3 mr-1" />,
      descarte: <Trash2 className="h-3 w-3 mr-1" />,
      remanejamento: <Truck className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge variant={variants[tipo as keyof typeof variants] || "outline"}>
        {icons[tipo as keyof typeof variants]}
        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Relatório de Movimentação por Responsável
          </CardTitle>
          <CardDescription>
            Visualize as movimentações de estoque realizadas por um responsável
            específico em um determinado período.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <Label htmlFor="responsavel">Responsável</Label>
              <Select
                value={responsavelSelecionado}
                onValueChange={setResponsavelSelecionado}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os responsáveis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os responsáveis</SelectItem>
                  {responsaveis.map((resp) => (
                    <SelectItem key={resp} value={resp}>
                      {resp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* NOVO: Filtro por unidade */}
            <div>
              <Label htmlFor="unidade">Unidade</Label>
              <Select
                value={unidadeSelecionada}
                onValueChange={setUnidadeSelecionada}
                disabled={isLoading}
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
            {/* NOVO: Filtro por tipo de movimentação */}
            <div>
              <Label htmlFor="tipoMovimentacao">Tipo de Movimentação</Label>
              <Select
                value={tipoMovimentacaoSelecionada}
                onValueChange={setTipoMovimentacaoSelecionada}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="ajuste">Ajuste</SelectItem>
                  <SelectItem value="remanejamento">Remanejamento</SelectItem>
                  <SelectItem value="descarte">Descarte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={gerarRelatorio} disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {!isLoading && <Filter className="h-4 w-4" />}
                Gerar Relatório
              </Button>
              {dados && (
                <Button onClick={exportarPDF} disabled={isGeneratingPdf}>
                  {isGeneratingPdf && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {!isGeneratingPdf && <Download className="h-4 w-4" />}
                  Exportar PDF
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {dados && (
        <>
          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas do Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="text-center">
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-success">
                      {dados.estatisticas.contaEntradas}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total de Entradas
                    </p>
                    <Progress
                      value={
                        dados.estatisticas.totalMovimentacoes > 0
                          ? (dados.estatisticas.contaEntradas /
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
                    <p className="text-2xl font-bold text-success">
                      {dados.estatisticas.contaAjustes}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total de Ajustes
                    </p>
                    <Progress
                      value={
                        dados.estatisticas.totalMovimentacoes > 0
                          ? (dados.estatisticas.contaAjustes /
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
                      {dados.estatisticas.contaSaidas}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total de Saídas
                    </p>
                    <Progress
                      value={
                        dados.estatisticas.totalMovimentacoes > 0
                          ? (dados.estatisticas.contaSaidas /
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
                      {dados.estatisticas.contaDescartes}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total de Descartes
                    </p>
                    <Progress
                      value={
                        dados.estatisticas.totalMovimentacoes > 0
                          ? (dados.estatisticas.contaDescartes /
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
                      {dados.estatisticas.contaRemanejamentos}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total de Remanejamentos{" "}
                      <span className="text-success text-[10px]">
                        (Entrada e Saída)
                      </span>
                    </p>
                    <Progress
                      value={
                        dados.estatisticas.totalMovimentacoes > 0
                          ? (dados.estatisticas.contaRemanejamentos /
                              dados.estatisticas.totalMovimentacoes) *
                            100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes das Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              {dados.movimentacoes.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">
                    Nenhuma movimentação encontrada
                  </h3>
                  <p className="text-muted-foreground">
                    Ajuste os filtros ou o período para visualizar as
                    movimentações.
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
                    {dados.movimentacoes.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell>
                          {new Date(mov.dataMovimentacao).toLocaleDateString(
                            "pt-BR"
                          )}
                        </TableCell>
                        <TableCell>
                          {getTipoMovimentacaoBadge(
                            mov.tipo,
                            mov.quantidadeAnterior,
                            mov.quantidadeNova
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {mov.estoque.itemContrato.nome}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Contrato:{" "}
                              {mov.estoque.itemContrato.contrato.numero}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {mov.estoque.unidadeEducacional.nome}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              mov.tipo === "saida" ||
                              mov.tipo === "descarte" ||
                              (mov.tipo === "remanejamento" &&
                                mov.quantidadeAnterior > mov.quantidadeNova)
                                ? "text-destructive"
                                : "text-success"
                            }
                          >
                            {mov.tipo === "saida" ||
                            mov.tipo === "descarte" ||
                            (mov.tipo === "remanejamento" &&
                              mov.quantidadeAnterior > mov.quantidadeNova)
                              ? "-"
                              : "+"}
                            {mov.quantidade}{" "}
                            {mov.estoque.itemContrato.unidadeMedida.sigla}
                          </span>
                        </TableCell>
                        <TableCell>
                          {mov.quantidadeAnterior}{" "}
                          {mov.estoque.itemContrato.unidadeMedida.sigla}
                        </TableCell>
                        <TableCell>
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
        </>
      )}
    </div>
  );
}

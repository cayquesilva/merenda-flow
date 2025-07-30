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
} from "@/types"; // Importar tipos necessários

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
  recibo: Recibo | null; // Recibo pode ser nulo
}

interface RelatorioMovimentacaoData {
  movimentacoes: MovimentacaoEstoqueRelatorio[];
  estatisticas: {
    totalMovimentacoes: number;
    totalEntradas: number;
    totalSaidas: number;
    totalAjustes: number;
  };
}

export default function RelatorioMovimentacaoResponsavel() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [responsavelSelecionado, setResponsavelSelecionado] = useState("all");
  const [responsaveis, setResponsaveis] = useState<string[]>([]); // Lista de responsáveis
  const [dados, setDados] = useState<RelatorioMovimentacaoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Busca a lista de responsáveis por movimentações
  useEffect(() => {
    const fetchResponsaveis = async () => {
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:3001"
          }/api/movimentacoes/responsaveis`
        );
        if (response.ok) {
          setResponsaveis(await response.json());
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Falha ao buscar responsáveis.");
        }
      } catch (error) {
        console.error("Erro ao buscar responsáveis:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de responsáveis.",
          variant: "destructive",
        });
      }
    };
    fetchResponsaveis();
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
              <Label htmlFor="responsavel">Responsável (Opcional)</Label>
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
            <div className="flex items-end gap-2">
              <Button onClick={gerarRelatorio} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Filter className="mr-2 h-4 w-4" />
                )}
                Gerar Relatório
              </Button>
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
                      Movimentações Registradas
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-success">
                      {dados.estatisticas.totalEntradas}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total de Entradas
                    </p>
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
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Movimentações */}
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
                          {getTipoMovimentacaoBadge(mov.tipo)}
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
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span className="text-sm">
                              {mov.estoque.unidadeEducacional.nome}
                            </span>
                          </div>
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
        </>
      )}
    </div>
  );
}

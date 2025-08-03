import { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  Download,
  Building,
  TrendingUp,
  Filter,
  Users,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Interface para o objeto de gastos por fornecedor (reflete o que o backend retorna)
interface GastoFornecedor {
  fornecedorId: string;
  fornecedorNome: string;
  totalGasto: number;
  totalPedidos: number;
}

interface RelatorioGastosData {
  gastosPorFornecedor: GastoFornecedor[]; // Tipagem ajustada aqui
  estatisticas: {
    totalFornecedores: number;
    gastoTotal: number;
    pedidosTotal: number;
  };
}

// Interface simplificada para o fornecedor (usada no Select)
interface FornecedorSimplificado {
  id: string;
  nome: string;
}

export function RelatorioGastosFornecedor() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState("all"); // Valor inicial 'all'
  const [dados, setDados] = useState<RelatorioGastosData | null>(null);
  const [fornecedores, setFornecedores] = useState<FornecedorSimplificado[]>(
    []
  ); // Estado para a lista de fornecedores
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false); // NOVO
  const { toast } = useToast();

  // Efeito para buscar a lista de fornecedores ativos ao carregar o componente
  useEffect(() => {
    const fetchFornecedores = async () => {
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:3001"
          }/api/fornecedores/lista`
        );
        if (response.ok) {
          const data: FornecedorSimplificado[] = await response.json(); // Tipagem aqui
          setFornecedores(data);
        } else {
          const errorData = await response.json();
          console.error(
            "Erro ao buscar fornecedores:",
            errorData.error || "Falha ao buscar fornecedores."
          );
        }
      } catch (error) {
        console.error("Erro ao buscar fornecedores:", error);
      }
    };
    fetchFornecedores();
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
        // Adiciona fornecedorId aos parâmetros se um fornecedor específico for selecionado
        ...(fornecedorSelecionado !== "all" && {
          fornecedorId: fornecedorSelecionado,
        }),
      });

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/relatorios/gastos-fornecedor?${params}`
      );

      if (response.ok) {
        const data: RelatorioGastosData = await response.json(); // Tipagem ajustada aqui
        setDados(data);
        toast({
          title: "Relatório gerado!",
          description: "Relatório de gastos por fornecedor gerado com sucesso",
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

  // NOVO: Função para exportar o relatório como PDF
  const exportarPDF = async () => {
    if (!dados || isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/relatorios/gastos-fornecedor-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dataInicio,
            dataFim,
            fornecedorId: fornecedorSelecionado,
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
      a.download = `relatorio-gastos-${dataInicio}_${dataFim}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "PDF gerado!",
        description: "O relatório de gastos foi exportado com sucesso.",
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Relatório de Gastos por Fornecedor
          </CardTitle>
          <CardDescription>
            Analise os gastos realizados com cada fornecedor por período
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
              <Label htmlFor="fornecedor">Fornecedor (Opcional)</Label>
              <Select
                value={fornecedorSelecionado}
                onValueChange={setFornecedorSelecionado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os fornecedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os fornecedores</SelectItem>
                  {fornecedores.map((fornecedor) => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                    </SelectItem>
                  ))}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Gasto Total
                    </p>
                    <p className="text-2xl font-bold">
                      R$ {dados.estatisticas.gastoTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Users className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Fornecedores
                    </p>
                    <p className="text-2xl font-bold">
                      {dados.estatisticas.totalFornecedores}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Building className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Pedidos
                    </p>
                    <p className="text-2xl font-bold">
                      {dados.estatisticas.pedidosTotal}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ranking de Gastos por Fornecedor</CardTitle>
              <CardDescription>
                Fornecedores ordenados por valor total gasto no período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Posição</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Total Gasto</TableHead>
                    <TableHead>Total Pedidos</TableHead>
                    <TableHead>Ticket Médio</TableHead>
                    <TableHead>% do Total</TableHead>
                    <TableHead>Participação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dados.gastosPorFornecedor.map((fornecedor, index) => {
                    const ticketMedio =
                      fornecedor.totalPedidos > 0
                        ? fornecedor.totalGasto / fornecedor.totalPedidos
                        : 0;
                    const percentualParticipacao =
                      dados.estatisticas.gastoTotal > 0
                        ? (fornecedor.totalGasto /
                            dados.estatisticas.gastoTotal) *
                          100
                        : 0;

                    return (
                      <TableRow key={fornecedor.fornecedorId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {index === 0 && (
                              <TrendingUp className="h-4 w-4 text-success" />
                            )}
                            <span className="font-bold">#{index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {fornecedor.fornecedorNome}
                        </TableCell>
                        <TableCell className="font-semibold">
                          R$ {fornecedor.totalGasto.toFixed(2)}
                        </TableCell>
                        <TableCell>{fornecedor.totalPedidos}</TableCell>
                        <TableCell>R$ {ticketMedio.toFixed(2)}</TableCell>
                        <TableCell>
                          {percentualParticipacao.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={percentualParticipacao}
                              className="w-20 h-2"
                            />
                            <span className="text-xs text-muted-foreground">
                              {percentualParticipacao.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Análise de Concentração</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Top 3 Fornecedores</h4>
                  <div className="space-y-3">
                    {dados.gastosPorFornecedor.slice(0, 3).map((fornecedor) => {
                      const percentual =
                        dados.estatisticas.gastoTotal > 0
                          ? (fornecedor.totalGasto /
                              dados.estatisticas.gastoTotal) *
                            100
                          : 0;
                      return (
                        <div
                          key={fornecedor.fornecedorId}
                          className="space-y-2"
                        >
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">
                              {fornecedor.fornecedorNome}
                            </span>
                            <span>{percentual.toFixed(1)}%</span>
                          </div>
                          <Progress value={percentual} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Estatísticas</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Concentração Top 3:</span>
                      <span className="font-medium">
                        {dados.gastosPorFornecedor
                          .slice(0, 3)
                          .reduce(
                            (sum, f) =>
                              sum +
                              (f.totalGasto / dados.estatisticas.gastoTotal) *
                                100,
                            0
                          )
                          .toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ticket médio geral:</span>
                      <span className="font-medium">
                        R${" "}
                        {dados.estatisticas.pedidosTotal > 0
                          ? (
                              dados.estatisticas.gastoTotal /
                              dados.estatisticas.pedidosTotal
                            ).toFixed(2)
                          : (0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maior ticket médio:</span>
                      <span className="font-medium">
                        R${" "}
                        {dados.gastosPorFornecedor.length > 0
                          ? Math.max(
                              ...dados.gastosPorFornecedor.map((f) =>
                                f.totalPedidos > 0
                                  ? f.totalGasto / f.totalPedidos
                                  : 0
                              )
                            ).toFixed(2)
                          : (0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

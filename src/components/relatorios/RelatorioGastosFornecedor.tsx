import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  Download,
  Building,
  TrendingUp,
  Filter,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RelatorioGastosData {
  gastosPorFornecedor: {
    fornecedorId: string;
    fornecedorNome: string;
    totalGasto: number;
    totalPedidos: number;
  }[];
  estatisticas: {
    totalFornecedores: number;
    gastoTotal: number;
    pedidosTotal: number;
  };
}

export function RelatorioGastosFornecedor() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [dados, setDados] = useState<RelatorioGastosData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
      const params = new URLSearchParams({ dataInicio, dataFim });
      const response = await fetch(`http://localhost:3001/api/relatorios/gastos-fornecedor?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setDados(data);
        toast({
          title: "Relatório gerado!",
          description: "Relatório de gastos por fornecedor gerado com sucesso",
        });
      } else {
        throw new Error('Falha ao gerar relatório');
      }
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: "Não foi possível gerar o relatório. Tente novamente.",
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Gasto Total</p>
                    <p className="text-2xl font-bold">R$ {dados.estatisticas.gastoTotal.toFixed(2)}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Fornecedores</p>
                    <p className="text-2xl font-bold">{dados.estatisticas.totalFornecedores}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Total Pedidos</p>
                    <p className="text-2xl font-bold">{dados.estatisticas.pedidosTotal}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ranking de Fornecedores */}
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
                    const ticketMedio = fornecedor.totalGasto / fornecedor.totalPedidos;
                    const percentualParticipacao = (fornecedor.totalGasto / dados.estatisticas.gastoTotal) * 100;
                    
                    return (
                      <TableRow key={fornecedor.fornecedorId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {index === 0 && <TrendingUp className="h-4 w-4 text-success" />}
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
                        <TableCell>
                          R$ {ticketMedio.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {percentualParticipacao.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={percentualParticipacao} className="w-20 h-2" />
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

          {/* Análise de Concentração */}
          <Card>
            <CardHeader>
              <CardTitle>Análise de Concentração</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Top 3 Fornecedores</h4>
                  <div className="space-y-3">
                    {dados.gastosPorFornecedor.slice(0, 3).map((fornecedor, index) => {
                      const percentual = (fornecedor.totalGasto / dados.estatisticas.gastoTotal) * 100;
                      return (
                        <div key={fornecedor.fornecedorId} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{fornecedor.fornecedorNome}</span>
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
                        {dados.gastosPorFornecedor.slice(0, 3)
                          .reduce((sum, f) => sum + (f.totalGasto / dados.estatisticas.gastoTotal * 100), 0)
                          .toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ticket médio geral:</span>
                      <span className="font-medium">
                        R$ {(dados.estatisticas.gastoTotal / dados.estatisticas.pedidosTotal).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maior ticket médio:</span>
                      <span className="font-medium">
                        R$ {Math.max(...dados.gastosPorFornecedor.map(f => f.totalGasto / f.totalPedidos)).toFixed(2)}
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
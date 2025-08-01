import { useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Download,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Filter,
  Target,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Recibo } from "@/types"; // Importando a interface Recibo do seu arquivo de tipos

// Interface para os itens do relatório de conformidade, estendendo Recibo
interface ReciboConformidadeDetalhado extends Recibo {
  totalItens: number;
  itensConformes: number;
  percentualConformidade: number;
}

interface RelatorioConformidadeData {
  analiseConformidade: ReciboConformidadeDetalhado[]; // Tipagem ajustada aqui
  estatisticas: {
    totalRecibos: number;
    mediaConformidade: number;
    recibosConformes: number;
    recibosParciais: number;
    recibosNaoConformes: number;
  };
}

export function RelatorioConformidade() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [dados, setDados] = useState<RelatorioConformidadeData | null>(null);
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
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/relatorios/conformidade?${params}`
      );

      if (response.ok) {
        const data: RelatorioConformidadeData = await response.json(); // Tipagem aqui
        setDados(data);
        toast({
          title: "Relatório gerado!",
          description: "Relatório de conformidade gerado com sucesso",
        });
      } else {
        // Se a resposta não for OK, tente ler a mensagem de erro do backend
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

  const getConformidadeBadge = (percentual: number) => {
    if (percentual === 100) {
      return (
        <Badge variant="default" className="bg-success text-success-foreground">
          100% Conforme
        </Badge>
      );
    } else if (percentual >= 80) {
      return <Badge variant="outline">Parcialmente Conforme</Badge>;
    } else {
      return <Badge variant="destructive">Não Conforme</Badge>;
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
            <Target className="h-5 w-5" />
            Relatório de Conformidade
          </CardTitle>
          <CardDescription>
            Analise a conformidade das entregas e identificação de problemas
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Recibos
                    </p>
                    <p className="text-2xl font-bold">
                      {dados.estatisticas.totalRecibos}
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
                      Média Conformidade
                    </p>
                    <p className="text-2xl font-bold">
                      {dados.estatisticas.mediaConformidade.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Totalmente Conformes
                    </p>
                    <p className="text-2xl font-bold">
                      {dados.estatisticas.recibosConformes}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Não Conformes
                    </p>
                    <p className="text-2xl font-bold">
                      {dados.estatisticas.recibosNaoConformes}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribuição de Conformidade */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Conformidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-success">
                      {dados.estatisticas.recibosConformes}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Totalmente Conformes
                    </p>
                    <Progress
                      value={
                        (dados.estatisticas.recibosConformes /
                          dados.estatisticas.totalRecibos) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-warning">
                      {dados.estatisticas.recibosParciais}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Parcialmente Conformes
                    </p>
                    <Progress
                      value={
                        (dados.estatisticas.recibosParciais /
                          dados.estatisticas.totalRecibos) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-destructive">
                      {dados.estatisticas.recibosNaoConformes}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Não Conformes
                    </p>
                    <Progress
                      value={
                        (dados.estatisticas.recibosNaoConformes /
                          dados.estatisticas.totalRecibos) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Análise Detalhada */}
          <Card>
            <CardHeader>
              <CardTitle>Análise Detalhada por Recibo</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recibo</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Conformidade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dados.analiseConformidade.map((recibo) => (
                    <TableRow key={recibo.id}>
                      <TableCell className="font-mono">
                        {recibo.numero}
                      </TableCell>
                      <TableCell>{recibo.unidadeEducacional.nome}</TableCell>
                      <TableCell>
                        {recibo.pedido.contrato.fornecedor.nome}
                      </TableCell>
                      <TableCell>
                        {new Date(recibo.dataEntrega).toLocaleDateString(
                          "pt-BR"
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {recibo.itensConformes}/{recibo.totalItens} conformes
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={recibo.percentualConformidade}
                              className="w-16 h-2"
                            />
                            <span className="text-sm">
                              {recibo.percentualConformidade.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getConformidadeBadge(recibo.percentualConformidade)}
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

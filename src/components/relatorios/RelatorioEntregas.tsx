import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Package,
  Download,
  Calendar,
  Building2,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RelatorioEntregasData {
  recibos: any[];
  estatisticas: {
    totalEntregas: number;
    entregasConfirmadas: number;
    entregasPendentes: number;
    valorTotalEntregue: number;
  };
}

interface UnidadeEducacional {
  id: string;
  nome: string;
  codigo: string;
}

export function RelatorioEntregas() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("");
  const [dados, setDados] = useState<RelatorioEntregasData | null>(null);
  const [unidades, setUnidades] = useState<UnidadeEducacional[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUnidades = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/unidades-ativas");
        if (response.ok) {
          const data = await response.json();
          setUnidades(data);
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
        ...(unidadeSelecionada && { unidadeId: unidadeSelecionada })
      });

      const response = await fetch(`http://localhost:3001/api/relatorios/entregas?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDados(data);
        toast({
          title: "Relatório gerado!",
          description: "Relatório de entregas gerado com sucesso",
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
            <Package className="h-5 w-5" />
            Relatório de Entregas
          </CardTitle>
          <CardDescription>
            Acompanhe as entregas realizadas por período e unidade educacional
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
              <Select value={unidadeSelecionada} onValueChange={setUnidadeSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as unidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as unidades</SelectItem>
                  {unidades.map(unidade => (
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
                    <p className="text-sm font-medium text-muted-foreground">Total Entregas</p>
                    <p className="text-2xl font-bold">{dados.estatisticas.totalEntregas}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Confirmadas</p>
                    <p className="text-2xl font-bold">{dados.estatisticas.entregasConfirmadas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Clock className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                    <p className="text-2xl font-bold">{dados.estatisticas.entregasPendentes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <DollarSign className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Valor Entregue</p>
                    <p className="text-2xl font-bold">R$ {dados.estatisticas.valorTotalEntregue.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Entregas */}
          <Card>
            <CardHeader>
              <CardTitle>Entregas Realizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recibo</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responsável</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dados.recibos.map((recibo) => (
                    <TableRow key={recibo.id}>
                      <TableCell className="font-mono">{recibo.numero}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {recibo.unidadeEducacional.nome}
                        </div>
                      </TableCell>
                      <TableCell>{recibo.pedido.contrato.fornecedor.nome}</TableCell>
                      <TableCell>
                        {new Date(recibo.dataEntrega).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={recibo.status === 'confirmado' ? 'default' : 'secondary'}>
                          {recibo.status === 'confirmado' ? 'Confirmado' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell>{recibo.responsavelRecebimento || recibo.responsavelEntrega}</TableCell>
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
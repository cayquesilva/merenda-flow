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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  Package,
  Building2,
  Eye,
  FileText,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Layers,
  Loader2,
} from "lucide-react";
import { ConsolidacaoPedido, Recibo } from "@/types";

interface ConfirmacaoDetalhada extends Recibo {
  percentualConformidade: number;
  eficienciaEntrega: number;
  totalRecebido: number;
  totalSolicitado: number;
}

interface ConfirmacoesData {
  consolidacoes: ConsolidacaoPedido[];
  confirmacoesDetalhadas: ConfirmacaoDetalhada[];
}

export default function Confirmacoes() {
  const [busca, setBusca] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [isLoading, setIsLoading] = useState(true);
  const [consolidacoes, setConsolidacoes] = useState<ConsolidacaoPedido[]>([]);
  const [confirmacoes, setConfirmacoes] = useState<ConfirmacaoDetalhada[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    confirmados: 0,
    parciais: 0,
    mediaConformidade: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:3001/api/confirmacoes");
        if (!response.ok) throw new Error("Falha ao buscar dados.");
        const data: ConfirmacoesData = await response.json();
        setConsolidacoes(data.consolidacoes);
        setConfirmacoes(data.confirmacoesDetalhadas);

        // Calculate stats
        const totalConfirmacoes = data.confirmacoesDetalhadas.length;
        const pendentes = data.confirmacoesDetalhadas.filter(
          (c) => c.status === "pendente"
        ).length;
        const confirmados = data.confirmacoesDetalhadas.filter(
          (c) => c.status === "confirmado"
        ).length;
        const parciais = data.confirmacoesDetalhadas.filter(
          (c) => c.status === "parcial"
        ).length;

        const mediaConformidade =
          totalConfirmacoes > 0
            ? data.confirmacoesDetalhadas.reduce(
                (sum, conf) => sum + conf.percentualConformidade,
                0
              ) / totalConfirmacoes
            : 0;

        setStats({
          total: totalConfirmacoes,
          pendentes,
          confirmados,
          parciais,
          mediaConformidade,
        });
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Lógica de filtragem no frontend
  const confirmacoesFiltradas = confirmacoes.filter((c) => {
    const matchBusca =
      c.numero.toLowerCase().includes(busca.toLowerCase()) ||
      c.pedido.numero.toLowerCase().includes(busca.toLowerCase()) ||
      c.pedido.contrato.fornecedor.nome
        .toLowerCase()
        .includes(busca.toLowerCase());
    const matchStatus = statusFilter === "todos" || c.status === statusFilter;
    return matchBusca && matchStatus;
  });

  const consolidacoesFiltradas = consolidacoes.filter((c) => {
    const matchBusca =
      c.pedido.numero.toLowerCase().includes(busca.toLowerCase()) ||
      c.pedido.contrato.fornecedor.nome
        .toLowerCase()
        .includes(busca.toLowerCase());
    const matchStatus =
      statusFilter === "todos" || c.statusConsolidacao === statusFilter;
    return matchBusca && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: "secondary",
      confirmado: "default",
      parcial: "outline",
      rejeitado: "destructive",
      completo: "default",
    } as const;

    const labels = {
      pendente: "Pendente",
      confirmado: "Confirmado",
      parcial: "Parcial",
      rejeitado: "Rejeitado",
      completo: "Completo",
    };

    const icons = {
      pendente: <Clock className="h-3 w-3 mr-1" />,
      confirmado: <CheckCircle className="h-3 w-3 mr-1" />,
      parcial: <AlertTriangle className="h-3 w-3 mr-1" />,
      rejeitado: <AlertTriangle className="h-3 w-3 mr-1" />,
      completo: <CheckCircle className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Confirmações de Recebimento
          </h2>
          <p className="text-muted-foreground">
            Acompanhe as confirmações de recebimento e conformidade das entregas
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Recibos
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
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
                <p className="text-sm font-medium text-muted-foreground">
                  Pendentes
                </p>
                <p className="text-2xl font-bold">{stats.pendentes}</p>
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
                  Confirmadas
                </p>
                <p className="text-2xl font-bold">{stats.confirmados}</p>
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
                  Parciais
                </p>
                <p className="text-2xl font-bold">{stats.parciais}</p>
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
                  Conformidade Média
                </p>
                <p className="text-2xl font-bold">
                  {stats.mediaConformidade.toFixed(1)}%
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
                  placeholder="Buscar por número do recibo, pedido ou fornecedor..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "todos" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("todos")}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === "pendente" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pendente")}
              >
                Pendentes
              </Button>
              <Button
                variant={statusFilter === "confirmado" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("confirmado")}
              >
                Confirmados
              </Button>
              <Button
                variant={statusFilter === "parcial" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("parcial")}
              >
                Parciais
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="consolidacoes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="consolidacoes">
            <Layers className="mr-2 h-4 w-4" />
            Consolidações de Pedidos
          </TabsTrigger>
          <TabsTrigger value="recibos">
            <FileText className="mr-2 h-4 w-4" />
            Recibos Individuais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consolidacoes">
          <Card>
            <CardHeader>
              <CardTitle>Consolidações de Pedidos</CardTitle>
              <CardDescription>
                Acompanhe o status de confirmação de cada pedido por unidade
                educacional
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 mx-auto animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Data Pedido</TableHead>
                      <TableHead>Status Consolidação</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consolidacoesFiltradas.map((consolidacao) => (
                      <TableRow key={consolidacao.pedidoId}>
                        <TableCell>
                          <div>
                            <span className="font-mono text-sm">
                              {consolidacao.pedido.numero}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {consolidacao.totalUnidades} recibo(s) gerado(s)
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {consolidacao.pedido.contrato.fornecedor.nome}
                        </TableCell>
                        <TableCell>
                          {new Date(
                            consolidacao.pedido.dataPedido
                          ).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(consolidacao.statusConsolidacao)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span>
                                {consolidacao.unidadesConfirmadas}/
                                {consolidacao.totalUnidades} unidades
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={consolidacao.percentualConfirmacao}
                                className="w-20 h-2"
                              />
                              <span className="text-xs text-muted-foreground">
                                {consolidacao.percentualConfirmacao.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          R$ {consolidacao.pedido.valorTotal.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            Ver Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recibos">
          <Card>
            <CardHeader>
              <CardTitle>Recibos Individuais</CardTitle>
              <CardDescription>
                Análise detalhada das confirmações de recebimento por recibo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {confirmacoesFiltradas.length === 0 && !isLoading ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">
                    Nenhuma confirmação encontrada
                  </h3>
                  <p className="text-muted-foreground">
                    {busca
                      ? "Tente ajustar os filtros de busca"
                      : "As confirmações aparecerão aqui quando os recibos forem processados"}
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
                      <TableHead>Recibo</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Data Entrega</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Conformidade</TableHead>
                      <TableHead>Eficiência</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {confirmacoesFiltradas.map((confirmacao) => (
                      <TableRow key={confirmacao.id}>
                        <TableCell>
                          <div>
                            <span className="font-mono text-sm">
                              {confirmacao.numero}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Pedido: {confirmacao.pedido.numero}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span className="text-sm">
                              {confirmacao.unidadeEducacional.nome}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {confirmacao.pedido.contrato.fornecedor.nome}
                        </TableCell>
                        <TableCell>
                          {new Date(confirmacao.dataEntrega).toLocaleDateString(
                            "pt-BR"
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(confirmacao.status)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getConformidadeBadge(
                              confirmacao.percentualConformidade
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Progress
                                value={confirmacao.percentualConformidade}
                                className="w-16 h-1"
                              />
                              <span>
                                {confirmacao.percentualConformidade.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {confirmacao.eficienciaEntrega >= 100 ? (
                              <TrendingUp className="h-3 w-3 text-success" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-warning" />
                            )}
                            <span className="text-sm">
                              {confirmacao.eficienciaEntrega.toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {confirmacao.totalRecebido}/
                            {confirmacao.totalSolicitado}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              Detalhes
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
      </Tabs>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Importar useNavigate
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
  Building2,
  FileText,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Layers,
  Loader2,
  Printer,
  XCircle,
  Trophy,
  CheckCheck,
  PackageCheck,
} from "lucide-react";
import { ConsolidacaoPedido, Recibo } from "@/types";
import { ReciboDetailDialog } from "@/components/recibos/ReciboDetailDialog";

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
  const [buscaConsolidacao, setBuscaConsolidacao] = useState("");
  const [statusFilterConsolidacao, setStatusFilterConsolidacao] =
    useState<string>("todos");
  const [buscaRecibo, setBuscaRecibo] = useState("");
  const [statusFilterRecibo, setStatusFilterRecibo] = useState<string>("todos");
  const [activeTab, setActiveTab] = useState("consolidacoes");

  const [isLoading, setIsLoading] = useState(true);
  const [consolidacoes, setConsolidacoes] = useState<ConsolidacaoPedido[]>([]);
  const [confirmacoes, setConfirmacoes] = useState<ConfirmacaoDetalhada[]>([]);
  const [stats, setStats] = useState({
    totalRecibos: 0,
    recibosPendentes: 0,
    recibosConfirmados: 0,
    recibosParciais: 0,
    recibosAjustados: 0,
    recibosComplementares: 0,
    mediaConformidade: 0,
    pedidosCompletos: 0,
    pedidosParciais: 0,
    pedidosPendentes: 0,
    totalPedidos: 0,
    mediaConformidadePedidos: 0,
  });

  const navigate = useNavigate(); // Inicializa o hook de navegação

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:3001"
          }/api/confirmacoes`
        );
        if (!response.ok) throw new Error("Falha ao buscar dados.");
        const data: ConfirmacoesData = await response.json();
        setConsolidacoes(data.consolidacoes);
        setConfirmacoes(data.confirmacoesDetalhadas);

        // --- Cálculo das Estatísticas ---
        const totalRecibos = data.confirmacoesDetalhadas.length;
        const recibosPendentes = data.confirmacoesDetalhadas.filter(
          (c) => c.status === "pendente"
        ).length;
        const recibosConfirmados = data.confirmacoesDetalhadas.filter(
          (c) => c.status === "confirmado"
        ).length;
        const recibosParciais = data.confirmacoesDetalhadas.filter(
          (c) => c.status === "parcial"
        ).length;
        const recibosAjustados = data.confirmacoesDetalhadas.filter(
          (c) => c.status === "ajustado"
        ).length;
        const recibosComplementares = data.confirmacoesDetalhadas.filter(
          (c) => c.status === "complementar"
        ).length;
        const mediaConformidade =
          totalRecibos > 0
            ? data.confirmacoesDetalhadas.reduce(
                (sum, conf) => sum + conf.percentualConformidade,
                0
              ) / totalRecibos
            : 0;

        // ATUALIZAÇÃO: Cálculo das novas estatísticas de pedidos
        const totalPedidos = data.consolidacoes.length;
        const pedidosCompletos = data.consolidacoes.filter(
          (c) => c.statusConsolidacao === "completo"
        ).length;
        const pedidosParciais = data.consolidacoes.filter(
          (c) => c.statusConsolidacao === "parcial"
        ).length;
        const pedidosPendentes = data.consolidacoes.filter(
          (c) => c.statusConsolidacao === "pendente"
        ).length;

        const mediaConformidadePedidos =
          totalPedidos > 0
            ? ((pedidosCompletos + pedidosParciais / 2) / totalPedidos) * 100
            : 0;

        setStats({
          totalRecibos,
          recibosPendentes,
          recibosConfirmados,
          recibosParciais,
          recibosAjustados,
          recibosComplementares,
          mediaConformidade,
          pedidosCompletos,
          pedidosParciais,
          pedidosPendentes,
          totalPedidos,
          mediaConformidadePedidos,
        });
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // ATUALIZAÇÃO: Lógica de filtragem para RECIBOS usando seus próprios estados
  const confirmacoesFiltradas = confirmacoes.filter((c) => {
    const matchBusca =
      c.numero.toLowerCase().includes(buscaRecibo.toLowerCase()) ||
      c.pedido.numero.toLowerCase().includes(buscaRecibo.toLowerCase()) ||
      c.pedido.contrato.fornecedor.nome
        .toLowerCase()
        .includes(buscaRecibo.toLowerCase());
    const matchStatus =
      statusFilterRecibo === "todos" || c.status === statusFilterRecibo;
    return matchBusca && matchStatus;
  });

  // ATUALIZAÇÃO: Lógica de filtragem para CONSOLIDAÇÕES usando seus próprios estados
  const consolidacoesFiltradas = consolidacoes.filter((c) => {
    const matchBusca =
      c.pedido.numero.toLowerCase().includes(buscaConsolidacao.toLowerCase()) ||
      c.pedido.contrato.fornecedor.nome
        .toLowerCase()
        .includes(buscaConsolidacao.toLowerCase());
    const matchStatus =
      statusFilterConsolidacao === "todos" ||
      c.statusConsolidacao === statusFilterConsolidacao;
    return matchBusca && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: "secondary",
      confirmado: "default",
      parcial: "outline",
      rejeitado: "destructive",
      completo: "default",
      ajustado: "outline",
      complementar: "secondary",
    } as const;

    const labels = {
      pendente: "Pendente",
      confirmado: "Confirmado",
      parcial: "Parcial",
      rejeitado: "Rejeitado",
      completo: "Completo",
      ajustado: "Ajustado",
      complementar: "Complementar",
    };

    const icons = {
      pendente: <Clock className="h-3 w-3 mr-1" />,
      confirmado: <CheckCircle className="h-3 w-3 mr-1" />,
      parcial: <AlertTriangle className="h-3 w-3 mr-1" />,
      rejeitado: <XCircle className="h-3 w-3 mr-1" />,
      completo: <Trophy className="h-3 w-3 mr-1" />,
      ajustado: <CheckCheck className="h-3 w-3 mr-1" />,
      complementar: <PackageCheck className="h-3 w-3 mr-1" />,
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
        <Badge
          variant="default"
          className="bg-success text-success-foreground px-2"
        >
          Conforme
        </Badge>
      );
    } else if (percentual > 40 && percentual < 100) {
      return (
        <Badge variant="outline" className="px-2">
          Parc. Conforme
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="px-2">
          Não Conforme
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Confirmações de Recebimento
          </h2>
          <p className="text-muted-foreground">
            Acompanhe as confirmações de recebimento e conformidade das entregas
          </p>
        </div>
      </div>

      {/*Estatísticas para Pedidos */}
      {activeTab === "consolidacoes" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Pedidos
                  </p>
                  <p className="text-2xl font-bold">{stats.totalPedidos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Completos
                  </p>
                  <p className="text-2xl font-bold">{stats.pedidosCompletos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <CheckCheck className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Parciais
                  </p>
                  <p className="text-2xl font-bold">{stats.pedidosParciais}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <PackageCheck className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pendentes
                  </p>
                  <p className="text-2xl font-bold">{stats.pedidosPendentes}</p>
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
                    {stats.mediaConformidadePedidos.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Estatísticas para recibos*/}
      {activeTab === "recibos" && (
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
                  <p className="text-2xl font-bold">{stats.totalRecibos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Confirmados
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.recibosConfirmados}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCheck className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Ajustados
                  </p>
                  <p className="text-2xl font-bold">{stats.recibosAjustados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <PackageCheck className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Complementares
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.recibosComplementares}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Parciais
                  </p>
                  <p className="text-2xl font-bold">{stats.recibosParciais}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pendentes
                  </p>
                  <p className="text-2xl font-bold">{stats.recibosPendentes}</p>
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
      )}

      <Tabs defaultValue="consolidacoes" onValueChange={setActiveTab} className="space-y-4">
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

        <TabsContent value="consolidacoes" className="gap-4 flex flex-col">
          {/* Card de Consolidações de Pedidos */}
          <Card>
            <CardHeader>
              <CardTitle>Consulta de Pedidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros para Consolidações */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por número do pedido ou fornecedor..."
                    value={buscaConsolidacao}
                    onChange={(e) => setBuscaConsolidacao(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={
                      statusFilterConsolidacao === "todos"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setStatusFilterConsolidacao("todos")}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={
                      statusFilterConsolidacao === "completo"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setStatusFilterConsolidacao("completo")}
                  >
                    Completos
                  </Button>
                  <Button
                    variant={
                      statusFilterConsolidacao === "parcial"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setStatusFilterConsolidacao("parcial")}
                  >
                    Parciais
                  </Button>
                  <Button
                    variant={
                      statusFilterConsolidacao === "pendente"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setStatusFilterConsolidacao("pendente")}
                  >
                    Pendentes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Consolidações de Pedidos</CardTitle>
              <CardDescription>
                Acompanhe o status de confirmação de cada pedido por unidade
                educacional
              </CardDescription>
            </CardHeader>
            <CardContent>
              {consolidacoesFiltradas.length === 0 && !isLoading ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">
                    Nenhum pedido encontrado
                  </h3>
                  <p className="text-muted-foreground">
                    {buscaConsolidacao
                      ? "Tente ajustar os filtros de busca"
                      : "As confirmações aparecerão aqui quando os pedidos forem processados"}
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
                      <TableHead>Pedido</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Data Pedido</TableHead>
                      <TableHead>Status Consolidação</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
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
                                {consolidacao.totalUnidades} recibos
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
                        <TableCell className="text-center">
                          {/* Botão para imprimir todos os recibos do pedido */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/recibos/imprimir-pedido/${consolidacao.pedidoId}`
                              )
                            }
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Imprimir Recibos
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

        <TabsContent value="recibos" className="gap-4 flex flex-col">
          {/* Card de Recibos Individuais */}
          <Card>
            <CardHeader>
              <CardTitle>Consulta de Recibos Individuais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros para Recibos */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por número do recibo, pedido ou fornecedor..."
                    value={buscaRecibo}
                    onChange={(e) => setBuscaRecibo(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={
                      statusFilterRecibo === "todos" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setStatusFilterRecibo("todos")}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={
                      statusFilterRecibo === "confirmado"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setStatusFilterRecibo("confirmado")}
                  >
                    Confirmados
                  </Button>
                  <Button
                    variant={
                      statusFilterRecibo === "ajustado" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setStatusFilterRecibo("ajustado")}
                  >
                    Ajustados
                  </Button>
                  <Button
                    variant={
                      statusFilterRecibo === "complementar"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setStatusFilterRecibo("complementar")}
                  >
                    Complementares
                  </Button>
                  <Button
                    variant={
                      statusFilterRecibo === "parcial" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setStatusFilterRecibo("parcial")}
                  >
                    Parciais
                  </Button>
                  <Button
                    variant={
                      statusFilterRecibo === "pendente" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setStatusFilterRecibo("pendente")}
                  >
                    Pendentes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
                    {buscaRecibo
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
                      <TableHead className="text-center">Ações</TableHead>
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
                              confirmacao.eficienciaEntrega
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Progress
                                value={confirmacao.eficienciaEntrega}
                                className="w-16 h-1"
                              />
                              <span>
                                {confirmacao.eficienciaEntrega.toFixed(0)}%
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
                          <div className="flex justify-center gap-2">
                            <ReciboDetailDialog reciboId={confirmacao.id} />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(`/recibos/imprimir/${confirmacao.id}`)
                              }
                            >
                              <Printer className="h-3 w-3 mr-1" />
                              Imprimir Recibo
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

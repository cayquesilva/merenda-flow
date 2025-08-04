import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  FileText,
  Download,
  Calendar,
  Package,
  Building2,
  DollarSign,
  TrendingUp,
  BarChart3,
  Loader2, // Adicionado para o estado de carregamento
} from "lucide-react";
// Importar tipos necessários do seu arquivo de types
import {
  Contrato,
  Pedido,
  ItemContrato,
  UnidadeMedida,
  UnidadeEducacional,
  Fornecedor,
  ItemPedido,
} from "@/types"; // Adicionado ItemPedido aqui
import { useToast } from "../ui/use-toast";

// Interfaces para os dados retornados pela API
interface ItemContratoConsolidado extends ItemContrato {
  unidadeMedida: UnidadeMedida;
  quantidadePedida: number;
  valorConsumido: number;
  percentualConsumido: number;
  saldoRestante: number;
}

// Nova interface para ItemPedido com os includes detalhados que a API retorna
interface ItemPedidoConsolidadoDetalhado extends ItemPedido {
  itemContrato: ItemContrato & {
    // ItemContrato completo
    unidadeMedida: UnidadeMedida;
  };
  unidadeEducacional: UnidadeEducacional; // UnidadeEducacional completa
}

// PedidoConsolidado agora estende Pedido e usa a nova interface para 'itens'
interface PedidoConsolidado extends Pedido {
  itens: ItemPedidoConsolidadoDetalhado[];
}

interface ConsolidacaoData {
  contrato: Contrato & {
    // O contrato completo, como vem do backend
    fornecedor: Fornecedor;
    itens: ItemContrato[]; // Itens originais do contrato, não os consolidados
  };
  itensPorContrato: ItemContratoConsolidado[]; // Adicionado à raiz da interface
  pedidos: PedidoConsolidado[];
  totalPedidos: number;
  valorTotalPedidos: number;
  unidadesAtendidas: string[]; // Nomes das unidades
  pedidosPorStatus: {
    pendente: number;
    confirmado: number;
    entregue: number;
    cancelado: number;
  };
}

// Interface para a lista de contratos simplificada (para o Select)
interface ContratoLista {
  id: string;
  numero: string;
  fornecedor: {
    nome: string;
  };
}

export function RelatorioConsolidadoPedidos() {
  const [contratoSelecionado, setContratoSelecionado] = useState<string>("");
  const [contratosDisponiveis, setContratosDisponiveis] = useState<
    ContratoLista[]
  >([]);
  const [consolidacao, setConsolidacao] = useState<ConsolidacaoData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { toast } = useToast();

  // Efeito para buscar a lista de contratos disponíveis
  useEffect(() => {
    const fetchContratos = async () => {
      setIsLoading(true);
      try {
        // Busca todos os contratos para popular o Select
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:3001"
          }/api/contratos`
        );
        if (!response.ok) throw new Error("Falha ao buscar contratos.");
        const data: ContratoLista[] = await response.json();
        setContratosDisponiveis(data);
      } catch (error) {
        console.error("Erro ao carregar contratos:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de contratos.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchContratos();
  }, [toast]);

  // Efeito para buscar os dados consolidados quando um contrato é selecionado
  useEffect(() => {
    if (contratoSelecionado) {
      const fetchConsolidacao = async () => {
        setIsLoading(true);
        setConsolidacao(null); // Limpa dados anteriores
        try {
          const response = await fetch(
            `${
              import.meta.env.VITE_API_URL || "http://localhost:3001"
            }/api/relatorios/consolidado-pedidos-data/${contratoSelecionado}`
          );
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error || "Falha ao buscar dados consolidados."
            );
          }
          const data: ConsolidacaoData = await response.json();
          setConsolidacao(data);
        } catch (error) {
          console.error("Erro ao buscar consolidação:", error);
          toast({
            title: "Erro",
            description:
              "Não foi possível carregar os dados consolidados do contrato.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchConsolidacao();
    } else {
      setConsolidacao(null); // Limpa a consolidação se nenhum contrato for selecionado
    }
  }, [contratoSelecionado, toast]);

  const gerarRelatorio = async () => {
    if (!consolidacao || !contratoSelecionado) return;

    setIsGeneratingPdf(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/relatorios/consolidado-pedidos-pdf/${contratoSelecionado}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Envia o reportData para o backend
            reportData: consolidacao,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao gerar relatório");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-consolidado-${consolidacao.contrato.numero}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Relatório gerado!",
        description: "O relatório consolidado foi gerado com sucesso.",
      });
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
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatório Consolidado de Pedidos
          </CardTitle>
          <CardDescription>
            Visualize o consolidado de todos os pedidos realizados por contrato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select
                value={contratoSelecionado}
                onValueChange={setContratoSelecionado}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um contrato" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                      Carregando contratos...
                    </SelectItem>
                  ) : (
                    contratosDisponiveis.map((contrato) => (
                      <SelectItem key={contrato.id} value={contrato.id}>
                        {contrato.numero} - {contrato.fornecedor.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {consolidacao && (
              <Button onClick={gerarRelatorio} disabled={isGeneratingPdf}>
                {isGeneratingPdf ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Exportar PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading && !consolidacao ? (
        <div className="text-center py-8">
          <Loader2 className="h-12 w-12 mx-auto animate-spin" />
          <p className="text-muted-foreground mt-2">
            Carregando dados do relatório...
          </p>
        </div>
      ) : consolidacao ? (
        <>
          {/* Resumo Geral */}
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
                    <p className="text-2xl font-bold">
                      {consolidacao.totalPedidos}
                    </p>
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
                    <p className="text-sm font-medium text-muted-foreground">
                      Valor Total Pedidos
                    </p>
                    <p className="text-2xl font-bold">
                      R$ {consolidacao.valorTotalPedidos.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Unidades Atendidas
                    </p>
                    <p className="text-2xl font-bold">
                      {consolidacao.unidadesAtendidas.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      % Contrato Utilizado
                    </p>
                    <p className="text-2xl font-bold">
                      {(
                        (consolidacao.valorTotalPedidos /
                          consolidacao.contrato.valorTotal) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status dos Pedidos */}
          <Card>
            <CardHeader>
              <CardTitle>Status dos Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">
                    {consolidacao.pedidosPorStatus.pendente}
                  </p>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {consolidacao.pedidosPorStatus.confirmado}
                  </p>
                  <p className="text-sm text-muted-foreground">Confirmados</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">
                    {consolidacao.pedidosPorStatus.entregue}
                  </p>
                  <p className="text-sm text-muted-foreground">Entregues</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">
                    {consolidacao.pedidosPorStatus.cancelado}
                  </p>
                  <p className="text-sm text-muted-foreground">Cancelados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consolidação por Item */}
          <Card>
            <CardHeader>
              <CardTitle>Consolidação por Item do Contrato</CardTitle>
              <CardDescription>
                Análise detalhada do consumo de cada item
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qtd. Original</TableHead>
                    <TableHead>Qtd. Pedida</TableHead>
                    <TableHead>Saldo Restante</TableHead>
                    <TableHead>% Consumido</TableHead>
                    <TableHead>Valor Consumido</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consolidacao.itensPorContrato.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{item.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            R$ {item.valorUnitario.toFixed(2)} /{" "}
                            {item.unidadeMedida.sigla}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.quantidadeOriginal} {item.unidadeMedida.sigla}
                      </TableCell>
                      <TableCell>
                        {item.quantidadePedida} {item.unidadeMedida.sigla}
                      </TableCell>
                      <TableCell>
                        {item.saldoRestante} {item.unidadeMedida.sigla}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{item.percentualConsumido.toFixed(1)}%</span>
                          <div className="w-16 h-2 bg-primary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${Math.min(
                                  item.percentualConsumido,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {item.valorConsumido.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {item.percentualConsumido >= 90 ? (
                          <Badge variant="destructive">Crítico</Badge>
                        ) : item.percentualConsumido >= 70 ? (
                          <Badge variant="outline">Atenção</Badge>
                        ) : (
                          <Badge variant="default">Normal</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Lista de Pedidos */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Itens</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consolidacao.pedidos.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell className="font-mono">
                        {pedido.numero}
                      </TableCell>
                      <TableCell>
                        {new Date(pedido.dataPedido).toLocaleDateString(
                          "pt-BR"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            pedido.status === "entregue"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {pedido.status}
                        </Badge>
                      </TableCell>
                      <TableCell>R$ {pedido.valorTotal.toFixed(2)}</TableCell>
                      <TableCell>{pedido.itens.length} itens</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Selecione um contrato para visualizar o relatório consolidado de
          pedidos.
        </div>
      )}
    </div>
  );
}

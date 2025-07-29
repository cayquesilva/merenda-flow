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
  Package,
  Download,
  Calendar,
  Building2,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  Filter,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Importando as interfaces completas do seu arquivo de tipos, conforme fornecido anteriormente
import {
  Recibo,
  UnidadeEducacional,
  Pedido,
  Contrato,
  Fornecedor,
  ItemRecibo,
  ItemPedido,
  ItemContrato,
  UnidadeMedida,
} from "@/types";

// Interface para um recibo específico no relatório de entregas
// Esta interface reflete o `include` da rota /api/relatorios/entregas no backend
interface ReciboRelatorioEntregas
  extends Omit<Recibo, "pedido" | "unidadeEducacional" | "itens"> {
  // Sobrescrevendo com as estruturas que vêm com o include
  unidadeEducacional: UnidadeEducacional;
  pedido: Pedido & {
    // O pedido completo, e se houver mais includes específicos aqui, adicione-os
    contrato: Contrato & {
      fornecedor: Fornecedor;
    };
  };
  itens: (ItemRecibo & {
    // Itens do recibo, e se houver mais includes específicos aqui
    itemPedido: ItemPedido & {
      itemContrato: ItemContrato & {
        unidadeMedida: UnidadeMedida;
      };
    };
  })[];
}

interface RelatorioEntregasData {
  recibos: ReciboRelatorioEntregas[]; // Tipagem ajustada aqui
  estatisticas: {
    totalEntregas: number;
    entregasConfirmadas: number;
    entregasPendentes: number;
    valorTotalEntregue: number;
  };
}

// A interface UnidadeEducacional já está definida no seu arquivo de tipos e é usada aqui
// interface UnidadeEducacional {
//   id: string;
//   nome: string;
//   codigo: string;
// }

export function RelatorioEntregas() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  // Alterado o valor inicial para 'all' para corresponder ao SelectItem
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("all");
  const [dados, setDados] = useState<RelatorioEntregasData | null>(null);
  const [unidades, setUnidades] = useState<UnidadeEducacional[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUnidades = async () => {
      try {
        const response = await fetch(
          "http://localhost:3001/api/unidades-ativas"
        );
        if (response.ok) {
          const data: UnidadeEducacional[] = await response.json(); // Tipagem aqui
          setUnidades(data);
        } else {
          const errorData = await response.json();
          console.error(
            "Erro ao buscar unidades:",
            errorData.error || "Falha ao buscar unidades."
          );
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
        // Alterada a condição para incluir unidadeId apenas se não for 'all'
        ...(unidadeSelecionada !== "all" && { unidadeId: unidadeSelecionada }),
      });

      const response = await fetch(
        `http://localhost:3001/api/relatorios/entregas?${params}`
      );
      if (response.ok) {
        const data: RelatorioEntregasData = await response.json(); // Tipagem aqui
        setDados(data);
        toast({
          title: "Relatório gerado!",
          description: "Relatório de entregas gerado com sucesso",
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

  const getStatusBadge = (status: ReciboRelatorioEntregas["status"]) => {
    const variants = {
      pendente: "secondary",
      confirmado: "default",
      parcial: "outline",
      rejeitado: "destructive",
    } as const;

    const labels = {
      pendente: "Pendente",
      confirmado: "Confirmado",
      parcial: "Parcial",
      rejeitado: "Rejeitado",
    };

    const icons = {
      pendente: <Clock className="h-3 w-3 mr-1" />,
      confirmado: <CheckCircle className="h-3 w-3 mr-1" />,
      parcial: <TrendingUp className="h-3 w-3 mr-1" />, // Usando TrendingUp para parcial
      rejeitado: <AlertTriangle className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {icons[status] || null}
        {labels[status] || status}
      </Badge>
    );
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
              <Select
                value={unidadeSelecionada}
                onValueChange={setUnidadeSelecionada}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as unidades" />
                </SelectTrigger>
                <SelectContent>
                  {/* Alterado o valor de "" para "all" */}
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
                      Total Entregas
                    </p>
                    <p className="text-2xl font-bold">
                      {dados.estatisticas.totalEntregas}
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
                      Confirmadas
                    </p>
                    <p className="text-2xl font-bold">
                      {dados.estatisticas.entregasConfirmadas}
                    </p>
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
                    <p className="text-2xl font-bold">
                      {dados.estatisticas.entregasPendentes}
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
                      Valor Entregue
                    </p>
                    <p className="text-2xl font-bold">
                      R$ {dados.estatisticas.valorTotalEntregue.toFixed(2)}
                    </p>
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
                      <TableCell className="font-mono">
                        {recibo.numero}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {recibo.unidadeEducacional.nome}
                        </div>
                      </TableCell>
                      <TableCell>
                        {recibo.pedido.contrato.fornecedor.nome}
                      </TableCell>
                      <TableCell>
                        {new Date(recibo.dataEntrega).toLocaleDateString(
                          "pt-BR"
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(recibo.status)}</TableCell>
                      <TableCell>
                        {recibo.responsavelRecebimento ||
                          recibo.responsavelEntrega}
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

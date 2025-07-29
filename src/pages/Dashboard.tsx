import { useEffect, useState } from "react";
import { MetricCard } from "@/components/ui/metric-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Users,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Calendar,
  DollarSign,
  Loader2, // Adicionado para o estado de carregamento
} from "lucide-react";

// Importando as interfaces dos seus tipos para tipagem precisa
import { Contrato, Fornecedor, ItemContrato, UnidadeMedida } from "@/types";
import { Button } from "@/components/ui/button";

// Definindo as interfaces para os dados que vêm do backend
interface DashboardMetrics {
  totalContratos: number;
  contratosAtivos: number;
  totalFornecedores: number;
  totalPedidos: number;
  valorTotalContratos: number;
  consolidacoesPendentes: number;
  eficienciaEntrega: number;
}

interface ItemComSaldoBaixo extends ItemContrato {
  unidadeMedida: UnidadeMedida; // Incluindo a unidade de medida para exibição
}

// Corrigido: Usando Omit para sobrescrever a propriedade 'fornecedor'
interface ContratoVencendo extends Omit<Contrato, "fornecedor"> {
  fornecedor: { nome: string }; // Apenas o nome do fornecedor é necessário aqui
}

// Corrigido: Usando Omit para sobrescrever a propriedade 'fornecedor'
interface ContratoRecente extends Omit<Contrato, "fornecedor"> {
  fornecedor: { nome: string };
  _count: { itens: number }; // Contagem de itens para exibir
}

interface DashboardData {
  metrics: DashboardMetrics;
  alerts: {
    itensComSaldoBaixo: ItemComSaldoBaixo[];
    contratosVencendo: ContratoVencendo[];
  };
  recentContracts: ContratoRecente[];
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          "http://localhost:3001/api/dashboard-data"
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Falha ao carregar dados do dashboard."
          );
        }
        const data: DashboardData = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Ocorreu um erro ao carregar o dashboard."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 text-center p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h3 className="text-xl font-semibold">Erro ao Carregar Dashboard</h3>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Tentar Novamente
        </Button>
      </div>
    );
  }

  if (!dashboardData) {
    return null; // Ou um estado vazio / placeholder
  }

  const { metrics, alerts, recentContracts } = dashboardData;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral do sistema de gestão de contratos de merenda
        </p>
      </div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Contratos Ativos"
          value={metrics.contratosAtivos}
          description={`${metrics.totalContratos} contratos no total`}
          icon={FileText}
          variant="success"
        />

        <MetricCard
          title="Fornecedores Ativos"
          value={metrics.totalFornecedores}
          description="Fornecedores cadastrados"
          icon={Users}
        />

        <MetricCard
          title="Pedidos Total" // Alterado para "Total Pedidos" pois não filtramos por mês no backend ainda
          value={metrics.totalPedidos}
          description="Pedidos processados"
          icon={ShoppingCart}
          // trend={{ value: 12, label: "vs mês anterior" }} // Removido, pois não temos essa métrica ainda
        />

        <MetricCard
          title="Valor Total Contratos"
          value={`R$ ${metrics.valorTotalContratos.toLocaleString("pt-BR")}`}
          description="Contratos ativos"
          icon={DollarSign}
          variant="success"
        />

        <MetricCard
          title="Recibos Pendentes" // Alterado para refletir o nome da métrica
          value={metrics.consolidacoesPendentes}
          description="Recibos aguardando confirmação"
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      {/* Alertas e Informações Importantes */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Itens com Saldo Baixo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Itens com Saldo Baixo
            </CardTitle>
            <CardDescription>
              Itens com menos de 20% do saldo original
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.itensComSaldoBaixo.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum item com saldo baixo
              </p>
            ) : (
              <div className="space-y-3">
                {alerts.itensComSaldoBaixo.map((item) => {
                  const percentual =
                    (item.saldoAtual / item.quantidadeOriginal) * 100;
                  return (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.nome}</span>
                        <Badge
                          variant="outline"
                          className="text-warning border-warning"
                        >
                          {percentual.toFixed(0)}%
                        </Badge>
                      </div>
                      <Progress value={percentual} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {item.saldoAtual} de {item.quantidadeOriginal}{" "}
                        {item.unidadeMedida.sigla}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contratos Próximos do Vencimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-warning" />
              Contratos Vencendo
            </CardTitle>
            <CardDescription>
              Contratos que vencem nos próximos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.contratosVencendo.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum contrato vencendo em breve
              </p>
            ) : (
              <div className="space-y-3">
                {alerts.contratosVencendo.map((contrato) => {
                  const dataFim = new Date(contrato.dataFim);
                  const hoje = new Date();
                  const diffDays = Math.ceil(
                    (dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={contrato.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{contrato.numero}</p>
                        <p className="text-xs text-muted-foreground">
                          {contrato.fornecedor.nome}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-warning border-warning"
                      >
                        {diffDays} dias
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contratos Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Contratos Recentes
          </CardTitle>
          <CardDescription>
            Últimos contratos cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentContracts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum contrato recente encontrado.
              </p>
            ) : (
              recentContracts.map((contrato) => (
                <div
                  key={contrato.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{contrato.numero}</p>
                    <p className="text-xs text-muted-foreground">
                      {contrato.fornecedor.nome} • {contrato._count.itens} itens
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      R$ {contrato.valorTotal.toLocaleString("pt-BR")}
                    </p>
                    <Badge
                      variant={
                        contrato.status === "ativo" ? "default" : "secondary"
                      }
                    >
                      {contrato.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Users, 
  ShoppingCart, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  DollarSign
} from "lucide-react";
import { contratos, pedidos, fornecedores } from "@/data/mockData";

export default function Dashboard() {
  // Cálculos das métricas
  const totalContratos = contratos.length;
  const contratosAtivos = contratos.filter(c => c.status === 'ativo').length;
  const totalFornecedores = fornecedores.filter(f => f.ativo).length;
  const totalPedidos = pedidos.length;
  
  const valorTotalContratos = contratos
    .filter(c => c.status === 'ativo')
    .reduce((sum, c) => sum + c.valorTotal, 0);

  // Itens com saldo baixo (menos de 20% do original)
  const itensComSaldoBaixo = contratos
    .flatMap(c => c.itens)
    .filter(item => (item.saldoAtual / item.quantidadeOriginal) < 0.2);

  // Contratos próximos do vencimento (30 dias)
  const contratosVencendo = contratos.filter(c => {
    const dataFim = new Date(c.dataFim);
    const hoje = new Date();
    const diffTime = dataFim.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard teste</h2>
        <p className="text-muted-foreground">
          Visão geral do sistema de gestão de contratos de merenda
        </p>
      </div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Contratos Ativos"
          value={contratosAtivos}
          description={`${totalContratos} contratos no total`}
          icon={FileText}
          variant="success"
        />
        
        <MetricCard
          title="Fornecedores Ativos"
          value={totalFornecedores}
          description="Fornecedores cadastrados"
          icon={Users}
        />
        
        <MetricCard
          title="Pedidos Este Mês"
          value={totalPedidos}
          description="Pedidos processados"
          icon={ShoppingCart}
          trend={{ value: 12, label: "vs mês anterior" }}
        />
        
        <MetricCard
          title="Valor Total Contratos"
          value={`R$ ${valorTotalContratos.toLocaleString('pt-BR')}`}
          description="Contratos ativos"
          icon={DollarSign}
          variant="success"
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
            {itensComSaldoBaixo.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum item com saldo baixo
              </p>
            ) : (
              <div className="space-y-3">
                {itensComSaldoBaixo.slice(0, 3).map((item) => {
                  const percentual = (item.saldoAtual / item.quantidadeOriginal) * 100;
                  return (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.nome}</span>
                        <Badge variant="outline" className="text-warning border-warning">
                          {percentual.toFixed(0)}%
                        </Badge>
                      </div>
                      <Progress value={percentual} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {item.saldoAtual} de {item.quantidadeOriginal} {item.unidadeMedida.sigla}
                      </p>
                    </div>
                  );
                })}
                {itensComSaldoBaixo.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{itensComSaldoBaixo.length - 3} itens com saldo baixo
                  </p>
                )}
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
            {contratosVencendo.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum contrato vencendo em breve
              </p>
            ) : (
              <div className="space-y-3">
                {contratosVencendo.map((contrato) => {
                  const dataFim = new Date(contrato.dataFim);
                  const hoje = new Date();
                  const diffDays = Math.ceil((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={contrato.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{contrato.numero}</p>
                        <p className="text-xs text-muted-foreground">
                          {contrato.fornecedor.nome}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-warning border-warning">
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
            {contratos.slice(0, 5).map((contrato) => (
              <div key={contrato.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{contrato.numero}</p>
                  <p className="text-xs text-muted-foreground">
                    {contrato.fornecedor.nome} • {contrato.itens.length} itens
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    R$ {contrato.valorTotal.toLocaleString('pt-BR')}
                  </p>
                  <Badge 
                    variant={contrato.status === 'ativo' ? 'default' : 'secondary'}
                  >
                    {contrato.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
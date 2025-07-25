import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
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
  BarChart3
} from "lucide-react";
import { recibos } from "@/data/mockData";

export default function Confirmacoes() {
  const [busca, setBusca] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const confirmacoesDetalhadas = recibos.map(recibo => {
    const itensConformes = recibo.itens.filter(item => item.conforme).length;
    const totalItens = recibo.itens.length;
    const percentualConformidade = totalItens > 0 ? (itensConformes / totalItens) * 100 : 0;
    
    const totalSolicitado = recibo.itens.reduce((sum, item) => sum + item.quantidadeSolicitada, 0);
    const totalRecebido = recibo.itens.reduce((sum, item) => sum + (item.quantidadeRecebida || 0), 0);
    const eficienciaEntrega = totalSolicitado > 0 ? (totalRecebido / totalSolicitado) * 100 : 0;

    return {
      ...recibo,
      itensConformes,
      totalItens,
      percentualConformidade,
      totalSolicitado,
      totalRecebido,
      eficienciaEntrega,
      unidadesPrincipais: [...new Set(recibo.pedido.itens.map(item => item.unidadeEducacional.nome))].slice(0, 2)
    };
  });

  const confirmacoesFiltradas = confirmacoesDetalhadas.filter(confirmacao => {
    const matchBusca = confirmacao.numero.toLowerCase().includes(busca.toLowerCase()) ||
                      confirmacao.pedido.numero.toLowerCase().includes(busca.toLowerCase()) ||
                      confirmacao.pedido.contrato.fornecedor.nome.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = statusFilter === "todos" || confirmacao.status === statusFilter;
    return matchBusca && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: "secondary",
      confirmado: "default",
      parcial: "outline", 
      rejeitado: "destructive"
    } as const;
    
    const labels = {
      pendente: "Pendente",
      confirmado: "Confirmado",
      parcial: "Parcial",
      rejeitado: "Rejeitado"
    };

    const icons = {
      pendente: <Clock className="h-3 w-3 mr-1" />,
      confirmado: <CheckCircle className="h-3 w-3 mr-1" />,
      parcial: <AlertTriangle className="h-3 w-3 mr-1" />,
      rejeitado: <AlertTriangle className="h-3 w-3 mr-1" />
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
      return <Badge variant="default" className="bg-success text-success-foreground">100% Conforme</Badge>;
    } else if (percentual >= 80) {
      return <Badge variant="outline">Parcialmente Conforme</Badge>;
    } else {
      return <Badge variant="destructive">Não Conforme</Badge>;
    }
  };

  // Estatísticas
  const totalConfirmacoes = recibos.length;
  const pendentes = recibos.filter(r => r.status === 'pendente').length;
  const conformes = recibos.filter(r => r.status === 'confirmado').length;
  const parciais = recibos.filter(r => r.status === 'parcial').length;

  const mediaConformidade = confirmacoesDetalhadas.length > 0 
    ? confirmacoesDetalhadas.reduce((sum, conf) => sum + conf.percentualConformidade, 0) / confirmacoesDetalhadas.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Confirmações de Recebimento</h2>
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
                <p className="text-sm font-medium text-muted-foreground">Total Recibos</p>
                <p className="text-2xl font-bold">{totalConfirmacoes}</p>
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
                <p className="text-2xl font-bold">{pendentes}</p>
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
                <p className="text-2xl font-bold">{conformes}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Conformidade Média</p>
                <p className="text-2xl font-bold">{mediaConformidade.toFixed(1)}%</p>
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

      {/* Lista de Confirmações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Confirmações</CardTitle>
          <CardDescription>
            Análise detalhada das confirmações de recebimento e conformidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          {confirmacoesFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhuma confirmação encontrada</h3>
              <p className="text-muted-foreground">
                {busca ? "Tente ajustar os filtros de busca" : "As confirmações aparecerão aqui quando os recibos forem processados"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recibo</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data Entrega</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Conformidade</TableHead>
                  <TableHead>Eficiência</TableHead>
                  <TableHead>Unidades</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmacoesFiltradas.map((confirmacao) => (
                  <TableRow key={confirmacao.id}>
                    <TableCell>
                      <div>
                        <span className="font-mono text-sm">{confirmacao.numero}</span>
                        <p className="text-xs text-muted-foreground">
                          Pedido: {confirmacao.pedido.numero}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{confirmacao.pedido.contrato.fornecedor.nome}</TableCell>
                    <TableCell>
                      {new Date(confirmacao.dataEntrega).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{getStatusBadge(confirmacao.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getConformidadeBadge(confirmacao.percentualConformidade)}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Progress value={confirmacao.percentualConformidade} className="w-16 h-1" />
                          <span>{confirmacao.percentualConformidade.toFixed(0)}%</span>
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
                        {confirmacao.totalRecebido}/{confirmacao.totalSolicitado}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {confirmacao.unidadesPrincipais.map((unidade, index) => (
                          <div key={index} className="flex items-center gap-1 text-xs">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate max-w-24">{unidade}</span>
                          </div>
                        ))}
                        {confirmacao.unidadesPrincipais.length > 2 && (
                          <span className="text-xs text-muted-foreground">+mais...</span>
                        )}
                      </div>
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
    </div>
  );
}
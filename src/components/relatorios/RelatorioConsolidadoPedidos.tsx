import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Download, 
  Calendar,
  Package,
  Building2,
  DollarSign,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { contratos, pedidos } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

export function RelatorioConsolidadoPedidos() {
  const [contratoSelecionado, setContratoSelecionado] = useState<string>("");
  const { toast } = useToast();

  const contrato = contratos.find(c => c.id === contratoSelecionado);
  const pedidosDoContrato = pedidos.filter(p => p.contratoId === contratoSelecionado);

  // Consolidação dos dados
  const consolidacao = contrato ? {
    totalPedidos: pedidosDoContrato.length,
    valorTotalPedidos: pedidosDoContrato.reduce((sum, p) => sum + p.valorTotal, 0),
    itensPorContrato: contrato.itens.map(itemContrato => {
      const quantidadePedida = pedidosDoContrato
        .flatMap(p => p.itens)
        .filter(item => item.itemContratoId === itemContrato.id)
        .reduce((sum, item) => sum + item.quantidade, 0);
      
      const valorConsumido = quantidadePedida * itemContrato.valorUnitario;
      const percentualConsumido = (quantidadePedida / itemContrato.quantidadeOriginal) * 100;
      
      return {
        ...itemContrato,
        quantidadePedida,
        valorConsumido,
        percentualConsumido,
        saldoRestante: itemContrato.quantidadeOriginal - quantidadePedida
      };
    }),
    unidadesAtendidas: [...new Set(pedidosDoContrato.flatMap(p => p.itens.map(i => i.unidadeEducacional.nome)))],
    pedidosPorStatus: {
      pendente: pedidosDoContrato.filter(p => p.status === 'pendente').length,
      confirmado: pedidosDoContrato.filter(p => p.status === 'confirmado').length,
      entregue: pedidosDoContrato.filter(p => p.status === 'entregue').length,
      cancelado: pedidosDoContrato.filter(p => p.status === 'cancelado').length,
    }
  } : null;

  const gerarRelatorio = () => {
    if (!consolidacao) return;

    toast({
      title: "Relatório gerado!",
      description: "O relatório consolidado foi gerado com sucesso",
    });
  };

  return (
    <div className="space-y-6">
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
              <Select value={contratoSelecionado} onValueChange={setContratoSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um contrato" />
                </SelectTrigger>
                <SelectContent>
                  {contratos.map(contrato => (
                    <SelectItem key={contrato.id} value={contrato.id}>
                      {contrato.numero} - {contrato.fornecedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {consolidacao && (
              <Button onClick={gerarRelatorio}>
                <Download className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {consolidacao && (
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
                    <p className="text-sm font-medium text-muted-foreground">Total de Pedidos</p>
                    <p className="text-2xl font-bold">{consolidacao.totalPedidos}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Valor Total Pedidos</p>
                    <p className="text-2xl font-bold">R$ {consolidacao.valorTotalPedidos.toFixed(2)}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Unidades Atendidas</p>
                    <p className="text-2xl font-bold">{consolidacao.unidadesAtendidas.length}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">% Contrato Utilizado</p>
                    <p className="text-2xl font-bold">
                      {((consolidacao.valorTotalPedidos / contrato!.valorTotal) * 100).toFixed(1)}%
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
                  <p className="text-2xl font-bold text-warning">{consolidacao.pedidosPorStatus.pendente}</p>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{consolidacao.pedidosPorStatus.confirmado}</p>
                  <p className="text-sm text-muted-foreground">Confirmados</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{consolidacao.pedidosPorStatus.entregue}</p>
                  <p className="text-sm text-muted-foreground">Entregues</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">{consolidacao.pedidosPorStatus.cancelado}</p>
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
                            R$ {item.valorUnitario.toFixed(2)} / {item.unidadeMedida.sigla}
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
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${Math.min(item.percentualConsumido, 100)}%` }}
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
                  {pedidosDoContrato.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell className="font-mono">{pedido.numero}</TableCell>
                      <TableCell>
                        {new Date(pedido.dataPedido).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={pedido.status === 'entregue' ? 'default' : 'secondary'}>
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
      )}
    </div>
  );
}
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Clock,
  AlertTriangle,
  Building2,
  Package,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { ConsolidacaoPedido } from "@/types";

interface ConsolidacaoDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consolidacao: ConsolidacaoPedido | null;
}

export function ConsolidacaoDetailDialog({
  open,
  onOpenChange,
  consolidacao,
}: ConsolidacaoDetailDialogProps) {
  if (!consolidacao) return null;

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: "secondary",
      confirmado: "default",
      parcial: "outline",
      completo: "default",
    } as const;

    const labels = {
      pendente: "Pendente",
      confirmado: "Confirmado",
      parcial: "Parcial",
      completo: "Completo",
    };

    const icons = {
      pendente: <Clock className="h-3 w-3 mr-1" />,
      confirmado: <CheckCircle className="h-3 w-3 mr-1" />,
      parcial: <AlertTriangle className="h-3 w-3 mr-1" />,
      completo: <CheckCircle className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-popover-foreground">
            Detalhes da Consolidação - Pedido {consolidacao.pedido.numero}
          </DialogTitle>
          <DialogDescription>
            Análise detalhada das confirmações de recebimento por unidade
            educacional
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Status
                    </p>
                    {getStatusBadge(consolidacao.statusConsolidacao)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Unidades
                    </p>
                    <p className="text-2xl font-bold">
                      {consolidacao.unidadesConfirmadas}/
                      {consolidacao.totalUnidades}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {consolidacao.percentualConfirmacao >= 80 ? (
                      <TrendingUp className="h-6 w-6 text-success" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-warning" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Progresso
                    </p>
                    <p className="text-2xl font-bold">
                      {consolidacao.percentualConfirmacao.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Barra de Progresso */}
          <Card>
            <CardHeader>
              <CardTitle>Progresso das Confirmações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Confirmações por Unidade</span>
                  <span>
                    {consolidacao.unidadesConfirmadas} de{" "}
                    {consolidacao.totalUnidades}
                  </span>
                </div>
                <Progress
                  value={consolidacao.percentualConfirmacao}
                  className="h-3"
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Número do Pedido
                  </p>
                  <p className="font-mono">{consolidacao.pedido.numero}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Fornecedor
                  </p>
                  <p>{consolidacao.pedido.contrato.fornecedor.nome}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Data do Pedido
                  </p>
                  <p>
                    {new Date(
                      consolidacao.pedido.dataPedido
                    ).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Valor Total
                  </p>
                  <p className="font-semibold">
                    R$ {consolidacao.pedido.valorTotal.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhes dos Recibos */}
          <Card>
            <CardHeader>
              <CardTitle>Status dos Recibos por Unidade</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Data Entrega</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: consolidacao.totalUnidades }).map(
                    (_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>Unidade Educacional {index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(
                            index < consolidacao.unidadesConfirmadas
                              ? "confirmado"
                              : "pendente"
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            Itens do pedido
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(
                            consolidacao.pedido.dataEntregaPrevista
                          ).toLocaleDateString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
  QrCode,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import { Recibo } from "@/types";

interface ConfirmacaoDetalhada extends Recibo {
  percentualConformidade: number;
  eficienciaEntrega: number;
  totalRecebido: number;
  totalSolicitado: number;
}

interface ReciboConfirmacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recibo: ConfirmacaoDetalhada | null;
}

export function ReciboConfirmacaoDialog({
  open,
  onOpenChange,
  recibo,
}: ReciboConfirmacaoDialogProps) {
  if (!recibo) return null;

  const getStatusBadge = (status: string) => {
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
      parcial: <AlertTriangle className="h-3 w-3 mr-1" />,
      rejeitado: <AlertTriangle className="h-3 w-3 mr-1" />,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-popover-foreground">
            Detalhes da Confirmação - Recibo {recibo.numero}
          </DialogTitle>
          <DialogDescription>
            Análise detalhada da confirmação de recebimento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Status
                    </p>
                    {getStatusBadge(recibo.status)}
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
                      Conformidade
                    </p>
                    <p className="text-2xl font-bold">
                      {recibo.percentualConformidade}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Eficiência
                    </p>
                    <p className="text-2xl font-bold">
                      {recibo.eficienciaEntrega.toFixed(1)}%
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
                      Itens
                    </p>
                    <p className="text-2xl font-bold">
                      {recibo.totalRecebido}/{recibo.totalSolicitado}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conformidade */}
          <Card>
            <CardHeader>
              <CardTitle>Análise de Conformidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Percentual de Conformidade</span>
                  {getConformidadeBadge(recibo.percentualConformidade)}
                </div>
                <Progress
                  value={recibo.percentualConformidade}
                  className="h-3"
                />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Total Solicitado:
                    </span>
                    <span className="ml-2 font-medium">
                      {recibo.totalSolicitado}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Total Recebido:
                    </span>
                    <span className="ml-2 font-medium">
                      {recibo.totalRecebido}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Recibo */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Recibo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Número do Recibo
                  </p>
                  <p className="font-mono">{recibo.numero}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pedido
                  </p>
                  <p className="font-mono">{recibo.pedido.numero}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Unidade Educacional
                  </p>
                  <p>{recibo.unidadeEducacional.nome}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Fornecedor
                  </p>
                  <p>{recibo.pedido.contrato.fornecedor.nome}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Data de Entrega
                  </p>
                  <p>
                    {new Date(recibo.dataEntrega).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Responsável Entrega
                  </p>
                  <p>{recibo.responsavelEntrega}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Responsável Recebimento
                  </p>
                  <p>{recibo.responsavelRecebimento || "Não confirmado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    QR Code
                  </p>
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    <span className="text-sm">Disponível</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhes dos Itens */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes dos Itens</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qtd. Solicitada</TableHead>
                    <TableHead>Qtd. Recebida</TableHead>
                    <TableHead>Conforme</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recibo.itens.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {item.itemPedido.itemContrato.nome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.itemPedido.itemContrato.unidadeMedida.sigla}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{item.quantidadeSolicitada}</TableCell>
                      <TableCell>{item.quantidadeRecebida}</TableCell>
                      <TableCell>
                        {item.conforme ? (
                          <Badge
                            variant="default"
                            className="bg-success text-success-foreground"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sim
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Não
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {item.observacoes || "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Observações */}
          {recibo.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{recibo.observacoes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

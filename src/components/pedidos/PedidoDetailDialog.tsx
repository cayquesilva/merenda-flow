import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Package, Building2, Calendar, DollarSign, User, FileText } from "lucide-react";
import { Pedido } from "@/types";

interface PedidoDetailDialogProps {
  pedido: Pedido;
}

export function PedidoDetailDialog({ pedido }: PedidoDetailDialogProps) {
  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: "secondary",
      confirmado: "default", 
      entregue: "default",
      cancelado: "destructive"
    } as const;
    
    const labels = {
      pendente: "Pendente",
      confirmado: "Confirmado",
      entregue: "Entregue", 
      cancelado: "Cancelado"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-3 w-3 mr-1" />
          Ver
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes do Pedido {pedido.numero}
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações do pedido
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações gerais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-4 w-4" />
                  Informações do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Número:</span>
                  <span className="font-mono">{pedido.numero}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  {getStatusBadge(pedido.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data do Pedido:</span>
                  <span>{new Date(pedido.dataPedido).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entrega Prevista:</span>
                  <span>{new Date(pedido.dataEntregaPrevista).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground font-medium">Valor Total:</span>
                  <span className="font-bold text-lg">R$ {pedido.valorTotal.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-4 w-4" />
                  Contrato e Fornecedor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contrato:</span>
                  <span className="font-mono">{pedido.contrato.numero}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fornecedor:</span>
                  <span className="font-medium">{pedido.contrato.fornecedor.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CNPJ:</span>
                  <span className="font-mono text-sm">{pedido.contrato.fornecedor.cnpj}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefone:</span>
                  <span>{pedido.contrato.fornecedor.telefone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-sm">{pedido.contrato.fornecedor.email}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Itens do pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Itens do Pedido ({pedido.itens.length} {pedido.itens.length === 1 ? 'item' : 'itens'})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pedido.itens.map(item => (
                  <Card key={item.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-lg">{item.itemContrato.nome}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {item.unidadeEducacional.nome}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Código: {item.unidadeEducacional.codigo}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Quantidade:</span>
                          <p className="font-medium">
                            {item.quantidade} {item.itemContrato.unidadeMedida.sigla}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Valor Unitário:</span>
                          <p className="font-medium">R$ {item.itemContrato.valorUnitario.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Subtotal</div>
                        <div className="text-xl font-bold">
                          R$ {(item.quantidade * item.itemContrato.valorUnitario).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total Geral:</span>
                  <span className="text-2xl font-bold">R$ {pedido.valorTotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo por unidade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Resumo por Unidade Educacional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from(new Set(pedido.itens.map(item => item.unidadeEducacional.id)))
                  .map(unidadeId => {
                    const unidade = pedido.itens.find(item => item.unidadeEducacional.id === unidadeId)?.unidadeEducacional;
                    const itensUnidade = pedido.itens.filter(item => item.unidadeEducacional.id === unidadeId);
                    const valorUnidade = itensUnidade.reduce((sum, item) => 
                      sum + (item.quantidade * item.itemContrato.valorUnitario), 0
                    );
                    
                    return (
                      <div key={unidadeId} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div>
                          <span className="font-medium">{unidade?.nome}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({itensUnidade.length} {itensUnidade.length === 1 ? 'item' : 'itens'})
                          </span>
                        </div>
                        <span className="font-medium">R$ {valorUnidade.toFixed(2)}</span>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
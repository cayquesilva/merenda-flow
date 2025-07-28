import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Package, Building2, Calendar, DollarSign, User, FileText, QrCode, Truck, MapPin, Phone } from "lucide-react";
import { Recibo } from "@/types";

interface ReciboDetailDialogProps {
  recibo: Recibo;
}

export function ReciboDetailDialog({ recibo }: ReciboDetailDialogProps) {
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

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const abrirQRCode = () => {
    window.open(recibo.qrcode, '_blank');
  };

  const abrirConfirmacao = () => {
    const url = `${window.location.origin}/confirmacao-recebimento/${recibo.id}`;
    window.open(url, '_blank');
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
            Recibo de Entrega {recibo.numero}
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações do recibo e acesse o QR Code
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações gerais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-4 w-4" />
                  Informações do Recibo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Número:</span>
                  <span className="font-mono">{recibo.numero}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pedido:</span>
                  <span className="font-mono">{recibo.pedido.numero}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  {getStatusBadge(recibo.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data de Entrega:</span>
                  <span>{new Date(recibo.dataEntrega).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resp. Entrega:</span>
                  <span>{recibo.responsavelEntrega}</span>
                </div>
                {recibo.responsavelRecebimento && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resp. Recebimento:</span>
                    <span>{recibo.responsavelRecebimento}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-4 w-4" />
                  Fornecedor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium">{recibo.pedido.contrato.fornecedor.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CNPJ:</span>
                  <span className="font-mono text-sm">{recibo.pedido.contrato.fornecedor.cnpj}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Telefone:</span>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span className="text-sm">{recibo.pedido.contrato.fornecedor.telefone}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-sm">{recibo.pedido.contrato.fornecedor.email}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  {recibo.pedido.contrato.fornecedor.endereco}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* QR Code e Ações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Code para Confirmação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="inline-block p-4 bg-white rounded-lg border-2 border-dashed border-muted-foreground">
                    <img 
                      src={recibo.qrcode} 
                      alt="QR Code" 
                      className="w-32 h-32 mx-auto"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Escaneie para confirmar recebimento
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Como usar:</h4>
                    <ol className="text-sm text-muted-foreground space-y-1">
                      <li>1. No momento da entrega, escaneie o QR Code</li>
                      <li>2. Ou clique no botão "Abrir Confirmação"</li>
                      <li>3. Confirme os itens recebidos</li>
                      <li>4. Indique não conformidades se houver</li>
                    </ol>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={abrirQRCode} variant="outline" size="sm">
                      <QrCode className="h-3 w-3 mr-1" />
                      Ver QR Code
                    </Button>
                    <Button onClick={abrirConfirmacao} size="sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      Abrir Confirmação
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Itens do recibo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Itens para Entrega ({recibo.itens.length} {recibo.itens.length === 1 ? 'item' : 'itens'})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recibo.itens.map(item => (
                  <Card key={item.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-lg">{item.itemPedido.itemContrato.nome}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {item.itemPedido.unidadeEducacional.nome}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Código: {item.itemPedido.unidadeEducacional.codigo}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Quantidade:</span>
                          <p className="font-medium">
                            {item.itemPedido.quantidade} {item.itemPedido.itemContrato.unidadeMedida.sigla}
                          </p>
                        </div>
                        {(item as any).quantidadeEntregue > 0 && (
                          <div>
                            <span className="text-sm text-muted-foreground">Entregue:</span>
                            <p className="font-medium text-success">
                              {(item as any).quantidadeEntregue} {item.itemPedido.itemContrato.unidadeMedida.sigla}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Status</div>
                        {item.conforme === null ? (
                          <Badge variant="secondary">Pendente</Badge>
                        ) : item.conforme ? (
                          <Badge variant="default">Conforme</Badge>
                        ) : (
                          <Badge variant="destructive">Não Conforme</Badge>
                        )}
                        {item.observacoes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.observacoes}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
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
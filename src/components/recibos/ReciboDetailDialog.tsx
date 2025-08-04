import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye,
  Package,
  Building2,
  Calendar,
  User,
  FileText,
  QrCode,
  MapPin,
  Phone,
  Loader2,
  Printer,
  Edit,
} from "lucide-react";
import {
  Recibo as BaseRecibo,
  ItemRecibo,
  ItemContrato,
  Pedido,
  Fornecedor,
  UnidadeEducacional,
  Contrato,
} from "@/types";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AjustarRecebimentoDialog } from "@/components/recibos/AjustarRecebimentoDialog"; // NOVO: Importar o novo componente de ajuste

// Interfaces para os dados aninhados
interface ItemReciboDetalhado extends ItemRecibo {
  itemPedido: {
    id: string;
    pedidoId: string;
    itemContratoId: string;
    unidadeEducacionalId: string;
    quantidade: number;
    itemContrato: ItemContrato & {
      unidadeMedida: {
        sigla: string;
      };
    };
    unidadeEducacional: UnidadeEducacional;
  };
}

interface HistoricoAjuste {
  dataAjuste: string;
  responsavel: string;
  mudancas: {
    itemId: string;
    quantidadeAntiga: number;
    quantidadeNova: number;
    conforme: boolean;
  }[];
}

interface ReciboDetalhado {
  id: string;
  numero: string;
  status: string;
  dataEntrega: string;
  responsavelRecebimento?: string;
  qrcode?: string;
  pedido: Pedido & {
    contrato: Contrato & {
      fornecedor: Fornecedor;
    };
  };
  itens: ItemReciboDetalhado[];
  unidadeEducacional: UnidadeEducacional;
  assinaturaDigital?: { imagemBase64: string } | null;
  fotoReciboAssinado?: { url: string } | null;
  historicoAjustes?: HistoricoAjuste[];
}

interface ReciboDetailDialogProps {
  reciboId: string;
}

export function ReciboDetailDialog({ reciboId }: ReciboDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const [reciboDetalhado, setReciboDetalhado] =
    useState<ReciboDetalhado | null>(null);
  const [recibo, setRecibo] = useState<BaseRecibo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAjusteModalOpen, setIsAjusteModalOpen] = useState(false); // NOVO: Estado para controlar o modal de ajuste
  const navigate = useNavigate();

  const fetchReciboDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/recibos/${reciboId}`
      );
      if (!response.ok) throw new Error("Falha ao buscar detalhes do recibo.");
      setReciboDetalhado(await response.json());
    } catch (error) {
      console.error("Erro ao buscar detalhes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [reciboId]);

  const fetchRecibo = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/recibos/${reciboId}`
      );
      if (!response.ok) throw new Error("Falha ao buscar detalhes do recibo.");
      setRecibo(await response.json());
    } catch (error) {
      console.error("Erro ao buscar detalhes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [reciboId]);

  useEffect(() => {
    if (open && reciboId) {
      fetchReciboDetails();
      fetchRecibo();
    }
  }, [open, reciboId, fetchReciboDetails, fetchRecibo]);

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: "secondary",
      confirmado: "default",
      parcial: "destructive", // Status parcial pode ser tratado como inconforme
      rejeitado: "destructive",
      ajustado: "outline", // NOVO: Status ajustado (alterado de "success" para "default")
    } as const;

    const labels = {
      pendente: "Pendente",
      confirmado: "Confirmado",
      parcial: "Parcial",
      rejeitado: "Rejeitado",
      ajustado: "Ajustado", // NOVO: Label ajustada
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const abrirQRCode = () => {
    if (recibo?.qrcode) window.open(recibo.qrcode, "_blank");
  };

  const abrirConfirmacao = () => {
    if (recibo?.id)
      window.open(`/confirmacao-recebimento/${recibo.id}`, "_blank");
  };

  const handlePrintRecibo = () => {
    if (recibo?.id) {
      window.open(`/recibos/imprimir/${recibo.id}`, "_self");
    }
  };

  // NOVO: Função para abrir o modal de ajuste
  const handleOpenAjusteModal = () => {
    setIsAjusteModalOpen(true);
  };

  // NOVO: Função de sucesso que fecha o modal de ajuste e recarrega os dados
  const handleAjusteSuccess = () => {
    setIsAjusteModalOpen(false);
    fetchReciboDetails();
  };
  
  const getQuantidadeAjuste = (itemId: string): number => {
    const ultimoAjuste =
      reciboDetalhado?.historicoAjustes && reciboDetalhado.historicoAjustes[0];
    if (!ultimoAjuste) {
      return 0;
    }

    const itemMudanca = ultimoAjuste.mudancas.find((m) => m.itemId === itemId);

    return itemMudanca ? itemMudanca.quantidadeNova : 0;
  };

  const getQuantidadeAntiga = (itemId: string): number => {
    const ultimoAjuste =
      reciboDetalhado?.historicoAjustes && reciboDetalhado.historicoAjustes[0];
    if (!ultimoAjuste) {
      return 0;
    }

    const itemMudanca = ultimoAjuste.mudancas.find((m) => m.itemId === itemId);

    return itemMudanca ? itemMudanca.quantidadeAntiga : 0;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
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
              Recibo de Entrega {recibo?.numero}
            </DialogTitle>
            <DialogDescription>
              Visualize todas as informações do recibo e acesse o QR Code
            </DialogDescription>
          </DialogHeader>
          {isLoading ? (
            <div className="flex justify-center p-20">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : recibo ? (
            <div className="space-y-6">
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
                      <span className="text-muted-foreground">
                        Data de Entrega:
                      </span>
                      <span>
                        {new Date(recibo.dataEntrega).toLocaleDateString(
                          "pt-BR"
                        )}
                      </span>
                    </div>
                    {recibo.responsavelRecebimento && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Resp. Recebimento:
                        </span>
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
                      <span className="font-medium">
                        {recibo.pedido.contrato.fornecedor.nome}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CNPJ:</span>
                      <span className="font-mono text-sm">
                        {recibo.pedido.contrato.fornecedor.cnpj}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Telefone:</span>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span className="text-sm">
                          {recibo.pedido.contrato.fornecedor.telefone}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="text-sm">
                        {recibo.pedido.contrato.fornecedor.email}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      {recibo.pedido.contrato.fornecedor.endereco}
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                        <Button
                          onClick={abrirQRCode}
                          variant="outline"
                          size="sm"
                        >
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Itens para Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recibo.itens.map((item) => (
                      <Card key={item.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
                            <h4 className="font-medium text-lg">
                              {item.itemPedido.itemContrato.nome}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {item.itemPedido.unidadeEducacional.nome}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Código:{" "}
                              {item.itemPedido.unidadeEducacional.codigo}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <span className="text-sm text-muted-foreground">
                                Solicitado:
                              </span>
                              <p className="font-medium">
                                {item.quantidadeSolicitada}{" "}
                                {
                                  item.itemPedido.itemContrato.unidadeMedida
                                    .sigla
                                }
                              </p>
                            </div>
                            {item.quantidadeRecebida > 0 && (
                              <div>
                                <span className="text-sm text-muted-foreground">
                                  Entregue:
                                </span>
                                <div className="flex gap-2">
                                  <p className="font-medium text-success">
                                    {getQuantidadeAntiga(item.id) !== 0 ? (
                                      <>
                                        {getQuantidadeAntiga(item.id)}{" "}
                                        {
                                          item.itemPedido.itemContrato
                                            .unidadeMedida.sigla
                                        }
                                      </>
                                    ) : (
                                      <>
                                        {item.quantidadeRecebida}{" "}
                                        {
                                          item.itemPedido.itemContrato
                                            .unidadeMedida.sigla
                                        }
                                      </>
                                    )}
                                  </p>
                                  {getQuantidadeAjuste(item.id) !== 0 && (
                                    <>
                                      <p className="font-medium text-muted-foreground">
                                        {" + "}
                                        {getQuantidadeAjuste(item.id)}{" "}
                                        {
                                          item.itemPedido.itemContrato
                                            .unidadeMedida.sigla
                                        }
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {" "}
                                        Ajuste
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              Status
                            </div>
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
            </div>
          ) : (
            <p>Não foi possível carregar os dados do recibo.</p>
          )}
          <DialogFooter>
            {/* Botão de Imprimir Recibo */}
            <Button
              onClick={handlePrintRecibo}
              variant="outline"
              disabled={isLoading}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Recibo
            </Button>
            {/* NOVO: Botão de Ajustar Recebimento, visível apenas para recibos parciais ou rejeitados */}
            {(recibo?.status === "parcial" ||
              recibo?.status === "rejeitado") && (
              <Button
                onClick={handleOpenAjusteModal}
                variant="default"
                disabled={isLoading}
              >
                <Edit className="h-4 w-4 mr-2" />
                Ajustar Recebimento
              </Button>
            )}
            <Button onClick={() => setOpen(false)} variant="secondary">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* NOVO: Componente do Modal de Ajuste de Recebimento */}
      {recibo && (
        <AjustarRecebimentoDialog
          recibo={{
            ...recibo,
            itens: recibo.itens.map((item) => ({
              ...item,
              quantidadeRecebida: item.quantidadeRecebida ?? 0, // Garante que seja obrigatório
            })),
          }}
          open={isAjusteModalOpen}
          onOpenChange={setIsAjusteModalOpen}
          onSuccess={handleAjusteSuccess}
        />
      )}
    </>
  );
}

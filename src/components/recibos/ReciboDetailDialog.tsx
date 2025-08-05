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
  Phone,
  Loader2,
  Printer,
  Edit,
  Link2,
  ChevronRight,
} from "lucide-react";
import {
  Recibo as BaseRecibo,
  ItemRecibo,
  UnidadeEducacional,
  Fornecedor,
  Contrato,
  Pedido,
  ItemContrato,
  ItemPedido,
} from "@/types";
import React, { useEffect, useState, useCallback } from "react";
import { AjustarRecebimentoDialog } from "@/components/recibos/AjustarRecebimentoDialog";

// ATUALIZAÇÃO: A interface agora espera o campo `familiaRecibos` da API.
interface ReciboDetalhado extends BaseRecibo {
  unidadeEducacional: UnidadeEducacional;
  pedido: Pedido & {
    contrato: Contrato & {
      fornecedor: Fornecedor;
    };
  };
  itens: (ItemRecibo & {
    itemPedido: ItemPedido & {
      itemContrato: ItemContrato & {
        unidadeMedida: { sigla: string };
      };
      unidadeEducacional: UnidadeEducacional;
    };
  })[];
  familiaRecibos?: BaseRecibo[]; // Novo campo vindo do backend
}

interface ReciboDetailDialogProps {
  reciboId: string;
}

// ATUALIZAÇÃO: Um novo componente de nó de árvore mais inteligente
interface ReciboNodeProps {
  recibo: BaseRecibo;
  familiaCompleta: BaseRecibo[];
  onReciboClick: (reciboId: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  currentReciboId: string; // ID do recibo que está sendo visualizado
  level: number; // Nível de profundidade para indentação
}

const ReciboTreeNode = ({
  recibo,
  familiaCompleta,
  onReciboClick,
  getStatusBadge,
  currentReciboId,
  level,
}: ReciboNodeProps) => {
  const children = familiaCompleta.filter(
    (r) => r.reciboOriginalId === recibo.id
  );
  const isCurrent = recibo.id === currentReciboId;

  return (
    <div style={{ marginLeft: `${level * 20}px` }} className="mt-2">
      <div
        className={`flex justify-between items-center text-sm p-2 rounded-md transition-colors ${
          isCurrent
            ? "bg-primary/10 ring-1 ring-primary/50"
            : "hover:bg-muted/50"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {level === 0 ? "Recibo Original" : `↳ Complementar ${level}`}
          </span>
          <Button
            variant="link"
            className={`h-auto p-0 font-mono ${isCurrent ? "font-bold" : ""}`}
            onClick={() => onReciboClick(recibo.id)}
          >
            #{recibo.numero}
          </Button>
        </div>
        {getStatusBadge(recibo.status)}
      </div>
      {children.map((child) => (
        <ReciboTreeNode
          key={child.id}
          recibo={child}
          familiaCompleta={familiaCompleta}
          onReciboClick={onReciboClick}
          getStatusBadge={getStatusBadge}
          currentReciboId={currentReciboId}
          level={level + 1}
        />
      ))}
    </div>
  );
};

export function ReciboDetailDialog({ reciboId }: ReciboDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const [recibo, setRecibo] = useState<ReciboDetalhado | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAjusteModalOpen, setIsAjusteModalOpen] = useState(false);

  const fetchReciboDetails = useCallback(async (idToFetch: string) => {
    if (!idToFetch) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/recibos/${idToFetch}`
      );
      if (!response.ok) throw new Error("Falha ao buscar detalhes do recibo.");
      const data: ReciboDetalhado = await response.json();
      setRecibo(data);
    } catch (error) {
      console.error("Erro ao buscar detalhes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchReciboDetails(reciboId); // Carrega o recibo inicial quando o dialog abre
    }
  }, [open, reciboId, fetchReciboDetails]);

  useEffect(() => {
    if (open) {
      fetchReciboDetails(reciboId);
    }
  }, [open, reciboId, fetchReciboDetails]);

  // ATUALIZAÇÃO: Funções para calcular quantidades totais usando a `familiaRecibos`.
  const getQuantidadeTotalSolicitada = (itemAtual: ItemRecibo) => {
    const itemPedidoId = itemAtual.itemPedidoId;
    const reciboOriginal = recibo?.familiaRecibos?.[0];
    const itemOriginal = reciboOriginal?.itens?.find(
      (i) => i.itemPedidoId === itemPedidoId
    );
    return itemOriginal?.quantidadeSolicitada ?? itemAtual.quantidadeSolicitada;
  };

  const getQuantidadeTotalRecebida = (itemAtual: ItemRecibo) => {
    const itemPedidoId = itemAtual.itemPedidoId;
    return (
      recibo?.familiaRecibos?.reduce((total, reciboIrmao) => {
        const itemCorrelato = reciboIrmao.itens?.find(
          (i) => i.itemPedidoId === itemPedidoId
        );
        return total + (itemCorrelato?.quantidadeRecebida ?? 0);
      }, 0) ??
      itemAtual.quantidadeRecebida ??
      0
    );
  };

  // ATUALIZAÇÃO: Cores e labels dos status melhoradas.
  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: "secondary",
      confirmado: "default",
      parcial: "outline",
      rejeitado: "destructive",
      ajustado: "default",
    } as const;
    const labels = {
      pendente: "Pendente",
      confirmado: "Confirmado",
      parcial: "Parcial",
      rejeitado: "Rejeitado",
      ajustado: "Ajustado",
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  // Funções de ação mantidas.
  const abrirQRCode = () => {
    if (recibo?.qrcode) {
      const qrWindow = window.open();
      qrWindow?.document.write(
        `<body style="margin:0; display:flex; justify-content:center; align-items:center; background-color:#f0f0f0;"><img src="${recibo.qrcode}" alt="QR Code do Recibo ${recibo.numero}"></body>`
      );
    }
  };
  const abrirConfirmacao = () => {
    if (recibo?.id)
      window.open(`/confirmacao-recebimento/${recibo.id}`, "_self");
  };
  const handlePrintRecibo = () => {
    if (recibo?.id) window.open(`/recibos/imprimir/${recibo.id}`, "_self");
  };
  const handleOpenAjusteModal = () => setIsAjusteModalOpen(true);
  const handleAjusteSuccess = () => {
    setIsAjusteModalOpen(false);
    if (recibo) fetchReciboDetails(recibo.id);
  };

  // Função para construir a cadeia de ancestrais ("pais dos pais")
  const buildAncestorChain = (
    currentRecibo: BaseRecibo,
    familia: BaseRecibo[]
  ): BaseRecibo[] => {
    const chain: BaseRecibo[] = [];
    let currentNode: BaseRecibo | undefined = currentRecibo;
    while (currentNode && currentNode.reciboOriginalId) {
      const parent = familia.find(
        (r) => r.id === currentNode!.reciboOriginalId
      );
      if (parent) {
        chain.unshift(parent);
        currentNode = parent;
      } else {
        break;
      }
    }
    return chain;
  };

  const reciboRaiz = recibo?.familiaRecibos?.find((r) => !r.reciboOriginalId);
  const ancentrais =
    recibo && recibo.familiaRecibos
      ? buildAncestorChain(recibo, recibo.familiaRecibos)
      : [];

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
              Detalhes do Recibo #{recibo?.numero}
            </DialogTitle>
            <DialogDescription>
              Visualize todas as informações do recibo e seu contexto de
              entrega.
            </DialogDescription>
          </DialogHeader>
          {isLoading ? (
            <div className="flex justify-center p-20">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : recibo ? (
            <div className="space-y-6">
              {/* ATUALIZAÇÃO: Trilha de Ancestrais (Breadcrumb) */}
              {ancentrais.length > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1 text-sm flex-wrap">
                      <span className="text-muted-foreground">Caminho:</span>
                      {ancentrais.map((ancestral) => (
                        <React.Fragment key={ancestral.id}>
                          <Button
                            variant="link"
                            className="h-auto p-0"
                            onClick={() => fetchReciboDetails(ancestral.id)}
                          >
                            Recibo #{ancestral.numero}
                          </Button>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </React.Fragment>
                      ))}
                      <span className="font-semibold text-primary">
                        Recibo Atual (#{recibo.numero})
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status:</span>
                      {getStatusBadge(recibo.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Data da Entrega:
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
                      <span className="font-medium text-right">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="text-center">
                      <div className="inline-block p-2 bg-white rounded-lg border">
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
                    {recibo.itens.map((item) => {
                      const totalSolicitado =
                        getQuantidadeTotalSolicitada(item);
                      const totalRecebido = getQuantidadeTotalRecebida(item);
                      const sigla =
                        item.itemPedido.itemContrato.unidadeMedida.sigla;
                      return (
                        <Card key={item.id} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                              <h4 className="font-medium">
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
                            <div className="space-y-1 text-sm md:text-right">
                              <p>
                                <span className="text-muted-foreground">
                                  Solicitado:{" "}
                                </span>
                                {item.quantidadeSolicitada}{" "}
                                {
                                  item.itemPedido.itemContrato.unidadeMedida
                                    .sigla
                                }
                              </p>
                              <p>
                                <span className="text-muted-foreground">
                                  Recebido:{" "}
                                </span>
                                {item.quantidadeRecebida ?? 0}{" "}
                                {
                                  item.itemPedido.itemContrato.unidadeMedida
                                    .sigla
                                }
                              </p>
                            </div>

                            <div className="md:col-span-3 border-t pt-2 mt-2">
                              <p className="text-xs text-center text-muted-foreground flex justify-between">
                                <div>
                                  Resumo deste recibo (#{recibo.numero}):
                                  <span className="font-bold">
                                    {" "}
                                    {item.quantidadeSolicitada} solicitados
                                  </span>
                                  ,
                                  <span className="font-bold">
                                    {" "}
                                    {item.quantidadeRecebida ?? 0} recebidos.
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {"Status: "}
                                  {item.conforme ? (
                                    <Badge variant="default">Conforme</Badge>
                                  ) : (
                                    <Badge variant="destructive">
                                      Não Conforme
                                    </Badge>
                                  )}
                                </div>
                              </p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              {/* Condição de exibição da árvore:
                  - Precisa existir uma raiz.
                  - A família precisa ter mais de 1 membro (ou seja, ter pelo menos um complemento).
                  Com o backend robusto, esta condição agora funcionará em todos os casos.
              */}
              {reciboRaiz &&
                recibo.familiaRecibos &&
                recibo.familiaRecibos.length > 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Link2 className="h-4 w-4" />
                        Árvore de Recibos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ReciboTreeNode
                        recibo={reciboRaiz}
                        familiaCompleta={recibo.familiaRecibos}
                        onReciboClick={fetchReciboDetails}
                        getStatusBadge={getStatusBadge}
                        currentReciboId={recibo.id}
                        level={0}
                      />
                    </CardContent>
                  </Card>
                )}
            </div>
          ) : (
            <p className="text-center py-10">
              Não foi possível carregar os dados do recibo.
            </p>
          )}
          <DialogFooter>
            <Button
              onClick={handlePrintRecibo}
              variant="outline"
              disabled={isLoading || !recibo}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            {["parcial"].includes(recibo?.status || "") &&
              recibo.itens.some((item) => !item.conforme) && (
                <Button
                  onClick={handleOpenAjusteModal}
                  variant="default"
                  disabled={isLoading}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Gerar Recibo Complementar
                </Button>
              )}
            <Button onClick={() => setOpen(false)} variant="secondary">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {recibo && (
        <AjustarRecebimentoDialog
          recibo={recibo}
          open={isAjusteModalOpen}
          onOpenChange={setIsAjusteModalOpen}
          onSuccess={handleAjusteSuccess}
        />
      )}
    </>
  );
}

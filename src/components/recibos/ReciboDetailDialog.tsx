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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useAuth } from "@/contexts/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  familiaRecibos?: BaseRecibo[];
}

interface ReciboDetailDialogProps {
  reciboId: string;
}

interface ReciboNodeProps {
  recibo: BaseRecibo & {
    itens: (ItemRecibo & {
      itemPedido: {
        itemContrato: { nome: string; unidadeMedida: { sigla: string } };
      };
    })[];
  };
  familiaCompleta: BaseRecibo[];
  onReciboClick: (reciboId: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  currentReciboId: string;
  level: number;
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
    <div style={{ marginLeft: `${level * 20}px` }} className="mt-1.5">
      <div
        className={`flex justify-between items-center text-xs p-1.5 rounded-md transition-colors ${
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
            className={`h-auto p-0 font-mono text-xs ${
              isCurrent ? "font-bold" : ""
            }`}
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
  const { user, hasPermission } = useAuth();

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
      fetchReciboDetails(reciboId);
    }
  }, [open, reciboId, fetchReciboDetails]);

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: "warning",
      confirmado: "success",
      parcial: "info",
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
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
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
            <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden py-1">
              {ancentrais.length > 0 && (
                <Card className="bg-muted/50 shrink-0">
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-1 text-xs flex-wrap">
                      <span className="text-muted-foreground">Caminho:</span>
                      {ancentrais.map((ancestral) => (
                        <React.Fragment key={ancestral.id}>
                          <Button
                            variant="link"
                            className="h-auto p-0 text-xs"
                            onClick={() => fetchReciboDetails(ancestral.id)}
                          >
                            Recibo #{ancestral.numero}
                          </Button>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </React.Fragment>
                      ))}
                      <span className="font-semibold text-primary">
                        Recibo Atual (#{recibo.numero})
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
                <Card>
                  <CardHeader className="py-2.5 px-3.5">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <FileText className="h-3.5 w-3.5" />
                      Informações do Recibo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3.5 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Número:</span>
                      <span className="font-mono font-medium">
                        {recibo.numero}
                      </span>
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
                        <span className="truncate max-w-[130px]">
                          {recibo.responsavelRecebimento}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2.5 px-3.5">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <User className="h-3.5 w-3.5" />
                      Fornecedor e Unidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3.5 space-y-1.5 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground shrink-0">
                        Unidade:
                      </span>
                      <span className="font-medium text-right truncate">
                        {recibo.unidadeEducacional?.nome ||
                          recibo.itens[0]?.itemPedido?.unidadeEducacional?.nome}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground shrink-0">
                        Fornecedor:
                      </span>
                      <span className="font-medium text-right truncate">
                        {recibo.pedido.contrato.fornecedor.nome}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CNPJ:</span>
                      <span className="font-mono">
                        {recibo.pedido.contrato.fornecedor.cnpj}
                      </span>
                    </div>
                    {user?.categoria !== "comissao_recebimento" && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Telefone:</span>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>
                            {recibo.pedido.contrato.fornecedor.telefone}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2.5 px-3.5">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <QrCode className="h-3.5 w-3.5" />
                      QR Code de Confirmação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3.5 flex items-center gap-3">
                    <div className="p-1.5 bg-white rounded border shrink-0">
                      <img
                        src={recibo.qrcode}
                        alt="QR Code"
                        className="w-16 h-16"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      <Button
                        onClick={abrirQRCode}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs w-full"
                      >
                        <QrCode className="h-3 w-3 mr-1" />
                        Ver QR Code
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className={
                                !hasPermission("recibos", "update")
                                  ? "cursor-not-allowed w-full"
                                  : "w-full"
                              }
                            >
                              <Button
                                onClick={abrirConfirmacao}
                                size="sm"
                                className="h-7 text-xs w-full"
                                disabled={!hasPermission("recibos", "update")}
                              >
                                <Calendar className="h-3 w-3 mr-1" />
                                Confirmar
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            Você não tem permissão para confirmar o recebimento.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {reciboRaiz &&
                recibo.familiaRecibos &&
                recibo.familiaRecibos.length > 1 && (
                  <Card className="shrink-0 max-h-28 overflow-y-auto">
                    <CardHeader className="py-2 px-3.5">
                      <CardTitle className="flex items-center gap-2 text-xs">
                        <Link2 className="h-3.5 w-3.5" />
                        Árvore de Recibos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-1.5 px-3.5">
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

              <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <CardHeader className="py-2.5 px-4 shrink-0 border-b">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-4 w-4" />
                    Itens para Entrega ({recibo.itens.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Unidade Educacional</TableHead>
                        <TableHead className="text-right">Solicitado</TableHead>
                        <TableHead className="text-right">Recebido</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recibo.itens.map((item) => {
                        const sigla =
                          item.itemPedido.itemContrato.unidadeMedida.sigla;
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.itemPedido.itemContrato.nome}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                <Building2 className="h-3 w-3 shrink-0" />
                                <span>
                                  {item.itemPedido.unidadeEducacional.nome} (
                                  {item.itemPedido.unidadeEducacional.codigo})
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {item.quantidadeSolicitada} {sigla}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              {item.quantidadeRecebida ?? 0} {sigla}
                            </TableCell>
                            <TableCell className="text-center">
                              {getStatusBadge(recibo.status)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-center py-10">
              Não foi possível carregar os dados do recibo.
            </p>
          )}

          <DialogFooter className="shrink-0 pt-3 border-t">
            <Button
              onClick={handlePrintRecibo}
              variant="outline"
              disabled={isLoading || !recibo}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            {["parcial"].includes(recibo?.status || "") &&
              recibo.itens.some(
                (item) =>
                  !item.conforme &&
                  item.quantidadeRecebida < item.quantidadeSolicitada
              ) && (
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

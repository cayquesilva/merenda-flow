import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertTriangle,
  Package,
  User,
  Calendar,
  FileText,
  Loader2,
  Camera,
  RotateCcw,
  XCircle,
  Edit,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SignatureCanvas from "react-signature-canvas";
import {
  Recibo as BaseRecibo,
  ItemRecibo,
  ItemPedido,
  UnidadeEducacional,
  ItemContrato,
  Pedido,
  Fornecedor,
  UnidadeMedida,
  Contrato,
} from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

// Interfaces para o ajuste, com os mesmos campos do ConfirmacaoRecebimento
interface UnidadeMedidaSigla {
  sigla: string;
}

interface ItemContratoDetalhado {
  id: string;
  nome: string;
  unidadeMedida: UnidadeMedidaSigla;
  valorUnitario: number;
}

interface ItemPedidoDetalhado {
  id: string;
  itemContrato: ItemContratoDetalhado;
  unidadeEducacional: UnidadeEducacional;
}

interface ItemReciboAjuste {
  id: string;
  quantidadeSolicitada: number;
  quantidadeRecebida: number;
  conforme: boolean;
  observacoes?: string;
  itemPedido: ItemPedidoDetalhado;
}

interface ReciboAjusteDetalhado extends Omit<BaseRecibo, "itens"> {
  itens: ItemReciboAjuste[];
  unidadeEducacional: UnidadeEducacional;
  pedido: Pedido & {
    contrato: Contrato & {
      fornecedor: Fornecedor;
    };
  };
  assinaturaDigital?: string | null;
  fotoReciboAssinado?: string | null;
}

interface ItemAjusteForm {
  itemId: string;
  conforme: boolean;
  quantidadeRecebida: number;
  observacoes: string;
}

interface AjustarRecebimentoDialogProps {
  recibo: ReciboAjusteDetalhado;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AjustarRecebimentoDialog({
  recibo,
  open,
  onOpenChange,
  onSuccess,
}: AjustarRecebimentoDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [responsavel, setResponsavel] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itensAjuste, setItensAjuste] = useState<ItemAjusteForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setItensAjuste(
        recibo.itens.map((item) => ({
          itemId: item.id,
          conforme: item.conforme,
          quantidadeRecebida: item.quantidadeRecebida,
          observacoes: item.observacoes || "",
        }))
      );
      setResponsavel(recibo.responsavelRecebimento || "");
      setObservacoes(recibo.observacoes || "");
    } else {
      setItensAjuste([]);
      setResponsavel("");
      setObservacoes("");
    }
  }, [open, recibo]);

  const handleItemChange = (
    itemId: string,
    field: keyof ItemAjusteForm,
    value: boolean | number | string
  ) => {
    setItensAjuste((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === "conforme" && value === true) {
            const originalItem = recibo.itens.find((i) => i.id === itemId);
            updatedItem.quantidadeRecebida =
              originalItem?.quantidadeSolicitada - originalItem?.quantidadeRecebida || 0;
            updatedItem.observacoes = "";
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const handleAjustar = async () => {
    if (!responsavel.trim()) {
      toast({
        title: "Erro",
        description: "Informe o responsável pelo ajuste.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/recibos/ajuste/${recibo.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            responsavel,
            observacoes,
            itensAjuste,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Falha ao ajustar recebimento.");

      toast({ title: "Ajuste realizado!", description: data.message });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Ocorreu um erro.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Ajustar Recebimento do Recibo {recibo.numero}
          </DialogTitle>
          <DialogDescription>
            Revisar e ajustar os itens e quantidades entregues.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Itens do Recibo
                </CardTitle>
                <CardDescription>
                  Ajuste as quantidades recebidas e o status de conformidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recibo.itens.map((item) => {
                    const ajuste = itensAjuste.find(
                      (ia) => ia.itemId === item.id
                    );
                    const isOriginalmenteConforme = item.conforme;
                    return (
                      <Card key={item.id} className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">
                                {item.itemPedido.itemContrato.nome}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Qtd. Solicitada: {item.quantidadeSolicitada}{" "}
                                {
                                  item.itemPedido.itemContrato.unidadeMedida
                                    .sigla
                                }
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Qtd. Recebida: {item.quantidadeRecebida}{" "}
                                {
                                  item.itemPedido.itemContrato.unidadeMedida
                                    .sigla
                                }{" "}
                                (Parcial)
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Qtd. Pendente:{" "}
                                {item.quantidadeSolicitada -
                                  item.quantidadeRecebida}{" "}
                                {
                                  item.itemPedido.itemContrato.unidadeMedida
                                    .sigla
                                }
                              </p>
                            </div>
                            <Badge
                              variant={
                                ajuste?.conforme ? "default" : "destructive"
                              }
                            >
                              {ajuste?.conforme ? "Conforme" : "Não Conforme"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`conforme-ajuste-${item.id}`}
                                checked={ajuste?.conforme}
                                onCheckedChange={(checked) =>
                                  handleItemChange(
                                    item.id,
                                    "conforme",
                                    !!checked
                                  )
                                }
                              />
                              <Label htmlFor={`conforme-ajuste-${item.id}`}>
                                Item Conforme
                              </Label>
                            </div>
                            <div>
                              <Label htmlFor={`quantidade-ajuste-${item.id}`}>
                                Nova Quantidade Recebida
                              </Label>
                              <Input
                                id={`quantidade-ajuste-${item.id}`}
                                type="number"
                                min="0"
                                max={ajuste?.quantidadeRecebida}
                                value={ajuste?.quantidadeRecebida}
                                onChange={(e) =>
                                  handleItemChange(
                                    item.id,
                                    "quantidadeRecebida",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                placeholder="0"
                                disabled={ajuste?.conforme} // Desabilita se não for pendente ou se já estiver conforme
                              />
                            </div>
                            <div>
                              <Label htmlFor={`obs-ajuste-${item.id}`}>
                                Observações
                              </Label>
                              <Input
                                id={`obs-ajuste-${item.id}`}
                                placeholder="Descreva o problema..."
                                value={ajuste?.observacoes}
                                onChange={(e) =>
                                  handleItemChange(
                                    item.id,
                                    "observacoes",
                                    e.target.value
                                  )
                                }
                                disabled={ajuste?.conforme} // Desabilita se não for pendente ou se já estiver conforme
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Responsável pelo Ajuste
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="responsavel">Nome do Responsável *</Label>
                    <Input
                      id="responsavel"
                      placeholder="Nome completo do responsável"
                      value={responsavel}
                      onChange={(e) => setResponsavel(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="observacoes-gerais">
                      Observações Gerais
                    </Label>
                    <Textarea
                      id="observacoes-gerais"
                      placeholder="Observações adicionais sobre o ajuste..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      rows={1}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAjustar} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CheckCircle className="mr-2 h-4 w-4" />
            Confirmar Ajuste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

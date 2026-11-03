import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Recibo } from "@/types";
import { Loader2, Edit, CheckCircle, Package } from "lucide-react";
import { Input } from "../ui/input";
import { useNavigate } from "react-router-dom";

interface AjustarRecebimentoDialogProps {
  recibo: Recibo;
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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setResponsavel("");
      setObservacoes("");
    }
  }, [open]);

  const itensNaoConformes = recibo.itens.filter((item) => !item.conforme);

  const handleGerarComplemento = async () => {
    if (!responsavel.trim()) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, informe o nome do responsável pelo ajuste.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        responsavel,
        observacoes,
        itensAjuste: recibo.itens.map((item) => ({
          itemId: item.id,
          quantidadeRecebida: item.quantidadeRecebida ?? 0,
        })),
      };

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/recibos/ajuste/${recibo.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Falha ao gerar recibo complementar.");

      toast({
        title: "Sucesso!",
        description: data.message,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Ocorreu um erro.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      navigate("/recibos");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Gerar Recibo Complementar para #{recibo.numero}
          </DialogTitle>
          <DialogDescription>
            Um novo recibo será gerado com a quantidade total de itens
            pendentes. Confirme os detalhes abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden py-2">
          <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <CardHeader className="py-2.5 px-4 shrink-0 border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" />
                Itens a serem complementados ({itensNaoConformes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Faltam</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itensNaoConformes.map((item) => {
                    const diferenca =
                      item.quantidadeSolicitada -
                      (item.quantidadeRecebida ?? 0);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.itemPedido.itemContrato.nome}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-destructive">
                          {diferenca}{" "}
                          {item.itemPedido.itemContrato.unidadeMedida.sigla}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-3 shrink-0">
            <div>
              <Label htmlFor="responsavel-ajuste">
                Responsável pelo Ajuste *
              </Label>
              <Input
                id="responsavel-ajuste"
                placeholder="Seu nome completo"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="observacoes-complemento">
                Observações (Opcional)
              </Label>
              <Textarea
                id="observacoes-complemento"
                placeholder="Adicione observações para o novo recibo..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 pt-3 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleGerarComplemento} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Confirmar e Gerar Recibo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

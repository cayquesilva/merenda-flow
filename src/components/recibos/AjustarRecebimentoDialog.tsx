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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Recibo } from "@/types"; // Usando o tipo Recibo global
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


  // ATUALIZAÇÃO: Reset dos campos quando o modal abre
  useEffect(() => {
    if (open) {
      setResponsavel("");
      setObservacoes("");
    }
  }, [open]);

  // Filtra apenas os itens que precisam de complemento para exibição
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
      // ATUALIZAÇÃO: O payload voltou a ser simples.
      // Ele envia os dados de todos os itens do recibo original.
      // O backend irá calcular a diferença exata que faltou.
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Gerar Recibo Complementar para #{recibo.numero}
          </DialogTitle>
          <DialogDescription>
            Um novo recibo será gerado com a quantidade total de itens
            pendentes. Confirme os detalhes abaixo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" />
                Itens a serem complementados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* ATUALIZAÇÃO: A UI agora é uma lista simples, não um formulário. */}
              <ul className="space-y-2 text-sm">
                {itensNaoConformes.map((item) => {
                  const diferenca =
                    item.quantidadeSolicitada - (item.quantidadeRecebida ?? 0);
                  return (
                    <li
                      key={item.id}
                      className="flex justify-between p-2 rounded-md bg-muted/50"
                    >
                      <span>{item.itemPedido.itemContrato.nome}</span>
                      <span className="font-mono font-semibold text-destructive">
                        Faltam: {diferenca}{" "}
                        {item.itemPedido.itemContrato.unidadeMedida.sigla}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
          <div className="grid gap-4">
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
              />
            </div>
          </div>
        </div>
        <DialogFooter>
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

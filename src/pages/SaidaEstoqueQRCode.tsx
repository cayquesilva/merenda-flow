import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Importar Input
import { Label } from "@/components/ui/label"; // Importar Label
import {
  Loader2,
  CheckCircle,
  XCircle,
  Package,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api"; // 1. Importar o apiService

// Interface para os dados do estoque que serão exibidos
interface EstoqueItemData {
  id: string;
  quantidadeAtual: number;
  itemContrato: {
    nome: string;
    unidadeMedida: {
      sigla: string;
    };
  };
  unidadeEducacional: {
    nome: string;
  };
}

export default function SaidaEstoqueQRCode() {
  const { estoqueId } = useParams<{ estoqueId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [itemEstoque, setItemEstoque] = useState<EstoqueItemData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saidaConfirmada, setSaidaConfirmada] = useState(false);
  const [quantidadeSaida, setQuantidadeSaida] = useState<number>(1); // Estado para a quantidade de saída

  useEffect(() => {
    if (!estoqueId) {
      setError("ID do item de estoque não fornecido na URL.");
      setIsLoading(false);
      return;
    }

    const fetchItemEstoque = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 2. Usar o apiService para chamar a rota AUTENTICADA
        const params = new URLSearchParams({ estoqueId });
        const data = await apiService.getEstoqueConsolidado(params);

        if (data && data.length > 0) {
          setItemEstoque(data[0]);
          setQuantidadeSaida(
            data[0].quantidadeAtual >= 1 ? 1 : data[0].quantidadeAtual
          );
        } else {
          throw new Error("Item de estoque não encontrado ou sem dados.");
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Ocorreu um erro ao carregar o item."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchItemEstoque();
  }, [estoqueId]);

  const handleConfirmarSaida = async () => {
    if (!itemEstoque) return;

    if (quantidadeSaida <= 0) {
      toast({
        title: "Erro",
        description: "A quantidade de saída deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (quantidadeSaida > itemEstoque.quantidadeAtual) {
      toast({
        title: "Erro",
        description: "Quantidade de saída maior que o estoque disponível.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 3. Usar o apiService para confirmar a saída
      await apiService.postSaidaEstoqueQRCode(itemEstoque.id, quantidadeSaida);

      toast({
        title: "Saída Confirmada!",
        description: `${quantidadeSaida} ${itemEstoque.itemContrato.unidadeMedida.sigla} de ${itemEstoque.itemContrato.nome} foi baixado do estoque.`,
        variant: "default",
      });
      setSaidaConfirmada(true);
      setTimeout(() => navigate("/estoque"), 3000);
    } catch (err) {
      toast({
        title: "Erro na Saída",
        description:
          err instanceof Error
            ? err.message
            : "Não foi possível registrar a saída de estoque.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">
          Carregando informações do item...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-2">Erro</h2>
        <p className="text-lg text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => navigate("/estoque")}>
          Voltar para Estoque
        </Button>
      </div>
    );
  }

  if (!itemEstoque) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-2">
          Item não encontrado
        </h2>
        <p className="text-lg text-muted-foreground mb-4">
          O item de estoque para este QR Code não pôde ser carregado.
        </p>
        <Button onClick={() => navigate("/estoque")}>
          Voltar para Estoque
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 ">
      <Card className="w-full max-w-md text-center shadow-lg rounded-lg">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg p-6">
          <CardTitle className="text-3xl font-extrabold flex items-center justify-center gap-3">
            <Package className="h-8 w-8" />
            Saída de Estoque
          </CardTitle>
          <CardDescription className="text-primary-foreground/80 text-lg mt-2">
            Confirme a saída de um item do estoque
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          {saidaConfirmada ? (
            <div className="text-center text-success">
              <CheckCircle className="h-20 w-20 mx-auto mb-4" />
              <h3 className="text-3xl font-bold mb-2 text-foreground">Saída Registrada!</h3>
              <p className="text-lg text-muted-foreground">
                O item foi baixado do estoque com sucesso.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-foreground">
                  Item: {itemEstoque.itemContrato.nome}
                </h3>
                <p className="text-base text-muted-foreground flex items-center justify-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Unidade: <span className="font-semibold text-foreground">{itemEstoque.unidadeEducacional.nome}</span>
                </p>
                <div className="p-3 bg-muted/60 rounded-xl border border-border">
                  <p className="text-sm text-muted-foreground">Estoque Disponível</p>
                  <p className="text-2xl font-bold text-foreground">
                    {itemEstoque.quantidadeAtual}{" "}
                    <span className="text-base font-normal text-muted-foreground">{itemEstoque.itemContrato.unidadeMedida.sigla}</span>
                  </p>
                </div>

                {/* Campo de entrada para a quantidade de saída */}
                <div className="pt-2">
                  <Label
                    htmlFor="quantidadeSaida"
                    className="text-base font-bold text-foreground"
                  >
                    Quantidade a ser baixada:
                  </Label>
                  <Input
                    id="quantidadeSaida"
                    type="number"
                    min="1"
                    step="1"
                    value={quantidadeSaida}
                    onChange={(e) => setQuantidadeSaida(Number(e.target.value))}
                    className="text-center text-2xl font-bold mt-2 h-14 bg-background"
                    max={itemEstoque.quantidadeAtual}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Unidade de medida:{" "}
                    {itemEstoque.itemContrato.unidadeMedida.sigla}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={handleConfirmarSaida}
                  disabled={
                    isSubmitting ||
                    quantidadeSaida <= 0 ||
                    quantidadeSaida > itemEstoque.quantidadeAtual
                  }
                  className="w-full h-12 text-lg font-bold shadow-md shadow-primary/20"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-5 w-5" />
                  )}
                  Confirmar Saída
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/estoque")}
                  className="w-full h-12 text-base font-semibold"
                >
                  <XCircle className="mr-2 h-5 w-5" />
                  Cancelar
                </Button>
                {(quantidadeSaida <= 0 ||
                  quantidadeSaida > itemEstoque.quantidadeAtual) && (
                  <p className="text-destructive text-sm mt-1 flex items-center justify-center gap-1 font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    Quantidade inválida ou estoque insuficiente.
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

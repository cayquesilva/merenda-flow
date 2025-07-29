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
import {
  Loader2,
  CheckCircle,
  XCircle,
  Package,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
        // Busca os detalhes do item de estoque para exibição
        const response = await fetch(
          `http://localhost:3001/api/estoque/consolidado?q=&unidadeId=&estoqueId=${estoqueId}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Falha ao carregar detalhes do item de estoque."
          );
        }
        const data = await response.json();
        // A API de consolidado retorna um array, então pegamos o primeiro item
        if (data.length > 0) {
          setItemEstoque(data[0]);
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

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/estoque/saida-qrcode/${itemEstoque.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // O corpo pode ser vazio ou conter informações adicionais se a rota de backend precisar
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Falha ao registrar saída de estoque."
        );
      }

      toast({
        title: "Saída Confirmada!",
        description: `1 ${itemEstoque.itemContrato.unidadeMedida.sigla} de ${itemEstoque.itemContrato.nome} foi baixado do estoque.`,
        variant: "default",
      });
      setSaidaConfirmada(true);
      // Opcional: Redirecionar após alguns segundos ou mostrar uma mensagem final
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

  // Corrigido o erro de sintaxe aqui: o return estava fora do div
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
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
            <div className="text-center text-green-600 dark:text-green-400">
              <CheckCircle className="h-20 w-20 mx-auto mb-4" />
              <h3 className="text-3xl font-bold mb-2">Saída Registrada!</h3>
              <p className="text-xl">
                O item foi baixado do estoque com sucesso.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                  Item: {itemEstoque.itemContrato.nome}
                </h3>
                <p className="text-lg text-muted-foreground flex items-center justify-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Unidade: {itemEstoque.unidadeEducacional.nome}
                </p>
                <p className="text-lg text-muted-foreground">
                  Quantidade Atual:{" "}
                  <span className="font-bold">
                    {itemEstoque.quantidadeAtual}{" "}
                    {itemEstoque.itemContrato.unidadeMedida.sigla}
                  </span>
                </p>
                <p className="text-xl font-bold text-red-500 dark:text-red-400">
                  Será baixado: 1 {itemEstoque.itemContrato.unidadeMedida.sigla}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <Button
                  onClick={handleConfirmarSaida}
                  disabled={isSubmitting || itemEstoque.quantidadeAtual < 1}
                  className="w-full py-3 text-xl font-bold bg-green-600 hover:bg-green-700 text-white rounded-md shadow-lg transition-colors duration-300"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-6 w-6" />
                  )}
                  Confirmar Saída
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/estoque")}
                  className="w-full py-3 text-xl font-bold border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 rounded-md shadow-md transition-colors duration-300"
                >
                  <XCircle className="mr-2 h-6 w-6" />
                  Cancelar
                </Button>
                {itemEstoque.quantidadeAtual < 1 && (
                  <p className="text-red-500 text-sm mt-2 flex items-center justify-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Estoque insuficiente para esta operação.
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

import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Printer, QrCode, Building2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UnidadeEducacional } from "@/types"; // Importar UnidadeEducacional

// Interface para um item de estoque no catálogo de QR Codes
interface EstoqueItemCatalogo {
  id: string; // ID do item de estoque
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

export default function QRCodeCatalog() {
  const [unidades, setUnidades] = useState<UnidadeEducacional[]>([]);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("");
  const [itensEstoque, setItensEstoque] = useState<EstoqueItemCatalogo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null); // Ref para a área de impressão

  // Busca as unidades educacionais ativas
  useEffect(() => {
    const fetchUnidades = async () => {
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:3001"
          }/api/unidades-ativas`
        );
        if (response.ok) {
          setUnidades(await response.json());
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Falha ao buscar unidades.");
        }
      } catch (error) {
        console.error("Erro ao buscar unidades:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as unidades educacionais.",
          variant: "destructive",
        });
      }
    };
    fetchUnidades();
  }, [toast]);

  // Busca os itens de estoque da unidade selecionada
  const fetchItensEstoque = async () => {
    if (!unidadeSelecionada) {
      setItensEstoque([]);
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/estoque/catalogo-qrcode/${unidadeSelecionada}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao buscar itens de estoque.");
      }
      const data: EstoqueItemCatalogo[] = await response.json();
      setItensEstoque(data);
      toast({
        title: "Catálogo Gerado!",
        description: `Foram encontrados ${data.length} itens de estoque para a unidade selecionada.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao gerar catálogo:", error);
      toast({
        title: "Erro ao Gerar Catálogo",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível gerar o catálogo de QR Codes.",
        variant: "destructive",
      });
      setItensEstoque([]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Função para imprimir o conteúdo
  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const originalContents = document.body.innerHTML;

      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // Recarrega a página para restaurar o estado
    }
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Gerar Catálogo de QR Codes
          </CardTitle>
          <CardDescription>
            Selecione uma unidade para gerar um catálogo de QR Codes de todos os
            itens em estoque para impressão.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="unidade">Unidade Educacional *</Label>
              <Select
                value={unidadeSelecionada}
                onValueChange={setUnidadeSelecionada}
                disabled={isLoading || isGenerating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((unidade) => (
                    <SelectItem key={unidade.id} value={unidade.id}>
                      {unidade.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={fetchItensEstoque}
              disabled={!unidadeSelecionada || isGenerating || isLoading}
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="mr-2 h-4 w-4" />
              )}
              Gerar Catálogo
            </Button>
          </div>
        </CardContent>
      </Card>

      {itensEstoque.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Catálogo Gerado</CardTitle>
              <CardDescription>
                {itensEstoque.length} QR Codes para a unidade selecionada.
              </CardDescription>
            </div>
            <Button onClick={handlePrint} variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Catálogo
            </Button>
          </CardHeader>
          <CardContent>
            {/* Área de impressão */}
            <div
              ref={printRef}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-3 print:gap-2"
            >
              {itensEstoque.map((item) => (
                <div
                  key={item.id}
                  className="border p-4 rounded-lg flex flex-col items-center text-center break-inside-avoid-page"
                >
                  <h4 className="font-semibold text-lg mb-2">
                    {item.itemContrato.nome}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    ({item.itemContrato.unidadeMedida.sigla})
                  </p>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      `${window.location.origin}/saida-estoque-qrcode/${item.id}`
                    )}`}
                    alt={`QR Code para ${item.itemContrato.nome}`}
                    className="w-36 h-36 border border-gray-200 rounded-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Unidade: {item.unidadeEducacional.nome}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

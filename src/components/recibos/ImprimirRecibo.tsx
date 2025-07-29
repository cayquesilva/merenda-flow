import React, { useEffect, useState, useRef } from "react";
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
  Printer,
  FileText,
  Calendar,
  User,
  Package,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Recibo } from "@/types"; // Importar Recibo do seu arquivo de tipos
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

// Definindo a interface para o ItemRecibo do backend (para impressão)
interface ItemReciboImpressao {
  id: string;
  quantidadeSolicitada: number;
  quantidadeRecebida: number;
  conforme: boolean;
  observacoes: string | null;
  itemPedido: {
    itemContrato: {
      nome: string;
      unidadeMedida: {
        sigla: string;
      };
      valorUnitario: number; // Adicionado para cálculo de valor total por item
    };
  };
}

// Estendendo a interface Recibo para incluir os detalhes completos para impressão
interface ReciboParaImpressao extends Recibo {
  itens: ItemReciboImpressao[];
  unidadeEducacional: {
    nome: string;
    endereco?: string; // Adicionado para detalhes da unidade
    telefone?: string;
  };
  pedido: {
    numero: string;
    dataEntregaPrevista: string;
    contrato: {
      // Incluir contrato e fornecedor para detalhes completos
      numero: string;
      fornecedor: {
        nome: string;
        cnpj: string;
      };
    };
  };
  assinaturaDigital?: string | null;
  fotoReciboAssinado?: string | null;
}

export default function ImprimirRecibo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null); // Ref para a área de impressão

  const [recibo, setRecibo] = useState<ReciboParaImpressao | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("ID do recibo não fornecido na URL.");
      setIsLoading(false);
      return;
    }

    const fetchRecibo = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `http://localhost:3001/api/recibos/imprimir/${id}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Falha ao carregar recibo para impressão."
          );
        }
        const data: ReciboParaImpressao = await response.json();
        setRecibo(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Ocorreu um erro ao carregar o recibo."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecibo();
  }, [id]);

  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const originalContents = document.body.innerHTML;

      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents; // Restaura o conteúdo original
      window.location.reload(); // Recarrega a página para restaurar o estado completo do React
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">
          Carregando recibo para impressão...
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
        <Button onClick={() => navigate("/")}>Voltar</Button>
      </div>
    );
  }

  if (!recibo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-2">
          Recibo não encontrado
        </h2>
        <p className="text-lg text-muted-foreground mb-4">
          O recibo solicitado não pôde ser carregado.
        </p>
        <Button onClick={() => navigate("/")}>Voltar</Button>
      </div>
    );
  }

  const totalValorRecebido = recibo.itens.reduce(
    (sum, item) =>
      sum +
      item.quantidadeRecebida * item.itemPedido.itemContrato.valorUnitario,
    0
  );

  return (
    <div className="p-4 print:p-0">
      <Card className="max-w-4xl mx-auto shadow-lg print:shadow-none print:border-0">
        <CardHeader className="print:hidden">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Visualizar Recibo para Impressão
          </CardTitle>
          <CardDescription>Recibo #{recibo.numero}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 print:p-0">
          <div
            ref={printRef}
            className="print:w-full print:h-auto print:p-4 print:text-black"
          >
            <div className="flex justify-between items-center mb-6 print:mb-4">
              <h1 className="text-3xl font-bold print:text-2xl">
                Recibo de Entrega
              </h1>
              <div className="text-right">
                <p className="font-mono text-xl print:text-lg">
                  #{recibo.numero}
                </p>
                <p className="text-sm text-muted-foreground print:text-xs">
                  Data de Emissão:{" "}
                  {new Date(recibo.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 print:grid-cols-2 print:gap-4 print:mb-4">
              <div>
                <h3 className="font-semibold text-lg mb-2 print:text-base">
                  Informações do Pedido
                </h3>
                <p className="text-sm print:text-xs">
                  <strong>Pedido:</strong> {recibo.pedido.numero}
                </p>
                <p className="text-sm print:text-xs">
                  <strong>Contrato:</strong> {recibo.pedido.contrato.numero}
                </p>
                <p className="text-sm print:text-xs">
                  <strong>Fornecedor:</strong>{" "}
                  {recibo.pedido.contrato.fornecedor.nome}
                </p>
                <p className="text-sm print:text-xs">
                  <strong>CNPJ:</strong>{" "}
                  {recibo.pedido.contrato.fornecedor.cnpj}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 print:text-base">
                  Detalhes da Entrega
                </h3>
                <p className="text-sm print:text-xs">
                  <strong>Unidade:</strong> {recibo.unidadeEducacional.nome}
                </p>
                <p className="text-sm print:text-xs">
                  <strong>Endereço:</strong>{" "}
                  {recibo.unidadeEducacional.endereco}
                </p>
                <p className="text-sm print:text-xs">
                  <strong>Data Entrega:</strong>{" "}
                  {new Date(recibo.dataEntrega).toLocaleDateString("pt-BR")}
                </p>
                <p className="text-sm print:text-xs">
                  <strong>Responsável Entrega:</strong>{" "}
                  {recibo.responsavelEntrega}
                </p>
                <p className="text-sm print:text-xs">
                  <strong>Responsável Recebimento:</strong>{" "}
                  {recibo.responsavelRecebimento || "Não informado"}
                </p>
              </div>
            </div>

            <h3 className="font-semibold text-lg mb-3 print:text-base print:mb-2">
              Itens Recebidos
            </h3>
            <Table className="mb-6 print:mb-4 print:text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="print:py-1">Item</TableHead>
                  <TableHead className="print:py-1">Solicitado</TableHead>
                  <TableHead className="print:py-1">Recebido</TableHead>
                  <TableHead className="print:py-1">Conforme</TableHead>
                  <TableHead className="print:py-1">Observações</TableHead>
                  <TableHead className="text-right print:py-1">
                    Valor Unitário
                  </TableHead>
                  <TableHead className="text-right print:py-1">
                    Subtotal
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recibo.itens.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium print:py-1">
                      {item.itemPedido.itemContrato.nome}
                    </TableCell>
                    <TableCell className="print:py-1">
                      {item.quantidadeSolicitada}{" "}
                      {item.itemPedido.itemContrato.unidadeMedida.sigla}
                    </TableCell>
                    <TableCell className="print:py-1">
                      {item.quantidadeRecebida}{" "}
                      {item.itemPedido.itemContrato.unidadeMedida.sigla}
                    </TableCell>
                    <TableCell className="print:py-1">
                      {item.conforme ? "Sim" : "Não"}
                    </TableCell>
                    <TableCell className="print:py-1">
                      {item.observacoes || "-"}
                    </TableCell>
                    <TableCell className="text-right print:py-1">
                      {item.itemPedido.itemContrato.valorUnitario.toLocaleString(
                        "pt-BR",
                        { style: "currency", currency: "BRL" }
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium print:py-1">
                      {(
                        item.quantidadeRecebida *
                        item.itemPedido.itemContrato.valorUnitario
                      ).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-right font-bold text-lg print:py-1 print:text-base"
                  >
                    Valor Total Recebido:
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg print:py-1 print:text-base">
                    {totalValorRecebido.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {recibo.observacoes && (
              <div className="mb-6 print:mb-4">
                <h3 className="font-semibold text-lg mb-2 print:text-base">
                  Observações Gerais
                </h3>
                <p className="text-sm print:text-xs">{recibo.observacoes}</p>
              </div>
            )}

            {/* Assinaturas e Foto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 print:grid-cols-2 print:gap-4 print:mb-4">
              {/* Assinatura Digital */}
              {recibo.assinaturaDigital && (
                <div>
                  <h3 className="font-semibold text-lg mb-2 print:text-base">
                    Assinatura do Recebedor
                  </h3>
                  <img
                    src={recibo.assinaturaDigital}
                    alt="Assinatura Digital"
                    className="w-full max-w-[300px] h-auto border border-gray-300 rounded-lg print:border print:border-gray-400"
                  />
                  <p className="text-sm text-muted-foreground mt-1 print:text-xs">
                    {recibo.responsavelRecebimento ||
                      "Responsável pelo Recebimento"}
                  </p>
                </div>
              )}
              {/* Foto do Recibo Assinado */}
              {recibo.fotoReciboAssinado && (
                <div>
                  <h3 className="font-semibold text-lg mb-2 print:text-base">
                    Foto do Recibo Assinado
                  </h3>
                  <img
                    src={recibo.fotoReciboAssinado}
                    alt="Recibo Assinado Físico"
                    className="w-full max-w-[300px] h-auto border border-gray-300 rounded-lg print:border print:border-gray-400"
                  />
                  <p className="text-sm text-muted-foreground mt-1 print:text-xs">
                    Comprovação visual da entrega.
                  </p>
                </div>
              )}
            </div>

            {/* Área do QR Code (manter visível para referência, mas pode ser ajustado para impressão) */}
            {recibo.qrcode && (
              <div className="mt-6 text-center print:mt-4">
                <h3 className="font-semibold text-lg mb-2 print:text-base">
                  QR Code do Recibo
                </h3>
                <img
                  src={recibo.qrcode}
                  alt="QR Code do Recibo"
                  className="w-32 h-32 mx-auto border border-gray-300 rounded-lg print:w-24 print:h-24 print:border-0"
                />
                <p className="text-sm text-muted-foreground mt-1 print:text-xs">
                  Escaneie para ver os detalhes online.
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <div className="p-6 border-t flex justify-end print:hidden">
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </Card>
    </div>
  );
}

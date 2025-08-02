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
import { Loader2, Printer, FileText, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Importar todas as interfaces base do seu arquivo de tipos
import {
  Recibo as BaseRecibo,
  ItemRecibo,
  ItemPedido,
  ItemContrato,
  UnidadeMedida,
  Contrato,
  Fornecedor,
  UnidadeEducacional,
} from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Interfaces detalhadas para corresponder ao retorno da API /api/recibos/imprimir-pedido/:pedidoId
interface ItemContratoImpressao extends ItemContrato {
  unidadeMedida: UnidadeMedida;
}

interface ItemPedidoImpressao extends ItemPedido {
  itemContrato: ItemContratoImpressao;
  unidadeEducacional: UnidadeEducacional;
}

interface ItemReciboImpressaoDetalhado extends ItemRecibo {
  itemPedido: ItemPedidoImpressao;
}

interface PedidoImpressaoDetalhado extends Contrato {
  // Pedido com contrato completo
  contrato: Contrato & {
    fornecedor: Fornecedor;
  };
}

interface ReciboParaImpressao
  extends Omit<BaseRecibo, "pedido" | "unidadeEducacional" | "itens"> {
  pedido: PedidoImpressaoDetalhado; // Pedido com detalhes do contrato e fornecedor
  unidadeEducacional: UnidadeEducacional; // Unidade Educacional completa
  itens: ItemReciboImpressaoDetalhado[]; // Itens do recibo detalhados
  assinaturaDigital?: string | null;
  fotoReciboAssinado?: string | null;
}

export default function ImprimirRecibosPedido() {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null); // Ref para a área de impressão

  const [recibos, setRecibos] = useState<ReciboParaImpressao[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pedidoId) {
      setError("ID do pedido não fornecido na URL.");
      setIsLoading(false);
      return;
    }

    const fetchRecibos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:3001"
          }/api/recibos/imprimir-pedido/${pedidoId}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Falha ao carregar recibos para impressão."
          );
        }
        const data: ReciboParaImpressao[] = await response.json();
        setRecibos(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Ocorreu um erro ao carregar os recibos."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecibos();
  }, [pedidoId]);

  const handlePrintAll = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const originalContents = document.body.innerHTML;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(`
          <html>
            <head>
              <title>Imprimir Recibos do Pedido ${pedidoId}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                /* Estilos gerais para impressão */
                body { font-family: sans-serif; margin: 0; padding: 16px; }
                .recibo-page {
                  page-break-after: always; /* Quebra de página após cada recibo */
                  margin-bottom: 20px; /* Espaçamento entre recibos */
                  padding: 20px;
                  border: 1px solid #ccc; /* Borda para cada recibo */
                  border-radius: 8px;
                }
                .recibo-page:not(:first-child) { /* Adicionado para quebrar página antes de cada recibo, exceto o primeiro */
                  page-break-before: always;
                }
                .recibo-page:last-child {
                  page-break-after: avoid; /* Não quebra de página após o último */
                }
                .print\\:text-black { color: black !important; }
                .print\\:shadow-none { box-shadow: none !important; }
                .print\\:border-0 { border-width: 0 !important; }
                .print\\:p-0 { padding: 0 !important; }
                .print\\:py-1 { padding-top: 4px !important; padding-bottom: 4px !important; }
                .print\\:mb-4 { margin-bottom: 16px !important; }
                .print\\:text-sm { font-size: 0.875rem !important; }
                .print\\:text-xs { font-size: 0.75rem !important; }
                .print\\:text-lg { font-size: 1.125rem !important; }
                .print\\:text-2xl { font-size: 1.5rem !important; }
                .print\\:w-full { width: 100% !important; }
                .print\\:h-auto { height: auto !important; }
                .print\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                .print\\:gap-4 { gap: 16px !important; }
                .print\\:gap-2 { gap: 8px !important; }
                .print\\:mt-4 { margin-top: 16px !important; }
                .break-inside-avoid-page { break-inside: avoid; }
                .no-print { display: none !important; }
                table, th, td { border-collapse: collapse; border: 1px solid #ccc; }
                th, td { padding: 8px; text-align: left; }
                
                /* Estilos para as linhas de assinatura */
                .signature-line {
                  border-bottom: 1px solid #000;
                  width: 80%;
                  margin-top: 40px; /* Espaço para a assinatura */
                  margin-bottom: 5px;
                }
                .signature-label {
                  font-size: 0.875rem;
                  text-align: center;
                  width: 80%;
                  margin-top: 16px;
                }
              </style>
            </head>
            <body>
              ${printContents}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();

        // NOVO: Adiciona um pequeno atraso antes de imprimir
        setTimeout(() => {
          printWindow.print();
          printWindow.close(); // Fecha a janela após a impressão/salvamento
        }, 500); // 500ms de atraso

        // NOVO: Informa o usuário para salvar como PDF
        toast({
          title: "Preparando para Impressão",
          description:
            "No diálogo de impressão do seu navegador, selecione 'Salvar como PDF' para gerar o arquivo.",
          variant: "default",
          duration: 5000,
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">
          Carregando recibos do pedido...
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
        <Button onClick={() => navigate("/confirmacoes")}>
          Voltar para Confirmações
        </Button>
      </div>
    );
  }

  if (!recibos || recibos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-2">
          Nenhum recibo encontrado
        </h2>
        <p className="text-lg text-muted-foreground mb-4">
          Não foram encontrados recibos para este pedido.
        </p>
        <Button onClick={() => navigate("/confirmacoes")}>
          Voltar para Confirmações
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 print:p-0">
      <Card className="max-w-4xl mx-auto shadow-lg print:shadow-none print:border-0">
        <CardHeader className="no-print">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recibos do Pedido {pedidoId}
          </CardTitle>
          <CardDescription>
            Visualizar e imprimir todos os recibos gerados para este pedido.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 print:p-0">
          <div
            ref={printRef}
            className="print:w-full print:h-auto print:p-4 print:text-black"
          >
            {recibos.map((reciboItem, index) => {
              // O valor total recebido ainda é calculado, mas não será exibido na tabela
              const totalValorRecebido = reciboItem.itens.reduce(
                (sum, item) =>
                  sum +
                  item.quantidadeRecebida *
                    (item.itemPedido?.itemContrato?.valorUnitario ?? 0),
                0
              );
              return (
                <div
                  key={reciboItem.id}
                  className="recibo-page mb-8 print:mb-0 print:border-0 print:p-0"
                >
                  <div className="flex justify-between items-center mb-6 print:mb-4">
                    <h1 className="text-3xl font-bold print:text-2xl">
                      Recibo de Entrega
                    </h1>
                    <div className="text-right">
                      <p className="font-mono text-xl print:text-lg">
                        #{reciboItem.numero}
                      </p>
                      <p className="text-sm text-muted-foreground print:text-xs">
                        Data de Emissão:{" "}
                        {new Date(reciboItem.createdAt).toLocaleDateString(
                          "pt-BR"
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 print:grid-cols-2 print:gap-4 print:mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2 print:text-base">
                        Informações do Pedido
                      </h3>
                      <p className="text-sm print:text-xs">
                        <strong>Pedido:</strong> {reciboItem.pedido.numero}
                      </p>
                      <p className="text-sm print:text-xs">
                        <strong>Contrato:</strong>{" "}
                        {reciboItem.pedido.contrato.numero}
                      </p>
                      <p className="text-sm print:text-xs">
                        <strong>Fornecedor:</strong>{" "}
                        {reciboItem.pedido.contrato.fornecedor.nome}
                      </p>
                      <p className="text-sm print:text-xs">
                        <strong>CNPJ:</strong>{" "}
                        {reciboItem.pedido.contrato.fornecedor.cnpj}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 print:text-base">
                        Detalhes da Entrega
                      </h3>
                      <p className="text-sm print:text-xs">
                        <strong>Unidade:</strong>{" "}
                        {reciboItem.unidadeEducacional.nome}
                      </p>
                      <p className="text-sm print:text-xs">
                        <strong>Endereço:</strong>{" "}
                        {reciboItem.unidadeEducacional.endereco}
                      </p>
                      <p className="text-sm print:text-xs">
                        <strong>Telefone:</strong>{" "}
                        {reciboItem.unidadeEducacional.telefone}
                      </p>
                      <p className="text-sm print:text-xs">
                        <strong>Email:</strong>{" "}
                        {reciboItem.unidadeEducacional.email}
                      </p>
                      <p className="text-sm print:text-xs">
                        <strong>Data Entrega:</strong>{" "}
                        {new Date(reciboItem.dataEntrega).toLocaleDateString(
                          "pt-BR"
                        )}
                      </p>
                      <p className="text-sm print:text-xs">
                        <strong>Responsável Entrega:</strong>{" "}
                        {reciboItem.responsavelEntrega}
                      </p>
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-3 print:text-base print:mb-2">
                    Itens do Pedido
                  </h3>{" "}
                  {/* Título alterado para "Itens do Pedido" */}
                  <Table className="mb-6 print:mb-4 print:text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="print:py-1">Item</TableHead>
                        <TableHead className="print:py-1">
                          Qtd. Pedido
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reciboItem.itens.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium print:py-1">
                            {item.itemPedido?.itemContrato?.nome || "-"}
                          </TableCell>
                          <TableCell className="print:py-1">
                            {item.itemPedido?.quantidade ?? 0}{" "}
                            {item.itemPedido?.itemContrato?.unidadeMedida
                              ?.sigla || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Removido o totalizador da tabela de itens */}
                    </TableBody>
                  </Table>
                  {reciboItem.observacoes && (
                    <div className="mb-6 print:mb-4">
                      <h3 className="font-semibold text-lg mb-2 print:text-base">
                        Observações Gerais
                      </h3>
                      <p className="text-sm print:text-xs">
                        {reciboItem.observacoes}
                      </p>
                    </div>
                  )}
                  {/* Assinaturas e Foto */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 print:grid-cols-2 print:gap-4 print:mb-4">
                    {/* Assinatura do Fornecedor (Placeholder para assinatura física) */}
                    <div className="flex flex-col items-center">
                      <p className="signature-label">
                        _____________________________________
                      </p>
                      <h3 className="font-semibold text-lg mb-2 print:text-base">
                        Assinatura do Fornecedor
                      </h3>
                    </div>

                    {/* Assinatura do Recebedor (Placeholder para assinatura física ou texto) */}
                    <div className="flex flex-col items-center">
                      <p className="signature-label">
                        _____________________________________
                      </p>
                      <h3 className="font-semibold text-lg mb-2 print:text-base">
                        Assinatura do Recebedor
                      </h3>
                    </div>

                  </div>
                  {/* Área do QR Code */}
                  {reciboItem.qrcode && (
                    <div className="mt-6 text-center print:mt-4">
                      <h3 className="font-semibold text-lg mb-2 print:text-base">
                        QR Code do Recibo
                      </h3>
                      <img
                        src={reciboItem.qrcode}
                        alt="QR Code do Recibo"
                        className="w-32 h-32 mx-auto border border-gray-300 rounded-lg print:w-24 print:h-24 print:border-0"
                      />
                      <p className="text-sm text-muted-foreground mt-1 print:text-xs">
                        Escaneie para ver os detalhes online.
                      </p>
                    </div>
                  )}
                  {index < recibos.length - 1 && (
                    <div className="recibo-separator no-print my-8 h-px bg-gray-200"></div> /* Separador entre recibos na tela */
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
        <div className="p-6 border-t flex justify-end no-print">
          <Button onClick={handlePrintAll}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Todos os Recibos
          </Button>
        </div>
      </Card>
    </div>
  );
}

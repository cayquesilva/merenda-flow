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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  Package,
  Building2,
  User,
  FileText,
  Loader2,
  Search,
  Layers,
  Printer,
} from "lucide-react";
import { Pedido } from "@/types";
import { useEffect, useMemo, useState } from "react";

interface PedidoDetailDialogProps {
  pedidoId: string;
}

export function PedidoDetailDialog({ pedidoId }: PedidoDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [buscaItemOuEscola, setBuscaItemOuEscola] = useState("");

  useEffect(() => {
    if (open && pedidoId) {
      const fetchPedidoDetails = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(
            `${
              import.meta.env.VITE_API_URL || "http://localhost:3001"
            }/api/pedidos/${pedidoId}`
          );
          if (!response.ok)
            throw new Error("Falha ao buscar detalhes do pedido.");
          setPedido(await response.json());
        } catch (error) {
          console.error("Erro ao buscar detalhes:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPedidoDetails();
    } else if (!open) {
      setBuscaItemOuEscola("");
    }
  }, [open, pedidoId]);

  const consolidadoPorProduto = useMemo(() => {
    if (!pedido) return [];
    const mapa = new Map<
      string,
      {
        id: string;
        nome: string;
        sigla: string;
        valorUnitario: number;
        quantidadeTotal: number;
        totalEscolas: number;
        subtotal: number;
      }
    >();

    for (const item of pedido.itens) {
      const key = item.itemContrato.id;
      const atual = mapa.get(key);
      if (atual) {
        atual.quantidadeTotal += item.quantidade;
        atual.totalEscolas += 1;
        atual.subtotal += item.quantidade * item.itemContrato.valorUnitario;
      } else {
        mapa.set(key, {
          id: key,
          nome: item.itemContrato.nome,
          sigla: item.itemContrato.unidadeMedida.sigla,
          valorUnitario: item.itemContrato.valorUnitario,
          quantidadeTotal: item.quantidade,
          totalEscolas: 1,
          subtotal: item.quantidade * item.itemContrato.valorUnitario,
        });
      }
    }

    return Array.from(mapa.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR")
    );
  }, [pedido]);

  const itensFiltrados = useMemo(() => {
    if (!pedido) return [];
    const termo = buscaItemOuEscola.trim().toLowerCase();
    if (!termo) return pedido.itens.slice(0, 150);
    return pedido.itens
      .filter(
        (item) =>
          item.itemContrato.nome.toLowerCase().includes(termo) ||
          item.unidadeEducacional.nome.toLowerCase().includes(termo) ||
          item.unidadeEducacional.codigo.toLowerCase().includes(termo)
      )
      .slice(0, 200);
  }, [pedido, buscaItemOuEscola]);

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: "secondary",
      confirmado: "default",
      entregue: "default",
      cancelado: "destructive",
    } as const;

    const labels = {
      pendente: "Pendente",
      confirmado: "Confirmado",
      entregue: "Entregue",
      cancelado: "Cancelado",
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const handleGerarPDF = () => {
    if (!pedido) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const formatarMoeda = (valor: number) =>
      valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const statusLabels: Record<string, string> = {
      pendente: "Pendente",
      confirmado: "Confirmado",
      entregue: "Entregue",
      cancelado: "Cancelado",
    };

    const linhasConsolidado = consolidadoPorProduto
      .map(
        (prod, idx) => `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td>${prod.nome}</td>
            <td style="text-align: center;">${prod.totalEscolas}</td>
            <td style="text-align: right; font-weight: bold;">${prod.quantidadeTotal.toLocaleString("pt-BR")} ${prod.sigla}</td>
            <td style="text-align: right;">${formatarMoeda(prod.valorUnitario)}</td>
            <td style="text-align: right; font-weight: bold;">${formatarMoeda(prod.subtotal)}</td>
          </tr>
        `
      )
      .join("");

    const itensOrdenados = [...pedido.itens].sort((a, b) => {
      const cmpEscola = a.unidadeEducacional.nome.localeCompare(
        b.unidadeEducacional.nome,
        "pt-BR"
      );
      if (cmpEscola !== 0) return cmpEscola;
      return a.itemContrato.nome.localeCompare(b.itemContrato.nome, "pt-BR");
    });

    const linhasDistribuicao = itensOrdenados
      .map(
        (item) => `
          <tr>
            <td>${item.unidadeEducacional.nome} (${item.unidadeEducacional.codigo})</td>
            <td>${item.itemContrato.nome}</td>
            <td style="text-align: right;">${item.quantidade.toLocaleString("pt-BR")} ${item.itemContrato.unidadeMedida.sigla}</td>
            <td style="text-align: right;">${formatarMoeda(item.itemContrato.valorUnitario)}</td>
            <td style="text-align: right; font-weight: bold;">${formatarMoeda(item.quantidade * item.itemContrato.valorUnitario)}</td>
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Pedido ${pedido.numero}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              background-color: #ffffff !important;
              color: #000000 !important;
              margin: 0;
              padding: 16px;
              font-size: 11px;
              line-height: 1.4;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .page-container {
              max-width: 210mm;
              margin: 0 auto;
              background: #ffffff;
              color: #000000;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000000;
              padding-bottom: 10px;
              margin-bottom: 14px;
            }
            .header h1 {
              font-size: 18px;
              margin: 0 0 4px 0;
              text-transform: uppercase;
            }
            .header p {
              margin: 2px 0;
              font-size: 12px;
              color: #333333;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 16px;
            }
            .info-box {
              border: 1px solid #cccccc;
              border-radius: 4px;
              padding: 10px;
              background: #ffffff;
            }
            .info-box h3 {
              margin: 0 0 8px 0;
              font-size: 12px;
              border-bottom: 1px solid #eeeeee;
              padding-bottom: 4px;
              text-transform: uppercase;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
            }
            .info-label {
              color: #444444;
              font-weight: 600;
            }
            h2.section-title {
              font-size: 13px;
              text-transform: uppercase;
              margin: 16px 0 8px 0;
              padding-bottom: 4px;
              border-bottom: 1px solid #000000;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
              background: #ffffff;
              color: #000000;
            }
            th, td {
              border: 1px solid #cccccc;
              padding: 6px 8px;
              font-size: 10.5px;
            }
            th {
              background-color: #f3f4f6 !important;
              color: #000000 !important;
              font-weight: bold;
              text-align: left;
            }
            tr {
              page-break-inside: avoid;
            }
            .total-bar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 12px;
              border: 2px solid #000000;
              background-color: #f9fafb !important;
              font-size: 14px;
              font-weight: bold;
              margin-top: 8px;
              margin-bottom: 16px;
            }
            .footer {
              margin-top: 28px;
              padding-top: 12px;
              border-top: 1px solid #cccccc;
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              color: #444444;
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div class="header">
              <h1>Relatório de Pedido de Compra</h1>
              <p><strong>Pedido Nº:</strong> ${pedido.numero}</p>
              <p>Emitido em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
            </div>

            <div class="info-grid">
              <div class="info-box">
                <h3>Dados do Pedido</h3>
                <div class="info-row">
                  <span class="info-label">Número:</span>
                  <span>${pedido.numero}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Status:</span>
                  <span>${statusLabels[pedido.status] || pedido.status}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Data do Pedido:</span>
                  <span>${new Date(pedido.dataPedido).toLocaleDateString("pt-BR")}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Entrega Prevista:</span>
                  <span>${new Date(pedido.dataEntregaPrevista).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>

              <div class="info-box">
                <h3>Contrato e Fornecedor</h3>
                <div class="info-row">
                  <span class="info-label">Contrato:</span>
                  <span>${pedido.contrato.numero}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Fornecedor:</span>
                  <span>${pedido.contrato.fornecedor.nome}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">CNPJ:</span>
                  <span>${pedido.contrato.fornecedor.cnpj}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Total de Lançamentos:</span>
                  <span>${pedido.itens.length.toLocaleString("pt-BR")} entregas (${consolidadoPorProduto.length} produtos)</span>
                </div>
              </div>
            </div>

            <h2 class="section-title">1. Consolidado por Produto</h2>
            <table>
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">#</th>
                  <th>Produto</th>
                  <th style="width: 110px; text-align: center;">Escolas Atendidas</th>
                  <th style="width: 120px; text-align: right;">Qtd. Total</th>
                  <th style="width: 100px; text-align: right;">Valor Unit.</th>
                  <th style="width: 120px; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${linhasConsolidado}
              </tbody>
            </table>

            <div class="total-bar">
              <span>VALOR TOTAL DO PEDIDO:</span>
              <span>${formatarMoeda(pedido.valorTotal)}</span>
            </div>

            <h2 class="section-title">2. Distribuição por Unidade Educacional (${pedido.itens.length} registros)</h2>
            <table>
              <thead>
                <tr>
                  <th>Unidade Educacional</th>
                  <th>Produto</th>
                  <th style="width: 100px; text-align: right;">Quantidade</th>
                  <th style="width: 95px; text-align: right;">Valor Unit.</th>
                  <th style="width: 110px; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${linhasDistribuicao}
              </tbody>
            </table>

            <div class="footer">
              <span>Documento gerado pelo sistema de Gestão de Merenda Escolar</span>
              <span>Pedido ${pedido.numero}</span>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-3 w-3 mr-1" />
          Ver
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes do Pedido {pedido?.numero}
          </DialogTitle>
          <DialogDescription>
            Visualize o consolidado por produto e a distribuição por unidade
            educacional
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : pedido ? (
          <>
            <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package className="h-4 w-4" />
                      Informações do Pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Número:</span>
                      <span className="font-mono font-medium">{pedido.numero}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status:</span>
                      {getStatusBadge(pedido.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Data do Pedido:
                      </span>
                      <span>
                        {new Date(pedido.dataPedido).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Entrega Prevista:
                      </span>
                      <span>
                        {new Date(pedido.dataEntregaPrevista).toLocaleDateString(
                          "pt-BR"
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="h-4 w-4" />
                      Contrato e Fornecedor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contrato:</span>
                      <span className="font-mono">{pedido.contrato.numero}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fornecedor:</span>
                      <span className="font-medium truncate max-w-[240px]">
                        {pedido.contrato.fornecedor.nome}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CNPJ:</span>
                      <span className="font-mono text-xs">
                        {pedido.contrato.fornecedor.cnpj}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total de Lançamentos:
                      </span>
                      <span className="font-medium">
                        {pedido.itens.length.toLocaleString("pt-BR")} entregas (
                        {consolidadoPorProduto.length} produtos)
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs
                defaultValue="consolidado"
                className="flex-1 min-h-0 flex flex-col overflow-hidden"
              >
                <TabsList className="grid w-full grid-cols-2 shrink-0">
                  <TabsTrigger value="consolidado">
                    <Layers className="h-4 w-4 mr-2" />
                    Consolidado por Produto ({consolidadoPorProduto.length})
                  </TabsTrigger>
                  <TabsTrigger value="escolas">
                    <Building2 className="h-4 w-4 mr-2" />
                    Distribuição por Escola ({pedido.itens.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="consolidado"
                  className="mt-3 flex-1 min-h-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
                >
                  <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-card z-10">
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead className="text-right">
                              Escolas Atendidas
                            </TableHead>
                            <TableHead className="text-right">
                              Qtd. Consolidada
                            </TableHead>
                            <TableHead className="text-right">
                              Valor Unitário
                            </TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {consolidadoPorProduto.map((prod) => (
                            <TableRow key={prod.id}>
                              <TableCell className="font-medium">
                                {prod.nome}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {prod.totalEscolas}
                              </TableCell>
                              <TableCell className="text-right font-bold font-mono">
                                {prod.quantidadeTotal.toLocaleString("pt-BR")}{" "}
                                <span className="text-xs font-normal text-muted-foreground">
                                  {prod.sigla}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {prod.valorUnitario.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {prod.subtotal.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent
                  value="escolas"
                  className="mt-3 flex-1 min-h-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
                >
                  <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <CardHeader className="py-3 px-4 shrink-0 border-b">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Package className="h-4 w-4" />
                          Itens por Escola ({pedido.itens.length})
                        </CardTitle>
                        <div className="relative w-full sm:w-72">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar por escola ou produto..."
                            value={buscaItemOuEscola}
                            onChange={(e) => setBuscaItemOuEscola(e.target.value)}
                            className="pl-9 h-8"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 flex-1 min-h-0 overflow-y-auto space-y-2">
                      {itensFiltrados.map((item) => (
                        <Card key={item.id} className="p-3">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                            <div className="md:col-span-2">
                              <h4 className="font-medium text-sm">
                                {item.itemContrato.nome}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {item.unidadeEducacional.nome} (
                                  {item.unidadeEducacional.codigo})
                                </span>
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">
                                Quantidade:
                              </span>
                              <p className="font-medium text-sm">
                                {item.quantidade.toLocaleString("pt-BR")}{" "}
                                {item.itemContrato.unidadeMedida.sigla}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">
                                Subtotal
                              </div>
                              <div className="text-sm font-bold">
                                {(
                                  item.quantidade *
                                  item.itemContrato.valorUnitario
                                ).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                      {pedido.itens.length > itensFiltrados.length && (
                        <p className="text-xs text-center text-muted-foreground py-2">
                          Exibindo {itensFiltrados.length} de{" "}
                          {pedido.itens.length} registros. Utilize a busca acima
                          para filtrar uma escola ou produto específico.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="shrink-0 pt-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-medium">
                  Total Geral do Pedido:
                </span>
                <span className="text-xl font-bold text-primary">
                  {pedido.valorTotal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="default" onClick={handleGerarPDF}>
                  <Printer className="h-4 w-4 mr-2" />
                  Gerar PDF do Pedido
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Fechar
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : (
          <p>Não foi possível carregar os dados.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

// src/components/almoxarifado/EntradaDetailDialog.tsx

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  FileText,
  User,
  Calendar,
  Hash,
  Package,
  Loader2,
  Link2,
} from "lucide-react";
import { apiService } from "@/services/api";
import { AjustarEntradaDialog } from "./AjustarEntradaDialog"; // Importe o diálogo de ajuste
import { Badge } from "@/components/ui/badge";
import { Label } from "../ui/label";

// ALTERAÇÃO: Adicionado o campo 'status' à interface.
interface EntradaDetalhada {
  id: string;
  notaFiscal: string;
  dataEntrada: string;
  valorTotal: number | null;
  observacoes: string | null;
  status: string; // Campo 'status' adicionado
  fornecedor: { id: string; nome: string; cnpj: string };
  itens: {
    id: string;
    quantidade: number;
    valorUnitario: number | null;
    insumo: {
      nome: string;
      unidadeMedida: { id: string; sigla: string };
    };
  }[];
  entradasAjustadas: { id: string; notaFiscal: string; dataEntrada: string }[];
  entradaOriginal: {
    id: string;
    notaFiscal: string;
    dataEntrada: string;
  } | null;
}

interface EntradaDetailDialogProps {
  entradaId: string;
  onSuccess: () => void; // Adicionado para recarregar a lista após ajuste
}

export function EntradaDetailDialog({
  entradaId,
  onSuccess,
}: EntradaDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const [entrada, setEntrada] = useState<EntradaDetalhada | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Função para buscar os detalhes, agora reutilizável
  const fetchDetalhes = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await apiService.getEntradaAlmoxarifadoById(id);
      setEntrada(data);
    } catch (error) {
      console.error("Erro ao buscar detalhes da entrada:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDetalhes(entradaId);
    }
  }, [open, entradaId]);

  const getStatusBadge = (status: string) => {
    if (status === "ajustada") {
      return <Badge variant="destructive">Ajustada</Badge>;
    }
    return <Badge variant="default">Ativa</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-3 w-3 mr-1" />
          Ver Detalhes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da Entrada de Estoque
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre a entrada via Nota Fiscal #
            {entrada?.notaFiscal}.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : entrada ? (
          <div className="space-y-6 py-4">
            {/* Seção de Histórico */}
            {entrada.entradaOriginal && (
              <Card className="bg-muted/50">
                <CardContent className="p-3 text-sm">
                  Esta é uma versão ajustada da entrada original{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => fetchDetalhes(entrada.entradaOriginal!.id)}
                  >
                    #{entrada.entradaOriginal.notaFiscal}
                  </Button>
                  .
                </CardContent>
              </Card>
            )}
            {entrada.entradasAjustadas.length > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="p-3 text-sm">
                  Esta entrada foi ajustada e substituída pela versão{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() =>
                      fetchDetalhes(entrada.entradasAjustadas[0].id)
                    }
                  >
                    #{entrada.entradasAjustadas[0].notaFiscal}
                  </Button>
                  .
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Nota Fiscal
                </p>
                <p className="font-semibold">{entrada.notaFiscal}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Data da Entrada
                </p>
                <p className="font-semibold">
                  {new Date(entrada.dataEntrada).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Fornecedor
                </p>
                <p className="font-semibold">{entrada.fornecedor.nome}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <div>{getStatusBadge(entrada.status)}</div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4" /> Itens Recebidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Insumo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Valor Unitário</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entrada.itens.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.insumo.nome}
                        </TableCell>
                        <TableCell>
                          {item.quantidade} {item.insumo.unidadeMedida.sigla}
                        </TableCell>
                        <TableCell>
                          {item.valorUnitario
                            ? `R$ ${item.valorUnitario.toFixed(2)}`
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.valorUnitario
                            ? `R$ ${(
                                item.quantidade * item.valorUnitario
                              ).toFixed(2)}`
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {entrada.observacoes && (
              <div>
                <Label className="font-semibold">Observações</Label>
                <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted/50 rounded-md">
                  {entrada.observacoes}
                </p>
              </div>
            )}

            <div className="text-right font-bold text-lg border-t pt-4">
              Valor Total da Nota:{" "}
              {entrada.valorTotal
                ? `R$ ${entrada.valorTotal.toFixed(2)}`
                : "Não informado"}
            </div>
          </div>
        ) : (
          <p>Não foi possível carregar os dados.</p>
        )}

        <DialogFooter className="justify-between">
          <div>
            {/* O botão de ajuste só aparece se a entrada estiver 'ativa' */}
            {entrada && entrada.status === "ativo" && (
              <AjustarEntradaDialog
                entrada={entrada}
                onSuccess={() => {
                  onSuccess(); // Recarrega a lista principal
                  setOpen(false); // Fecha o diálogo de detalhe
                }}
              />
            )}
          </div>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

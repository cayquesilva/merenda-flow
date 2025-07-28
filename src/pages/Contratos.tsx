import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Plus,
  Eye,
  Calendar,
  DollarSign,
  Package,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { ContratoDialog } from "@/components/contratos/ContratoDialog";
import { Contrato } from "@/types";

// COMENTÁRIO: Hook customizado para "debouncing". Evita que uma chamada à API
// seja feita a cada tecla digitada na busca, esperando o utilizador parar de digitar.
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Contratos() {
  // COMENTÁRIO: Estados para controlar a UI, como o termo de busca e a atualização da lista.
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [refreshKey, setRefreshKey] = useState(0);

  // COMENTÁRIO: Estados para armazenar os dados vindos da API e controlar o carregamento.
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // COMENTÁRIO: Estados dedicados ao dialog de visualização de detalhes.
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(
    null
  );
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDialogLoading, setIsDialogLoading] = useState(false);

  // COMENTÁRIO: Função chamada pelo ContratoDialog após um sucesso (criação/edição) para forçar a atualização da lista.
  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // COMENTÁRIO: Efeito principal que busca a lista de contratos da API.
  // Ele é executado quando a página carrega e sempre que o termo de busca (debounced) ou a refreshKey mudam.
  useEffect(() => {
    const fetchContratos = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `http://localhost:3001/api/contratos?q=${debouncedSearchTerm}`
        );
        if (!response.ok) throw new Error("Falha ao buscar contratos da API.");
        const data = await response.json();
        setContratos(data);
      } catch (error) {
        console.error("Erro ao buscar contratos:", error);
        // Aqui poderia ser adicionado um toast de erro.
      } finally {
        setIsLoading(false);
      }
    };
    fetchContratos();
  }, [debouncedSearchTerm, refreshKey]);

  // COMENTÁRIO: Função para buscar os detalhes completos de um contrato específico.
  // É chamada apenas quando o utilizador clica no botão "olho".
  const handleViewDetails = async (contratoId: string) => {
    setIsViewDialogOpen(true);
    setIsDialogLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/contratos/${contratoId}`
      );
      if (!response.ok)
        throw new Error("Falha ao buscar detalhes do contrato.");
      const data = await response.json();
      setSelectedContrato(data);
    } catch (error) {
      console.error("Erro ao visualizar detalhes:", error);
      setSelectedContrato(null);
    } finally {
      setIsDialogLoading(false);
    }
  };

  // COMENTÁRIO: Funções de ajuda para a renderização, mantidas do seu ficheiro original.
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge variant="default">Ativo</Badge>;
      case "inativo":
        return <Badge variant="secondary">Inativo</Badge>;
      case "vencido":
        return <Badge variant="destructive">Vencido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  const getSaldoPercentual = (saldo: number, original: number) =>
    original > 0 ? (saldo / original) * 100 : 0;
  const getSaldoStatus = (percentual: number) => {
    if (percentual < 20) return "baixo";
    if (percentual < 50) return "medio";
    return "alto";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contratos</h2>
          <p className="text-muted-foreground">
            Gerencie os contratos de fornecimento de merenda
          </p>
        </div>
        <ContratoDialog onSuccess={handleSuccess} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número do contrato ou fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contratos Cadastrados</CardTitle>
          <CardDescription>
            {contratos.length} contrato(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center p-10">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : contratos.length > 0 ? (
                contratos.map((contrato) => (
                  <TableRow key={contrato.id}>
                    <TableCell className="font-medium">
                      {contrato.numero}
                    </TableCell>
                    <TableCell>{contrato.fornecedor.nome}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(contrato.dataInicio).toLocaleDateString(
                          "pt-BR"
                        )}{" "}
                        -{" "}
                        {new Date(contrato.dataFim).toLocaleDateString("pt-BR")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <DollarSign className="mr-1 h-3 w-3" />
                        {contrato.valorTotal.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(contrato.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Package className="mr-1 h-3 w-3" />
                        {(contrato as any)._count?.itens ??
                          contrato.itens.length}{" "}
                        itens
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(contrato.id)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <ContratoDialog
                          contrato={contrato}
                          onSuccess={handleSuccess}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center p-10">
                    Nenhum contrato encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Contrato</DialogTitle>
            <DialogDescription>
              Informações detalhadas e saldos do contrato
            </DialogDescription>
          </DialogHeader>
          {isDialogLoading ? (
            <div className="flex justify-center items-center p-20">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : selectedContrato ? (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Informações Gerais</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Número:</strong> {selectedContrato.numero}
                    </p>
                    <p>
                      <strong>Fornecedor:</strong>{" "}
                      {selectedContrato.fornecedor.nome}
                    </p>
                    <p>
                      <strong>CNPJ:</strong> {selectedContrato.fornecedor.cnpj}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {getStatusBadge(selectedContrato.status)}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Valores e Prazos</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Valor Total:</strong>{" "}
                      {selectedContrato.valorTotal.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                    <p>
                      <strong>Data Início:</strong>{" "}
                      {new Date(selectedContrato.dataInicio).toLocaleDateString(
                        "pt-BR"
                      )}
                    </p>
                    <p>
                      <strong>Data Fim:</strong>{" "}
                      {new Date(selectedContrato.dataFim).toLocaleDateString(
                        "pt-BR"
                      )}
                    </p>
                    <p>
                      <strong>Criado em:</strong>{" "}
                      {new Date(selectedContrato.createdAt).toLocaleDateString(
                        "pt-BR"
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Itens do Contrato</h4>
                <div className="space-y-3">
                  {selectedContrato.itens.map((item) => {
                    const percentual = getSaldoPercentual(
                      item.saldoAtual,
                      item.quantidadeOriginal
                    );
                    const status = getSaldoStatus(percentual);
                    return (
                      <Card key={item.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h5 className="font-medium">{item.nome}</h5>
                            <p className="text-sm text-muted-foreground">
                              Valor unitário:{" "}
                              {item.valorUnitario.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}{" "}
                              / {item.unidadeMedida.sigla}
                            </p>
                          </div>
                          {status === "baixo" && (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Saldo atual</span>
                            <span
                              className={
                                status === "baixo"
                                  ? "text-yellow-500 font-medium"
                                  : ""
                              }
                            >
                              {item.saldoAtual} / {item.quantidadeOriginal}{" "}
                              {item.unidadeMedida.sigla}
                            </span>
                          </div>
                          <Progress
                            value={percentual}
                            className={`h-2 ${
                              status === "baixo" ? "[&>div]:bg-yellow-500" : ""
                            }`}
                          />
                          <p className="text-xs text-muted-foreground">
                            {percentual.toFixed(1)}% do saldo original
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center p-10">
              Não foi possível carregar os detalhes do contrato.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

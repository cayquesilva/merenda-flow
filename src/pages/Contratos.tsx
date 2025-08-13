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
  Eye,
  Calendar,
  DollarSign,
  Package,
  AlertTriangle,
  Loader2,
  Edit,
  FileText, // Importar o ícone de Edit
} from "lucide-react";
import { ContratoDialog } from "@/components/contratos/ContratoDialog";
// Importar a interface Contrato do seu arquivo de tipos
import { Contrato } from "@/types";

// COMENTÁRIO: Nova interface para refletir a estrutura de dados retornada pela API /api/contratos
// Esta interface estende a interface base Contrato, mas sobrescreve 'fornecedor' e adiciona '_count'.
interface ContratoDetalhadoLista extends Omit<Contrato, "fornecedor"> {
  fornecedor: { nome: string }; // A API de lista de contratos retorna apenas o nome do fornecedor
  _count?: {
    // A API de lista de contratos inclui a contagem de itens
    itens: number;
  };
}

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
  // Usando a nova interface ContratoDetalhadoLista para tipar o array de contratos.
  const [contratos, setContratos] = useState<ContratoDetalhadoLista[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // COMENTÁRIO: Estados dedicados ao dialog de visualização de detalhes.
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(
    null
  );
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDialogLoading, setIsDialogLoading] = useState(false);

  // NOVO: Estado para armazenar o contrato completo para edição
  const [editContratoData, setEditContratoData] = useState<Contrato | null>(
    null
  );
  // NOVO: Estado para controlar a visibilidade do diálogo de edição
  const [isEditDialogVisible, setIsEditDialogVisible] = useState(false);

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
          `${
            import.meta.env.VITE_API_URL || "http://localhost:3001"
          }/api/contratos?q=${debouncedSearchTerm}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Falha ao buscar contratos da API."
          );
        }
        // Tipando os dados recebidos da API com ContratoDetalhadoLista[]
        const data: ContratoDetalhadoLista[] = await response.json();
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
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/contratos/${contratoId}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Falha ao buscar detalhes do contrato."
        );
      }
      // Aqui, esperamos o tipo Contrato completo, pois a rota retorna todos os detalhes.
      const data: Contrato = await response.json();
      setSelectedContrato(data);
    } catch (error) {
      console.error("Erro ao visualizar detalhes:", error);
      setSelectedContrato(null);
    } finally {
      setIsDialogLoading(false);
    }
  };

  // NOVO: Função para abrir o diálogo de edição e buscar os dados completos do contrato
  const handleOpenEditDialog = async (contratoId: string) => {
    setIsEditDialogVisible(true); // Abre o diálogo para mostrar o estado de carregamento
    setEditContratoData(null); // Limpa dados anteriores para indicar carregamento
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/contratos/${contratoId}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Falha ao carregar contrato para edição."
        );
      }
      const data: Contrato = await response.json(); // Busca o Contrato completo
      setEditContratoData(data); // Define o contrato completo para o diálogo
    } catch (error) {
      console.error("Erro ao carregar contrato para edição:", error);
      // Opcional: mostrar um toast de erro aqui
      setIsEditDialogVisible(false); // Fecha o diálogo se houver um erro
    }
  };

  // NOVO: Função para fechar o diálogo de edição
  const handleCloseEditDialog = () => {
    setIsEditDialogVisible(false);
    setEditContratoData(null); // Limpa os dados ao fechar
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
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Contratos
          </h2>
          <p className="text-muted-foreground">
            Gerencie os contratos de fornecimento de merenda
          </p>
        </div>
        {/* ContratoDialog para CRIAÇÃO (sem a prop 'contrato') */}
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
          {contratos.length === 0 && !isLoading ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">
                Nenhum contrato encontrado
              </h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Tente ajustar os filtros de busca"
                  : "Os contratos aparecerão aqui quando forem processados"}
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 mx-auto animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead className="w-[100px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratos.map((contrato) => (
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
                        {/* Acessando _count.itens diretamente */}
                        {contrato._count?.itens ?? contrato.itens.length} itens
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
                          Ver
                        </Button>
                        {/* Botão para abrir o diálogo de edição */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditDialog(contrato.id)} // Chama a nova função
                        >
                          <Edit className="h-3 w-3" /> {/* Ícone de edição */}
                          Editar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para visualização de detalhes (existente) */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-popover-foreground">
              Detalhes do Contrato
            </DialogTitle>
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
                              {item.unidadeMedida.sigla.toLowerCase() ===
                                "pct" &&
                                item.gramagemPorPacote && (
                                  <span className="ml-1 font-semibold">
                                    ({item.gramagemPorPacote}g)
                                  </span>
                                )}
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
                              <div className="space-y-1">
                                <div>
                                  Total: {item.saldoAtual} /{" "}
                                  {item.quantidadeOriginal}{" "}
                                  {item.unidadeMedida.sigla}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Creches: {item.saldoCreche} /{" "}
                                  {item.quantidadeCreche}{" "}
                                  {item.unidadeMedida.sigla}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Escolas: {item.saldoEscola} /{" "}
                                  {item.quantidadeEscola}{" "}
                                  {item.unidadeMedida.sigla}
                                </div>
                              </div>
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

      {/* NOVO: ContratoDialog para EDIÇÃO (controlado por estado) */}
      {/* Ele só será renderizado se isEditDialogVisible for true */}
      {isEditDialogVisible && (
        <ContratoDialog
          open={isEditDialogVisible} // Passa o estado de controle
          onOpenChange={handleCloseEditDialog} // Passa a função para fechar o diálogo
          contrato={editContratoData} // Passa o contrato completo (será null inicialmente, depois preenchido)
          onSuccess={() => {
            handleSuccess(); // Atualiza a lista após sucesso
            handleCloseEditDialog(); // Fecha o diálogo de edição
          }}
        />
      )}
    </div>
  );
}

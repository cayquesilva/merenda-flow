import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Box, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { NovaEntradaDialog } from "@/components/almoxarifado/NovaEntradaDialog";
import { Button } from "@/components/ui/button";

// COMENTÁRIO: Interface que define a estrutura de uma Entrada que vem da API.
export interface Entrada {
  id: string;
  notaFiscal: string;
  dataEntrada: string;
  valorTotal: number | null;
  fornecedor: {
    nome: string;
  };
  _count: {
    itens: number;
  };
}

// COMENTÁRIO: Hook para "debouncing", que evita chamadas excessivas à API ao digitar.
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function EntradasAlmoxarifado() {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { toast } = useToast();

  // COMENTÁRIO: Efeito que busca os dados da API sempre que a busca ou a refreshKey mudam.
  useEffect(() => {
    setIsLoading(true);
    apiService
      .getEntradasAlmoxarifado(debouncedSearchTerm)
      .then(setEntradas)
      .catch((err) => {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as entradas de estoque.",
          variant: "destructive",
        });
        console.error(err);
      })
      .finally(() => setIsLoading(false));
  }, [debouncedSearchTerm, refreshKey, toast]);

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Entradas no Almoxarifado
          </h2>
          <p className="text-muted-foreground">
            Registre e consulte as notas fiscais de insumos recebidos.
          </p>
        </div>
        <NovaEntradaDialog onSuccess={handleSuccess} />
      </div>

      {/* COMENTÁRIO: Card de filtros com a busca */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por Nº da Nota ou Fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entradas Registradas</CardTitle>
          <CardDescription>
            {entradas.length} registro(s) encontrado(s).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 mx-auto animate-spin" />
            </div>
          ) : entradas.length === 0 ? (
            <div className="text-center py-8">
              <Box className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">
                Nenhuma entrada encontrada
              </h3>
              <p className="text-muted-foreground">
                Clique em "Registrar Entrada" para começar.
              </p>
            </div>
          ) : (
            // COMENTÁRIO: Tabela para exibir as entradas de estoque.
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nota Fiscal</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data da Entrada</TableHead>
                  <TableHead>Nº de Itens</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entradas.map((entrada) => (
                  <TableRow key={entrada.id}>
                    <TableCell className="font-mono">
                      {entrada.notaFiscal}
                    </TableCell>
                    <TableCell>{entrada.fornecedor.nome}</TableCell>
                    <TableCell>
                      {new Date(entrada.dataEntrada).toLocaleDateString(
                        "pt-BR"
                      )}
                    </TableCell>
                    <TableCell>{entrada._count.itens}</TableCell>
                    <TableCell>
                      {entrada.valorTotal
                        ? `R$ ${entrada.valorTotal.toFixed(2)}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

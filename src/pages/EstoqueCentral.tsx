import { useEffect, useState } from "react";
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
import { Loader2, Warehouse, Search, Send, QrCode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { GerarGuiaDialog } from "@/components/almoxarifado/GerarGuiaDialog";
import { Button } from "@/components/ui/button";

// COMENTÁRIO: Interface que define a estrutura de um item no Estoque Central, conforme retornado pela API.
export interface ItemEstoqueCentral {
  id: string; // Este é o ID do registro de EstoqueCentral
  quantidadeAtual: number;
  insumo: {
    id: string; // Este é o ID do Insumo (do catálogo)
    nome: string;
    unidadeMedida: { sigla: string };
  };
}

// COMENTÁRIO: Hook customizado para "debouncing", que evita chamadas excessivas à API ao digitar na busca.
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function EstoqueCentral() {
  const [estoque, setEstoque] = useState<ItemEstoqueCentral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  // COMENTÁRIO: Efeito que busca os dados do estoque central na API.
  // É acionado sempre que o termo de busca muda (com debounce) ou quando uma ação (como gerar uma guia) é bem-sucedida.
  useEffect(() => {
    setIsLoading(true);
    apiService
      .getEstoqueCentral(debouncedSearchTerm)
      .then(setEstoque)
      .catch(() =>
        toast({
          title: "Erro",
          description: "Não foi possível carregar o estoque central.",
          variant: "destructive",
        })
      )
      .finally(() => setIsLoading(false));
  }, [debouncedSearchTerm, refreshKey, toast]);

  // COMENTÁRIO: Função de callback passada para os diálogos para recarregar os dados após uma operação de sucesso.
  const handleSuccess = () => setRefreshKey((prev) => prev + 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Estoque Central
          </h2>
          <p className="text-muted-foreground">
            Visualize o estoque e envie insumos para as unidades.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <QrCode className="mr-2 h-4 w-4" />
            Gerar Catálogo QR Code
          </Button>
          <GerarGuiaDialog onSuccess={handleSuccess} />
        </div>
      </div>

      {/* Card de Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros e Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do insumo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Card da Tabela de Estoque */}
      <Card>
        <CardHeader>
          <CardTitle>Itens no Estoque Central</CardTitle>
          <CardDescription>
            {estoque.length} item(ns) com saldo positivo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            </div>
          ) : estoque.length === 0 ? (
            <div className="text-center py-8">
              <Warehouse className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Estoque Central Vazio</h3>
              <p className="text-muted-foreground">
                Use a tela de "Registrar Entradas" para adicionar insumos ao
                estoque.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead className="text-right w-[200px]">
                    Quantidade Disponível
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estoque.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.insumo.nome}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.quantidadeAtual} {item.insumo.unidadeMedida.sigla}
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

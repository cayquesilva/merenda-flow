import { useEffect, useState } from "react";
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
  Search,
  Plus,
  Eye,
  Edit,
  Phone,
  Mail,
  MapPin,
  Building2,
  Loader2,
} from "lucide-react";
import { unidadesEducacionais } from "@/data/mockData";
import { UnidadeDialog } from "@/components/unidades/UnidadeDialog";
import { formatTelefone } from "@/lib/utils";

// COMENTÁRIO: Tipo para os dados que vêm da API.
interface UnidadeEducacional {
  id: string;
  nome: string;
  codigo: string;
  endereco: string | null;
  telefone: string | null;
  email: string;
  ativo: boolean;
}

// COMENTÁRIO: Hook para "debouncing", que evita chamadas excessivas à API ao digitar na busca.
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Unidades() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [refreshKey, setRefreshKey] = useState(0);

  // COMENTÁRIO: Estados para armazenar os dados da API e controlar o carregamento.
  const [unidades, setUnidades] = useState<UnidadeEducacional[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // COMENTÁRIO: Efeito que busca a lista de unidades da API.
  useEffect(() => {
    const fetchUnidades = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `http://localhost:3001/api/unidades?q=${debouncedSearchTerm}`
        );
        if (!response.ok) throw new Error("Falha ao buscar unidades");
        const data = await response.json();
        setUnidades(data);
      } catch (error) {
        console.error("Erro ao buscar fornecedores:", error);
        // Aqui poderia ser adicionado um toast de erro.
      } finally {
        setIsLoading(false);
      }
    };
    fetchUnidades();
  }, [debouncedSearchTerm, refreshKey]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Unidades Educacionais
          </h2>
          <p className="text-muted-foreground">
            Gerencie as unidades educacionais do sistema
          </p>
        </div>
        <UnidadeDialog onSuccess={handleSuccess} />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, código ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Unidades */}
      <Card>
        <CardHeader>
          <CardTitle>Unidades Cadastradas</CardTitle>
          <CardDescription>
            {unidades.length} unidade(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unidades.length === 0 && !isLoading ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">
                Nenhuma unidade encontrada
              </h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Tente ajustar os filtros de busca"
                  : "As unidades aparecerão aqui quando forem processadas"}
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unidades.map((unidade) => (
                  <TableRow key={unidade.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">{unidade.nome}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {unidade.codigo}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Phone className="mr-1 h-3 w-3" />
                          {formatTelefone(unidade.telefone)}
                        </div>
                        <div className="flex items-center text-sm">
                          <Mail className="mr-1 h-3 w-3" />
                          {unidade.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <MapPin className="mr-1 h-3 w-3" />
                        <span className="truncate max-w-[200px]">
                          {unidade.endereco}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={unidade.ativo ? "default" : "secondary"}>
                        {unidade.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <UnidadeDialog
                          unidade={unidade}
                          onSuccess={handleSuccess}
                        />
                      </div>
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

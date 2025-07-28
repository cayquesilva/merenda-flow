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
import { Search, Eye, Phone, Mail, MapPin } from "lucide-react";
import { FornecedorDialog } from "@/components/fornecedores/FornecedorDialog";
import { formatCNPJ, formatTelefone } from "@/lib/utils";

// NOVO: Definimos o tipo Fornecedor aqui, já que não vem mais do mock.
export interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string;
  telefone: string | null;
  email: string;
  endereco: string | null;
  ativo: boolean;
  createdAt: string;
}

// NOVO: Hook customizado para "debouncing". Evita que uma chamada à API
// seja feita a cada tecla digitada, esperando o usuário parar de digitar.
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function Fornecedores() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // Aguarda 300ms após o usuário parar de digitar

  // NOVO: Estado para armazenar os fornecedores vindos da API
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  // NOVO: Estado para controlar as mensagens de carregamento e erro
  const [status, setStatus] = useState("Carregando fornecedores...");

  // ALTERADO: O refreshKey agora é usado para disparar a busca de dados novamente.
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // NOVO: useEffect para buscar os dados da API
  useEffect(() => {
    const fetchFornecedores = async () => {
      setStatus("Carregando fornecedores...");
      try {
        // A busca é feita na rota que criamos no backend.
        // Se houver um termo de busca, ele é adicionado como query param `?q=...`
        const response = await fetch(
          `http://localhost:3001/api/fornecedores?q=${debouncedSearchTerm}`
        );
        if (!response.ok) {
          throw new Error("A resposta da rede não foi OK");
        }
        const data = await response.json();
        setFornecedores(data);

        if (data.length === 0) {
          setStatus("Nenhum fornecedor encontrado.");
        }
      } catch (error) {
        console.error("Erro ao buscar fornecedores:", error);
        setStatus(
          `Falha ao carregar fornecedores. Verifique se a API está rodando.`
        );
      }
    };

    fetchFornecedores();
  }, [debouncedSearchTerm, refreshKey]); // A busca é refeita quando a busca (debounced) ou a refreshKey mudam.

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fornecedores</h2>
          <p className="text-muted-foreground">
            Gerencie os fornecedores cadastrados no sistema
          </p>
        </div>
        <FornecedorDialog onSuccess={handleSuccess} />
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
              placeholder="Buscar por nome, CNPJ ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle>Fornecedores Cadastrados</CardTitle>
          <CardDescription>
            {fornecedores.length} fornecedor(es) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fornecedores.length > 0 ? (
                fornecedores.map((fornecedor) => (
                  <TableRow key={fornecedor.id}>
                    <TableCell className="font-medium">
                      {fornecedor.nome}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatCNPJ(fornecedor.cnpj)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Phone className="mr-1 h-3 w-3" />
                          {formatTelefone(fornecedor.telefone)}
                        </div>
                        <div className="flex items-center text-sm">
                          <Mail className="mr-1 h-3 w-3" />
                          {fornecedor.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <MapPin className="mr-1 h-3 w-3" />
                        <span className="truncate max-w-[200px]">
                          {fornecedor.endereco}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={fornecedor.ativo ? "default" : "secondary"}
                      >
                        {fornecedor.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <FornecedorDialog
                          fornecedor={fornecedor}
                          onSuccess={handleSuccess}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    {status}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Phone,
  Mail,
  MapPin,
  Building2,
  Loader2,
  Info,
} from "lucide-react";
import { UnidadeDialog } from "@/components/unidades/UnidadeDialog";
import { ImportDialog } from "@/components/unidades/ImportDialog";
import { UnidadeDetailDialog } from "@/components/unidades/UnidadeDetailDialog";

import { formatTelefone } from "@/lib/utils";
import { apiService } from "@/services/api";

// COMENTÁRIO: Tipo para os dados que vêm da API.
interface UnidadeEducacional {
  id: string;
  nome: string;
  codigo: string;
  endereco: string | null;
  telefone: string | null;
  email: string;
  ativo: boolean;
  estudantesBercario: number;
  estudantesMaternal: number;
  estudantesPreEscola: number;
  estudantesRegular: number;
  estudantesIntegral: number;
  estudantesEja: number;
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
  const [ultimaImportacao, setUltimaImportacao] = useState<string | null>(null);

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // COMENTÁRIO: Efeito que busca a lista de unidades da API.
  useEffect(() => {
    const fetchPageData = async () => {
      setIsLoading(true);
      try {
        // Usa o apiService para fazer as chamadas em paralelo
        const [unidadesData, importacaoData] = await Promise.all([
          apiService.getUnidades(debouncedSearchTerm),
          apiService.getUnidadesUltimaImportacao(),
        ]);

        setUnidades(unidadesData);
        setUltimaImportacao(importacaoData.ultimaImportacao);
      } catch (error) {
        console.error("Erro ao buscar dados das unidades:", error);
        // Adicionar um toast de erro aqui seria uma boa prática
      } finally {
        setIsLoading(false);
      }
    };
    fetchPageData();
  }, [debouncedSearchTerm, refreshKey]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Unidades Educacionais
          </h2>
          <p className="text-muted-foreground">
            Gerencie as unidades educacionais do sistema
          </p>
          <div className="flex items-center text-xs text-muted-foreground mt-2">
            <Info className="h-3 w-3 mr-1.5" />
            {ultimaImportacao ? (
              <span>
                Dados da planilha atualizados em:{" "}
                <strong className="text-foreground">
                  {new Date(ultimaImportacao).toLocaleString("pt-BR", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </strong>
              </span>
            ) : (
              <span>Nenhuma importação de planilha foi realizada ainda.</span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <ImportDialog onSuccess={handleSuccess} />
          <UnidadeDialog onSuccess={handleSuccess} />
        </div>
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
                  <TableHead className="w-[100px] text-center">Ações</TableHead>
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
                        <UnidadeDetailDialog unidade={unidade} />
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

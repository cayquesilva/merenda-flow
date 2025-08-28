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
import { Loader2, Package, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiService } from "@/services/api";
import { InsumoDialog } from "@/components/almoxarifado/InsumoDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Interface para o Insumo
export interface Insumo {
  id: string;
  nome: string;
  quantidade: number;
  saldo: number;
  valorUnitario: number;
  unidadeMedida: { id: string; sigla: string };
  contrato: { id: string; numero: string };
}

// Hook de Debounce
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Insumos() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    apiService
      .getInsumos(debouncedSearchTerm)
      .then(setInsumos)
      .catch((err) =>
        toast({
          title: "Erro",
          description: "Não foi possível carregar os insumos.",
          variant: "destructive",
        })
      )
      .finally(() => setIsLoading(false));
  }, [debouncedSearchTerm, refreshKey, toast]);

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.deleteInsumo(id);
      toast({ title: "Sucesso", description: "Insumo deletado com sucesso." });
      handleSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível deletar o insumo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Insumos do Almoxarifado
          </h2>
          <p className="text-muted-foreground">
            Gerencie os itens dos contratos de almoxarifado
          </p>
        </div>
        <InsumoDialog onSuccess={handleSuccess} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle>Insumos Cadastrados</CardTitle>
          <CardDescription>
            {insumos.length} item(ns) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 mx-auto animate-spin" />
            </div>
          ) : insumos.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhum insumo encontrado</h3>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Quantidade Total</TableHead>
                  <TableHead>Saldo Atual</TableHead>
                  <TableHead>Valor Unitário</TableHead>
                  <TableHead className="w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insumos.map((insumo) => (
                  <TableRow key={insumo.id}>
                    <TableCell className="font-medium">{insumo.nome}</TableCell>
                    <TableCell>{insumo.contrato.numero}</TableCell>
                    <TableCell>
                      {insumo.quantidade} {insumo.unidadeMedida.sigla}
                    </TableCell>
                    <TableCell>
                      {insumo.saldo} {insumo.unidadeMedida.sigla}
                    </TableCell>
                    <TableCell>R$ {insumo.valorUnitario.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <InsumoDialog
                          insumo={insumo}
                          onSuccess={handleSuccess}
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Você tem certeza?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso irá
                                deletar permanentemente o insumo.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(insumo.id)}
                              >
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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

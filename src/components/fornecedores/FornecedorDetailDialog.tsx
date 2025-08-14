// src/components/fornecedores/FornecedorDetailDialog.tsx

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
import { Label } from "@/components/ui/label";
import {
  Eye,
  Building,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatCNPJ, formatTelefone } from "@/lib/utils";

// Tipagem para os dados completos do fornecedor, incluindo contratos
interface Contrato {
  id: string;
  numero: string;
  status: string; // 'ativo', 'inativo', 'concluido'
  dataFim: string;
}

interface FornecedorCompleto {
  id: string;
  nome: string;
  cnpj: string;
  telefone: string | null;
  email:string;
  endereco: string | null;
  ativo: boolean;
  contratos: Contrato[];
}

interface FornecedorDetailDialogProps {
  fornecedorId: string;
}

export function FornecedorDetailDialog({ fornecedorId }: FornecedorDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const [fornecedor, setFornecedor] = useState<FornecedorCompleto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const fetchDetalhes = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(
            `${
              import.meta.env.VITE_API_URL || "http://localhost:3001"
            }/api/fornecedores/${fornecedorId}`
          );
          if (!response.ok) {
            throw new Error("Falha ao carregar detalhes do fornecedor.");
          }
          const data = await response.json();
          setFornecedor(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Ocorreu um erro.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchDetalhes();
    }
  }, [open, fornecedorId]);

  const renderContratos = (status: string, titulo: string) => {
    const contratosFiltrados =
      fornecedor?.contratos.filter((c) => c.status === status) || [];

    if (contratosFiltrados.length === 0) return null;

    return (
      <div>
        <h4 className="font-semibold text-md mb-2">{titulo}</h4>
        <div className="space-y-2">
          {contratosFiltrados.map((contrato) => (
            <Link key={contrato.id} to={`/contratos`}> {/* Ajuste o link se houver uma página de detalhe de contrato */}
              <Button variant="outline" className="w-full justify-start h-auto py-2">
                <FileText className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <p className="font-medium">{contrato.numero}</p>
                  <p className="text-xs text-muted-foreground">
                    Vence em: {new Date(contrato.dataFim).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-3 w-3" />
          Ver
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Building className="h-6 w-6 mr-2" />
            Detalhes do Fornecedor
          </DialogTitle>
          {fornecedor && (
             <DialogDescription>
                Informações completas sobre {fornecedor.nome}.
             </DialogDescription>
          )}
        </DialogHeader>

        {isLoading && (
            <div className="flex justify-center items-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )}

        {error && (
            <div className="text-center p-10 text-destructive flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8" />
                <p>{error}</p>
            </div>
        )}

        {fornecedor && !isLoading && (
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
               <div>
                 <Label>Nome</Label>
                 <p className="font-semibold">{fornecedor.nome}</p>
               </div>
                <div>
                    <Label>CNPJ</Label>
                    <p className="font-mono">{formatCNPJ(fornecedor.cnpj)}</p>
                </div>
                <div>
                    <Label>Email</Label>
                    <p>{fornecedor.email}</p>
                </div>
                <div>
                    <Label>Telefone</Label>
                    <p>{formatTelefone(fornecedor.telefone)}</p>
                </div>
                <div className="md:col-span-2">
                    <Label>Endereço</Label>
                    <p>{fornecedor.endereco || "Não informado"}</p>
                </div>
            </div>
            
            <div>
                <h3 className="text-lg font-bold mb-3">Contratos Vinculados</h3>
                <div className="space-y-4">
                    {renderContratos("ativo", "Ativos")}
                    {renderContratos("inativo", "Inativos")}
                    {renderContratos("concluido", "Concluídos")}

                    {fornecedor.contratos.length === 0 && (
                        <p className="text-muted-foreground text-sm">Nenhum contrato encontrado para este fornecedor.</p>
                    )}
                </div>
            </div>
          </div>
        )}
        <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import InputMask from "react-input-mask";
import { unmask } from "@/lib/utils";

// NOVO: O tipo pode ser importado da página pai ou definido aqui.
interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string;
  telefone: string | null;
  email: string;
  endereco: string | null;
  ativo: boolean;
}

interface FornecedorDialogProps {
  fornecedor?: Fornecedor;
  onSuccess: () => void;
}

export function FornecedorDialog({
  fornecedor,
  onSuccess,
}: FornecedorDialogProps) {
  const [open, setOpen] = useState(false);
  // NOVO: Estado para controlar o carregamento durante o envio do formulário
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    telefone: "",
    email: "",
    endereco: "",
    ativo: true,
  });
  const { toast } = useToast();

  const isEdicao = !!fornecedor;

  // NOVO: useEffect para popular o formulário quando for edição
  useEffect(() => {
    if (isEdicao && fornecedor) {
      setFormData({
        nome: fornecedor.nome || "",
        cnpj: fornecedor.cnpj || "",
        telefone: fornecedor.telefone || "",
        email: fornecedor.email || "",
        endereco: fornecedor.endereco || "",
        ativo: fornecedor.ativo ?? true,
      });
    }
  }, [fornecedor, isEdicao, open]);

  // ALTERADO: A função handleSubmit agora é assíncrona e se comunica com a API.
  const handleSubmit = async () => {
    if (
      !formData.nome.trim() ||
      !formData.cnpj.trim() ||
      !formData.email.trim()
    ) {
      toast({
        title: "Erro de Validação",
        description: "Os campos Nome, CNPJ e Email são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true); // Inicia o estado de carregamento

    const payload = {
      ...formData,
      cnpj: unmask(formData.cnpj),
      telefone: unmask(formData.telefone),
    };

    try {
      const url = isEdicao
        ? `http://localhost:3001/api/fornecedores/${fornecedor.id}`
        : "http://localhost:3001/api/fornecedores";

      const method = isEdicao ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Tenta extrair uma mensagem de erro do corpo da resposta da API
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao salvar o fornecedor.");
      }

      toast({
        title: `Sucesso!`,
        description: `Fornecedor ${formData.nome} foi ${
          isEdicao ? "atualizado" : "cadastrado"
        }.`,
      });

      setOpen(false); // Fecha o dialog
      onSuccess(); // Atualiza a lista na página principal
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
      toast({
        title: "Erro ao Salvar",
        description: error.message || "Não foi possível completar a operação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false); // Finaliza o estado de carregamento
    }
  };

  const resetForm = () => {
    setFormData({
      nome: fornecedor?.nome || "",
      cnpj: fornecedor?.cnpj || "",
      telefone: fornecedor?.telefone || "",
      email: fornecedor?.email || "",
      endereco: fornecedor?.endereco || "",
      ativo: fornecedor?.ativo ?? true,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant={isEdicao ? "outline" : "default"}
          size={isEdicao ? "sm" : "default"}
        >
          {isEdicao ? (
            <Edit className="h-3 w-3" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isEdicao ? "" : "Novo Fornecedor"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdicao ? "Editar Fornecedor" : "Novo Fornecedor"}
          </DialogTitle>
          <DialogDescription>
            {isEdicao
              ? "Edite as informações do fornecedor"
              : "Cadastre um novo fornecedor no sistema"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Nome do fornecedor"
              />
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ *</Label>
              <InputMask
                mask="99.999.999/9999-99"
                value={formData.cnpj}
                onChange={(e) =>
                  setFormData({ ...formData, cnpj: e.target.value })
                }
                disabled={isSubmitting}
              >
                {(inputProps: React.ComponentProps<'input'>) => (
                  <Input
                    {...inputProps}
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                  />
                )}
              </InputMask>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <InputMask
                mask="(99) 99999-9999"
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({ ...formData, telefone: e.target.value })
                }
                disabled={isSubmitting}
              >
                {(inputProps: React.ComponentProps<'input'>) => (
                  <Input
                    {...inputProps}
                    id="telefone"
                    placeholder="(00) 00000-0000"
                  />
                )}
              </InputMask>
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="fornecedor@email.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Textarea
              id="endereco"
              value={formData.endereco}
              onChange={(e) =>
                setFormData({ ...formData, endereco: e.target.value })
              }
              placeholder="Endereço completo do fornecedor"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, ativo: checked })
              }
            />
            <Label htmlFor="ativo">Fornecedor ativo</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting
              ? isEdicao
                ? "Atualizando..."
                : "Cadastrando..."
              : isEdicao
              ? "Atualizar"
              : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
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
// COMENTÁRIO: Novas importações para a máscara
import InputMask from "react-input-mask";
import React from "react";
import { unmask } from "@/lib/utils"; // Assumindo que a função unmask está em lib/utils

// COMENTÁRIO: Tipo para os dados da entidade.
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
  estudantesRegular: number;
  estudantesIntegral: number;
  estudantesEja: number;
}

interface UnidadeDialogProps {
  unidade?: UnidadeEducacional;
  onSuccess: () => void;
}

export function UnidadeDialog({ unidade, onSuccess }: UnidadeDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const isEdicao = !!unidade;

  // COMENTÁRIO: Estados para o formulário e para controlar o envio.
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    telefone: "",
    email: "",
    endereco: "",
    ativo: true,
    estudantesBercario: 0,
    estudantesMaternal: 0,
    estudantesRegular: 0,
    estudantesIntegral: 0,
    estudantesEja: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // COMENTÁRIO: Efeito para popular o formulário quando está em modo de edição.
  useEffect(() => {
    if (isEdicao && unidade) {
      setFormData({
        nome: unidade.nome,
        codigo: unidade.codigo,
        telefone: unidade.telefone || "",
        email: unidade.email,
        endereco: unidade.endereco || "",
        ativo: unidade.ativo,
        estudantesBercario: unidade.estudantesBercario,
        estudantesMaternal: unidade.estudantesMaternal,
        estudantesRegular: unidade.estudantesRegular,
        estudantesIntegral: unidade.estudantesIntegral,
        estudantesEja: unidade.estudantesEja,
      });
    } else {
      // COMENTÁRIO: Reseta o formulário para um estado limpo ao fechar ou em modo de criação
      setFormData({
        nome: "",
        codigo: "",
        telefone: "",
        email: "",
        endereco: "",
        ativo: true,
        estudantesBercario: 0,
        estudantesMaternal: 0,
        estudantesRegular: 0,
        estudantesIntegral: 0,
        estudantesEja: 0,
      });
    }
  }, [unidade, isEdicao, open]); // Dependência 'open' adicionada para resetar ao abrir em modo de criação

  const handleSubmit = async () => {
    if (
      !formData.nome.trim() ||
      !formData.codigo.trim() ||
      !formData.email.trim()
    ) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios (*)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEdicao
        ? `${
            import.meta.env.VITE_API_URL || "http://localhost:3001"
          }/api/unidades/${unidade?.id}`
        : `${
            import.meta.env.VITE_API_URL || "http://localhost:3001"
          }/api/unidades`;
      const method = isEdicao ? "PUT" : "POST";

      // COMENTÁRIO: Prepara o payload para a API, incluindo todos os campos do formulário.
      const payload = {
        ...formData,
        telefone: unmask(formData.telefone),
        // Adicionando os campos de estudantes diretamente ao payload
        estudantesBercario: formData.estudantesBercario,
        estudantesMaternal: formData.estudantesMaternal,
        estudantesRegular: formData.estudantesRegular,
        estudantesIntegral: formData.estudantesIntegral,
        estudantesEja: formData.estudantesEja,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Falha ao ${isEdicao ? "atualizar" : "cadastrar"} a unidade.`
        );
      }

      toast({
        title: "Sucesso!",
        description: `Unidade ${formData.nome} foi ${
          isEdicao ? "atualizada" : "cadastrada"
        } com sucesso.`,
      });
      setOpen(false);
      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro desconhecido.";
      toast({
        title: "Erro ao Salvar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: unidade?.nome || "",
      codigo: unidade?.codigo || "",
      telefone: unidade?.telefone || "",
      email: unidade?.email || "",
      endereco: unidade?.endereco || "",
      ativo: unidade?.ativo ?? true,
      estudantesBercario: unidade?.estudantesBercario || 0,
      estudantesMaternal: unidade?.estudantesMaternal || 0,
      estudantesRegular: unidade?.estudantesRegular || 0,
      estudantesIntegral: unidade?.estudantesIntegral || 0,
      estudantesEja: unidade?.estudantesEja || 0,
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
          {isEdicao ? "" : "Nova Unidade"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-popover-foreground">
            {isEdicao
              ? "Editar Unidade Educacional"
              : "Nova Unidade Educacional"}
          </DialogTitle>
          <DialogDescription>
            {isEdicao
              ? "Edite as informações da unidade"
              : "Cadastre uma nova unidade educacional no sistema"}
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
                placeholder="Nome da unidade educacional"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) =>
                  setFormData({ ...formData, codigo: e.target.value })
                }
                placeholder="Código da unidade"
                disabled={isSubmitting}
              />
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
                {(inputProps: React.ComponentProps<"input">) => (
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
                placeholder="unidade@educacao.gov.br"
                disabled={isSubmitting}
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
              placeholder="Endereço completo da unidade educacional"
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, ativo: checked })
              }
              disabled={isSubmitting}
            />
            <Label htmlFor="ativo">Unidade ativa</Label>
          </div>

          <div>
            <h4 className="font-medium mb-3">Estudantes Matriculados</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="estudantesBercario">Berçário</Label>
                <Input
                  id="estudantesBercario"
                  type="number"
                  min="0"
                  value={formData.estudantesBercario}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estudantesBercario: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="estudantesMaternal">Maternal</Label>
                <Input
                  id="estudantesMaternal"
                  type="number"
                  min="0"
                  value={formData.estudantesMaternal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estudantesMaternal: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="estudantesRegular">Turmas Regulares</Label>
                <Input
                  id="estudantesRegular"
                  type="number"
                  min="0"
                  value={formData.estudantesRegular}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estudantesRegular: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="estudantesIntegral">Turmas Integrais</Label>
                <Input
                  id="estudantesIntegral"
                  type="number"
                  min="0"
                  value={formData.estudantesIntegral}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estudantesIntegral: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="estudantesEja">EJA</Label>
                <Input
                  id="estudantesEja"
                  type="number"
                  min="0"
                  value={formData.estudantesEja}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estudantesEja: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Informe a quantidade de estudantes matriculados em cada modalidade
              para cálculo automático de percápita.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdicao ? "Atualizar" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

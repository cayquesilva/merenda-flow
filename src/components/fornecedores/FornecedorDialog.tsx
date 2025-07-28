import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit } from "lucide-react";
import { Fornecedor } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface FornecedorDialogProps {
  fornecedor?: Fornecedor;
  onSuccess: () => void;
}

export function FornecedorDialog({ fornecedor, onSuccess }: FornecedorDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: fornecedor?.nome || "",
    cnpj: fornecedor?.cnpj || "",
    telefone: fornecedor?.telefone || "",
    email: fornecedor?.email || "",
    endereco: fornecedor?.endereco || "",
    ativo: fornecedor?.ativo ?? true
  });
  const { toast } = useToast();

  const isEdicao = !!fornecedor;

  const handleSubmit = () => {
    if (!formData.nome.trim() || !formData.cnpj.trim() || !formData.email.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Simular salvamento
    toast({
      title: isEdicao ? "Fornecedor atualizado!" : "Fornecedor cadastrado!",
      description: `${formData.nome} foi ${isEdicao ? 'atualizado' : 'cadastrado'} com sucesso`,
    });

    setOpen(false);
    onSuccess();
  };

  const resetForm = () => {
    setFormData({
      nome: fornecedor?.nome || "",
      cnpj: fornecedor?.cnpj || "",
      telefone: fornecedor?.telefone || "",
      email: fornecedor?.email || "",
      endereco: fornecedor?.endereco || "",
      ativo: fornecedor?.ativo ?? true
    });
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant={isEdicao ? "outline" : "default"} size={isEdicao ? "sm" : "default"}>
          {isEdicao ? <Edit className="h-3 w-3" /> : <Plus className="mr-2 h-4 w-4" />}
          {isEdicao ? "" : "Novo Fornecedor"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdicao ? "Editar Fornecedor" : "Novo Fornecedor"}
          </DialogTitle>
          <DialogDescription>
            {isEdicao ? "Edite as informações do fornecedor" : "Cadastre um novo fornecedor no sistema"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Nome do fornecedor"
              />
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                placeholder="(00) 0000-0000"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="fornecedor@email.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Textarea
              id="endereco"
              value={formData.endereco}
              onChange={(e) => setFormData({...formData, endereco: e.target.value})}
              placeholder="Endereço completo do fornecedor"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData({...formData, ativo: checked})}
            />
            <Label htmlFor="ativo">Fornecedor ativo</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            {isEdicao ? "Atualizar" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
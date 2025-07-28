import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit } from "lucide-react";
import { UnidadeEducacional } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface UnidadeDialogProps {
  unidade?: UnidadeEducacional;
  onSuccess: () => void;
}

export function UnidadeDialog({ unidade, onSuccess }: UnidadeDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: unidade?.nome || "",
    codigo: unidade?.codigo || "",
    telefone: unidade?.telefone || "",
    email: unidade?.email || "",
    endereco: unidade?.endereco || "",
    ativo: unidade?.ativo ?? true
  });
  const { toast } = useToast();

  const isEdicao = !!unidade;

  const handleSubmit = () => {
    if (!formData.nome.trim() || !formData.codigo.trim() || !formData.email.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Simular salvamento
    toast({
      title: isEdicao ? "Unidade atualizada!" : "Unidade cadastrada!",
      description: `${formData.nome} foi ${isEdicao ? 'atualizada' : 'cadastrada'} com sucesso`,
    });

    setOpen(false);
    onSuccess();
  };

  const resetForm = () => {
    setFormData({
      nome: unidade?.nome || "",
      codigo: unidade?.codigo || "",
      telefone: unidade?.telefone || "",
      email: unidade?.email || "",
      endereco: unidade?.endereco || "",
      ativo: unidade?.ativo ?? true
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
          {isEdicao ? "" : "Nova Unidade"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdicao ? "Editar Unidade Educacional" : "Nova Unidade Educacional"}
          </DialogTitle>
          <DialogDescription>
            {isEdicao ? "Edite as informações da unidade" : "Cadastre uma nova unidade educacional no sistema"}
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
                placeholder="Nome da unidade educacional"
              />
            </div>
            <div>
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                placeholder="Código da unidade"
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
                placeholder="unidade@educacao.gov.br"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Textarea
              id="endereco"
              value={formData.endereco}
              onChange={(e) => setFormData({...formData, endereco: e.target.value})}
              placeholder="Endereço completo da unidade educacional"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData({...formData, ativo: checked})}
            />
            <Label htmlFor="ativo">Unidade ativa</Label>
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
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService, InsumoCatalogoPayload } from "@/services/api";
import { InsumoCatalogo } from "@/pages/CatalogoInsumos";

interface CatalogoInsumoDialogProps {
  insumo?: InsumoCatalogo;
  onSuccess: () => void;
}

interface UnidadeMedida {
  id: string;
  nome: string;
  sigla: string;
}

export function CatalogoInsumoDialog({ insumo, onSuccess }: CatalogoInsumoDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const isEdicao = !!insumo;

  const [formData, setFormData] = useState<InsumoCatalogoPayload>({ nome: "", descricao: "", unidadeMedidaId: "" });
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadeMedida[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      apiService.getUnidadesMedida().then(setUnidadesMedida);
      if (insumo && isEdicao) {
        setFormData({
          nome: insumo.nome,
          descricao: insumo.descricao || "",
          unidadeMedidaId: insumo.unidadeMedida.id,
        });
      } else {
        setFormData({ nome: "", descricao: "", unidadeMedidaId: "" });
      }
    }
  }, [insumo, isEdicao, open]);

  const handleSubmit = async () => {
    if (!formData.nome || !formData.unidadeMedidaId) {
        toast({ title: "Erro", description: "Nome e Unidade de Medida são obrigatórios.", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);
    try {
      if (isEdicao && insumo) {
        await apiService.updateInsumo(insumo.id, formData);
      } else {
        await apiService.createInsumo(formData);
      }
      toast({ title: "Sucesso!", description: `Insumo ${isEdicao ? 'atualizado' : 'criado'} com sucesso.` });
      onSuccess();
      setOpen(false);
    } catch (error) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Não foi possível salvar o insumo.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdicao ? (
          <Button variant="outline" size="sm"><Edit className="h-3 w-3" /> Editar</Button>
        ) : (
          <Button><Plus className="mr-2 h-4 w-4" /> Novo Insumo</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdicao ? "Editar Insumo" : "Novo Insumo no Catálogo"}</DialogTitle>
          <DialogDescription>{isEdicao ? "Edite as informações do insumo" : "Cadastre um novo tipo de insumo no sistema"}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
            <div><Label htmlFor="nome">Nome *</Label><Input id="nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} /></div>
            <div><Label htmlFor="descricao">Descrição</Label><Textarea id="descricao" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} /></div>
            <div><Label htmlFor="unidadeMedidaId">Unidade de Medida *</Label>
                <Select value={formData.unidadeMedidaId} onValueChange={(value) => setFormData({ ...formData, unidadeMedidaId: value })}>
                    <SelectTrigger><SelectValue placeholder="Selecione uma unidade" /></SelectTrigger>
                    <SelectContent>{unidadesMedida.map(u => <SelectItem key={u.id} value={u.id}>{u.nome} ({u.sigla})</SelectItem>)}</SelectContent>
                </Select>
            </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdicao ? "Salvar Alterações" : "Criar Insumo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
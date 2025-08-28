import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { Insumo } from "@/pages/Insumos";

interface InsumoDialogProps {
  insumo?: Insumo;
  onSuccess: () => void;
}

interface ContratoAtivo {
  id: string;
  numero: string;
  fornecedor: { nome: string };
}

interface UnidadeMedida {
  id: string;
  nome: string;
  sigla: string;
}

export function InsumoDialog({ insumo, onSuccess }: InsumoDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const isEdicao = !!insumo;

  const [formData, setFormData] = useState({
    contratoId: "",
    nome: "",
    unidadeMedidaId: "",
    quantidade: 0,
    saldo: 0,
    valorUnitario: 0,
  });

  const [contratos, setContratos] = useState<ContratoAtivo[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadeMedida[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Carrega dados de selects quando o diálogo abre
    if (open) {
      apiService.getContratosAlmoxarifadoAtivos().then(setContratos);
      apiService.getUnidadesMedida().then(setUnidadesMedida);
    }
    
    // Popula o formulário se estiver em modo de edição
    if (insumo && isEdicao) {
      setFormData({
        contratoId: insumo.contrato.id, // Supondo que 'insumo' tenha a relação de contrato
        nome: insumo.nome,
        unidadeMedidaId: insumo.unidadeMedida.id, // Supondo que 'insumo' tenha a relação de unidade de medida
        quantidade: insumo.quantidade,
        saldo: insumo.saldo,
        valorUnitario: insumo.valorUnitario,
      });
    } else {
        // Reseta o formulário
        setFormData({
            contratoId: "", nome: "", unidadeMedidaId: "",
            quantidade: 0, saldo: 0, valorUnitario: 0,
        });
    }
  }, [insumo, isEdicao, open]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = { ...formData, saldo: formData.quantidade }; // Saldo inicial igual à quantidade
      if (isEdicao && insumo) {
        await apiService.updateInsumo(insumo.id, formData);
      } else {
        await apiService.createInsumo(payload);
      }
      toast({ title: "Sucesso!", description: `Insumo ${isEdicao ? 'atualizado' : 'criado'} com sucesso.` });
      onSuccess();
      setOpen(false);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível salvar o insumo.", variant: "destructive" });
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
          <DialogTitle>{isEdicao ? "Editar Insumo" : "Novo Insumo"}</DialogTitle>
          <DialogDescription>
            {isEdicao ? "Edite as informações do item" : "Cadastre um novo item de almoxarifado no sistema"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contratoId" className="text-right">Contrato</Label>
                <Select
                    value={formData.contratoId}
                    onValueChange={(value) => setFormData({ ...formData, contratoId: value })}
                    disabled={isEdicao}
                >
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione um contrato" />
                    </SelectTrigger>
                    <SelectContent>
                        {contratos.map(c => <SelectItem key={c.id} value={c.id}>{c.numero} - {c.fornecedor.nome}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nome" className="text-right">Nome</Label>
                <Input id="nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unidadeMedidaId" className="text-right">Unidade</Label>
                <Select
                    value={formData.unidadeMedidaId}
                    onValueChange={(value) => setFormData({ ...formData, unidadeMedidaId: value })}
                >
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione uma unidade" />
                    </SelectTrigger>
                    <SelectContent>
                         {unidadesMedida.map(u => <SelectItem key={u.id} value={u.id}>{u.nome} ({u.sigla})</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantidade" className="text-right">Quantidade</Label>
                <Input id="quantidade" type="number" value={formData.quantidade} onChange={(e) => setFormData({ ...formData, quantidade: Number(e.target.value) })} className="col-span-3" />
            </div>
             {isEdicao && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="saldo" className="text-right">Saldo</Label>
                    <Input id="saldo" type="number" value={formData.saldo} onChange={(e) => setFormData({ ...formData, saldo: Number(e.target.value) })} className="col-span-3" />
                </div>
             )}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="valorUnitario" className="text-right">Valor Unitário</Label>
                <Input id="valorUnitario" type="number" value={formData.valorUnitario} onChange={(e) => setFormData({ ...formData, valorUnitario: Number(e.target.value) })} className="col-span-3" />
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
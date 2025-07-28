import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { Contrato, ItemContrato } from "@/types";
import { fornecedores, unidadesMedida } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

interface ContratoDialogProps {
  contrato?: Contrato;
  onSuccess: () => void;
}

export function ContratoDialog({ contrato, onSuccess }: ContratoDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    numero: contrato?.numero || "",
    fornecedorId: contrato?.fornecedor.id || "",
    dataInicio: contrato?.dataInicio ? contrato.dataInicio.split('T')[0] : "",
    dataFim: contrato?.dataFim ? contrato.dataFim.split('T')[0] : "",
    valorTotal: contrato?.valorTotal || 0,
    status: contrato?.status || "ativo" as const
  });
  
  const [itens, setItens] = useState<any[]>(
    contrato?.itens || [{ nome: "", unidadeMedidaId: "", valorUnitario: 0, quantidadeOriginal: 0, saldoAtual: 0 }]
  );
  
  const { toast } = useToast();
  const isEdicao = !!contrato;

  const adicionarItem = () => {
    setItens([...itens, { nome: "", unidadeMedidaId: "", valorUnitario: 0, quantidadeOriginal: 0, saldoAtual: 0 }]);
  };

  const removerItem = (index: number) => {
    if (itens.length > 1) {
      setItens(itens.filter((_, i) => i !== index));
    }
  };

  const atualizarItem = (index: number, campo: string, valor: any) => {
    const novosItens = [...itens];
    novosItens[index] = { ...novosItens[index], [campo]: valor };
    
    // Se está atualizando quantidade, atualizar saldo também
    if (campo === 'quantidadeOriginal') {
      novosItens[index].saldoAtual = valor;
    }
    
    setItens(novosItens);
    
    // Recalcular valor total
    const novoValorTotal = novosItens.reduce((total, item) => {
      return total + ((item.valorUnitario || 0) * (item.quantidadeOriginal || 0));
    }, 0);
    setFormData({...formData, valorTotal: novoValorTotal});
  };

  const handleSubmit = () => {
    if (!formData.numero.trim() || !formData.fornecedorId || !formData.dataInicio || !formData.dataFim) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Validar itens
    const itemsInvalidos = itens.some(item => 
      !item.nome?.trim() || !item.unidadeMedidaId || !item.valorUnitario || !item.quantidadeOriginal
    );

    if (itemsInvalidos) {
      toast({
        title: "Erro",
        description: "Todos os itens devem ter nome, unidade de medida, valor unitário e quantidade",
        variant: "destructive",
      });
      return;
    }

    // Simular salvamento
    toast({
      title: isEdicao ? "Contrato atualizado!" : "Contrato cadastrado!",
      description: `Contrato ${formData.numero} foi ${isEdicao ? 'atualizado' : 'cadastrado'} com sucesso`,
    });

    setOpen(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEdicao ? "outline" : "default"} size={isEdicao ? "sm" : "default"}>
          {isEdicao ? <Edit className="h-3 w-3" /> : <Plus className="mr-2 h-4 w-4" />}
          {isEdicao ? "" : "Novo Contrato"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdicao ? "Editar Contrato" : "Novo Contrato"}
          </DialogTitle>
          <DialogDescription>
            {isEdicao ? "Edite as informações do contrato" : "Cadastre um novo contrato de merenda"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dados básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero">Número do Contrato *</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => setFormData({...formData, numero: e.target.value})}
                placeholder="CT-2024-001"
              />
            </div>
            <div>
              <Label htmlFor="fornecedor">Fornecedor *</Label>
              <Select value={formData.fornecedorId} onValueChange={(value) => setFormData({...formData, fornecedorId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.filter(f => f.ativo).map(fornecedor => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dataInicio">Data de Início *</Label>
              <Input
                id="dataInicio"
                type="date"
                value={formData.dataInicio}
                onChange={(e) => setFormData({...formData, dataInicio: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="dataFim">Data de Fim *</Label>
              <Input
                id="dataFim"
                type="date"
                value={formData.dataFim}
                onChange={(e) => setFormData({...formData, dataFim: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Itens do contrato */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Itens do Contrato
                </CardTitle>
                <Button onClick={adicionarItem} size="sm">
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {itens.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                      <div className="md:col-span-2">
                        <Label>Nome do Item *</Label>
                        <Input
                          value={item.nome || ""}
                          onChange={(e) => atualizarItem(index, 'nome', e.target.value)}
                          placeholder="Ex: Arroz integral"
                        />
                      </div>
                      <div>
                        <Label>Unidade de Medida *</Label>
                        <Select value={item.unidadeMedidaId || ""} onValueChange={(value) => atualizarItem(index, 'unidadeMedidaId', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {unidadesMedida.map(unidade => (
                              <SelectItem key={unidade.id} value={unidade.id}>
                                {unidade.sigla} - {unidade.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Valor Unitário *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.valorUnitario || ""}
                          onChange={(e) => atualizarItem(index, 'valorUnitario', parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <Label>Quantidade *</Label>
                        <Input
                          type="number"
                          value={item.quantidadeOriginal || ""}
                          onChange={(e) => atualizarItem(index, 'quantidadeOriginal', parseInt(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {itens.length > 1 && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removerItem(index)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {item.valorUnitario && item.quantidadeOriginal && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Subtotal: R$ {((item.valorUnitario || 0) * (item.quantidadeOriginal || 0)).toFixed(2)}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Valor Total do Contrato:</span>
                  <Badge variant="outline" className="text-lg font-bold">
                    R$ {formData.valorTotal.toFixed(2)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
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
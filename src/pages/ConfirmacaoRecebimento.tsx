import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  AlertTriangle, 
  Package, 
  User,
  Calendar,
  FileText
} from "lucide-react";
import { recibos } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

export default function ConfirmacaoRecebimento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const recibo = recibos.find(r => r.id === id);
  const [responsavel, setResponsavel] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itensConfirmacao, setItensConfirmacao] = useState(
    recibo?.itens.map(item => ({
      itemId: item.id,
      conforme: true,
      quantidadeRecebida: item.quantidadeSolicitada,
      observacoes: ""
    })) || []
  );

  if (!recibo) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Recibo não encontrado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              O recibo solicitado não foi encontrado ou já foi processado.
            </p>
            <Button 
              onClick={() => navigate("/")}
              className="mt-4"
            >
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleItemChange = (itemId: string, field: string, value: any) => {
    setItensConfirmacao(prev => 
      prev.map(item => 
        item.itemId === itemId 
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const handleConfirmar = async () => {
    if (!responsavel.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o responsável pelo recebimento.",
        variant: "destructive",
      });
      return;
    }

    // Simular processamento
    const itensNaoConformes = itensConfirmacao.filter(item => !item.conforme);
    
    toast({
      title: "Recebimento confirmado!",
      description: `Recibo confirmado com ${itensNaoConformes.length} item(ns) não conforme(s).`,
    });

    // Simular redirecionamento após confirmação
    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  const totalItens = recibo.itens.length;
  const itensConformes = itensConfirmacao.filter(item => item.conforme).length;
  const itensNaoConformes = totalItens - itensConformes;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Confirmação de Recebimento</h2>
        <p className="text-muted-foreground">
          Confirme o recebimento dos itens do recibo {recibo.numero}
        </p>
      </div>

      {/* Informações do Recibo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informações do Recibo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Número do Recibo</Label>
              <p className="font-mono">{recibo.numero}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Data de Entrega</Label>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(recibo.dataEntrega).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Responsável Entrega</Label>
              <p>{recibo.responsavelEntrega}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Unidade</Label>
              <p>{recibo.pedido.itens[0]?.unidadeEducacional.nome}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status da Confirmação */}
      <Card>
        <CardHeader>
          <CardTitle>Status da Confirmação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm">Conformes: {itensConformes}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm">Não Conformes: {itensNaoConformes}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Itens para Confirmação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Itens do Recibo
          </CardTitle>
          <CardDescription>
            Marque os itens como conformes ou informe discrepâncias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {recibo.itens.map((item, index) => {
              const confirmacao = itensConfirmacao[index];
              
              return (
                <Card key={item.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{item.itemPedido.itemContrato.nome}</h4>
                        <p className="text-sm text-muted-foreground">
                          Quantidade solicitada: {item.quantidadeSolicitada} {item.itemPedido.itemContrato.unidadeMedida.sigla}
                        </p>
                      </div>
                      <Badge variant={confirmacao?.conforme ? "default" : "destructive"}>
                        {confirmacao?.conforme ? "Conforme" : "Não Conforme"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`conforme-${item.id}`}
                          checked={confirmacao?.conforme}
                          onCheckedChange={(checked) => 
                            handleItemChange(item.id, 'conforme', checked)
                          }
                        />
                        <Label htmlFor={`conforme-${item.id}`}>
                          Item conforme entregue
                        </Label>
                      </div>

                      <div>
                        <Label htmlFor={`quantidade-${item.id}`}>
                          Quantidade Recebida
                        </Label>
                        <Input
                          id={`quantidade-${item.id}`}
                          type="number"
                          min="0"
                          max={item.quantidadeSolicitada}
                          value={confirmacao?.quantidadeRecebida}
                          onChange={(e) => 
                            handleItemChange(item.id, 'quantidadeRecebida', parseInt(e.target.value) || 0)
                          }
                          disabled={confirmacao?.conforme}
                        />
                      </div>

                      <div>
                        <Label htmlFor={`obs-${item.id}`}>
                          Observações
                        </Label>
                        <Input
                          id={`obs-${item.id}`}
                          placeholder="Descreva o problema..."
                          value={confirmacao?.observacoes}
                          onChange={(e) => 
                            handleItemChange(item.id, 'observacoes', e.target.value)
                          }
                          disabled={confirmacao?.conforme}
                        />
                      </div>
                    </div>

                    {!confirmacao?.conforme && (
                      <div className="p-3 bg-warning/10 border border-warning/20 rounded-md">
                        <p className="text-sm text-warning-foreground">
                          <strong>Atenção:</strong> Este item será marcado como não conforme. 
                          A diferença será adicionada de volta ao saldo do contrato.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dados do Responsável */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Responsável pelo Recebimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="responsavel">Nome do Responsável *</Label>
              <Input
                id="responsavel"
                placeholder="Nome completo do responsável"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="observacoes-gerais">Observações Gerais</Label>
              <Textarea
                id="observacoes-gerais"
                placeholder="Observações adicionais sobre a entrega..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={1}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={() => navigate("/")}>
          Cancelar
        </Button>
        <Button onClick={handleConfirmar}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Confirmar Recebimento
        </Button>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  FileText,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Interfaces que representam as seleções específicas da rota /api/recibos/confirmacao/:id
interface UnidadeMedidaSigla {
  sigla: string;
}

interface ItemContratoNomeUnidadeMedida {
  nome: string;
  unidadeMedida: UnidadeMedidaSigla;
}

interface ItemPedidoComItemContrato {
  id: string; // id do ItemPedido
  itemContrato: ItemContratoNomeUnidadeMedida;
}

// Representa a estrutura de um item dentro do array 'itens' do recibo retornado pela API
interface ItemReciboConfirmacaoBackend {
  id: string; // id do ItemRecibo
  quantidadeSolicitada: number;
  quantidadeRecebida?: number; // Pode ser opcional se ainda não foi preenchido
  conforme: boolean;
  observacoes?: string | null;
  itemPedido: ItemPedidoComItemContrato;
}

// Representa a estrutura da UnidadeEducacional retornada pela API
interface UnidadeEducacionalConfirmacaoBackend {
  id: string;
  nome: string;
  codigo: string;
  endereco: string;
  telefone: string;
  email: string;
  ativo: boolean;
}

// Representa a estrutura do Pedido retornado pela API (com 'select' limitado)
interface PedidoConfirmacaoBackend {
  numero: string;
  dataEntregaPrevista: string;
}

// Interface principal que mapeia a resposta completa da rota /api/recibos/confirmacao/:id
interface ReciboConfirmacaoBackend {
  id: string;
  numero: string;
  pedidoId: string;
  unidadeEducacionalId: string;
  dataEntrega: string;
  responsavelEntrega: string;
  responsavelRecebimento?: string;
  status: "pendente" | "confirmado" | "parcial" | "rejeitado";
  qrcode: string;
  observacoes?: string;
  createdAt?: string;

  unidadeEducacional: UnidadeEducacionalConfirmacaoBackend;
  pedido: PedidoConfirmacaoBackend;
  itens: ItemReciboConfirmacaoBackend[];
}

// Nova interface para o objeto de erro retornado pela API
interface ApiErrorResponse {
  error: string;
}

interface ItemConfirmacaoForm {
  itemId: string;
  conforme: boolean;
  quantidadeRecebida: number;
  observacoes: string;
}

export default function ConfirmacaoRecebimento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [recibo, setRecibo] = useState<ReciboConfirmacaoBackend | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [responsavel, setResponsavel] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itensConfirmacao, setItensConfirmacao] = useState<
    ItemConfirmacaoForm[]
  >([]);

  useEffect(() => {
    if (id) {
      const fetchRecibo = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(
            `http://localhost:3001/api/recibos/confirmacao/${id}`
          );

          if (!response.ok) {
            const errorData: ApiErrorResponse = await response.json();
            throw new Error(errorData.error || "Falha ao carregar recibo.");
          }

          const data: ReciboConfirmacaoBackend = await response.json();

          setRecibo(data);
          setItensConfirmacao(
            data.itens.map((item) => ({
              itemId: item.id,
              conforme: true,
              quantidadeRecebida: item.quantidadeSolicitada,
              observacoes: item.observacoes || "",
            }))
          );
        } catch (err) {
          setError(err instanceof Error ? err.message : "Ocorreu um erro.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchRecibo();
    }
  }, [id]);

  // Sobrecarga de funções para handleItemChange
  function handleItemChange(
    itemId: string,
    field: "conforme",
    value: boolean
  ): void;
  function handleItemChange(
    itemId: string,
    field: "quantidadeRecebida",
    value: number
  ): void;
  function handleItemChange(
    itemId: string,
    field: "observacoes",
    value: string
  ): void;
  function handleItemChange(
    itemId: string,
    field: keyof ItemConfirmacaoForm,
    value: boolean | number | string // Tipo de união para a implementação
  ) {
    setItensConfirmacao((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId) {
          const updatedItem = { ...item, [field]: value };

          // Refinamento de tipo para 'field' e 'value'
          if (
            field === "conforme" &&
            typeof value === "boolean" &&
            value === true
          ) {
            const originalItem = recibo?.itens.find((i) => i.id === itemId);
            updatedItem.quantidadeRecebida =
              originalItem?.quantidadeSolicitada || 0;
            updatedItem.observacoes = "";
          }
          return updatedItem;
        }
        return item;
      })
    );
  }

  const handleConfirmar = async () => {
    if (!responsavel.trim()) {
      toast({
        title: "Erro",
        description: "Informe o responsável pelo recebimento.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/recibos/confirmacao/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ responsavel, observacoes, itensConfirmacao }),
        }
      );
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.error || "Falha ao confirmar.");
      }
      const data = await response.json();

      toast({ title: "Recebimento confirmado!", description: data.message });
      navigate("/");
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Ocorreu um erro.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  if (error)
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Erro ao Carregar Recibo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate("/")} className="mt-4">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  if (!recibo) return null;

  const totalItens = recibo.itens.length;
  const itensConformes = itensConfirmacao.filter(
    (item) => item.conforme
  ).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-0">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Confirmação de Recebimento
        </h2>
        <p className="text-muted-foreground">
          Confirme o recebimento dos itens do recibo {recibo.numero}
        </p>
      </div>
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
                <span>
                  {new Date(recibo.dataEntrega).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Responsável Entrega</Label>
              <p>{recibo.responsavelEntrega}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Unidade</Label>
              <p>{recibo.unidadeEducacional.nome}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Status da Confirmação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Conformes: {itensConformes}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">
                Não Conformes: {totalItens - itensConformes}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
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
            {recibo.itens.map((item) => {
              const confirmacao = itensConfirmacao.find(
                (ic) => ic.itemId === item.id
              );
              return (
                <Card key={item.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">
                          {item.itemPedido.itemContrato.nome}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Quantidade solicitada: {item.quantidadeSolicitada}{" "}
                          {item.itemPedido.itemContrato.unidadeMedida.sigla}
                        </p>
                      </div>
                      <Badge
                        variant={
                          confirmacao?.conforme ? "default" : "destructive"
                        }
                      >
                        {confirmacao?.conforme ? "Conforme" : "Não Conforme"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`conforme-${item.id}`}
                          checked={confirmacao?.conforme}
                          onCheckedChange={(checked) =>
                            handleItemChange(item.id, "conforme", !!checked)
                          }
                        />
                        <Label htmlFor={`conforme-${item.id}`}>
                          Item conforme
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
                            handleItemChange(
                              item.id,
                              "quantidadeRecebida",
                              parseInt(e.target.value) || 0
                            )
                          }
                          disabled={confirmacao?.conforme}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`obs-${item.id}`}>Observações</Label>
                        <Input
                          id={`obs-${item.id}`}
                          placeholder="Descreva o problema..."
                          value={confirmacao?.observacoes}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "observacoes",
                              e.target.value
                            )
                          }
                          disabled={confirmacao?.conforme}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
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
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={() => navigate("/")}>
          Cancelar
        </Button>
        <Button onClick={handleConfirmar} disabled={isLoading}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Confirmar Recebimento
        </Button>
      </div>
    </div>
  );
}

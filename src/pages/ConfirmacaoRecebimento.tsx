import { useEffect, useState, useRef } from "react";
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
  Camera, // Adicionado para a câmera/foto
  RotateCcw,
  XCircle, // Adicionado para limpar a assinatura
} from "lucide-react";
// Removido Recibo de "@/types" para usar a interface local ReciboDetalhadoConfirmacao
import { useToast } from "@/hooks/use-toast";
import SignatureCanvas from "react-signature-canvas"; // Importar a biblioteca de assinatura

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
  // NOVO: Adiciona a contagem de estudantes
  estudantesBercario: number;
  estudantesMaternal: number;
  estudantesPreEscola: number;
  estudantesRegular: number;
  estudantesIntegral: number;
  estudantesEja: number;
}

// Representa a estrutura do Pedido retornado pela API (com 'select' limitado)
interface PedidoConfirmacaoBackend {
  numero: string;
  dataEntregaPrevista: string;
}

// Interface principal que mapeia a resposta completa da rota /api/recibos/confirmacao/:id
// Adicionado assinaturaDigital e fotoReciboAssinado
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
  assinaturaDigital?: string | null; // Adicionado
  fotoReciboAssinado?: string | null; // Adicionado
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

  const [assinaturaDigital, setAssinaturaDigital] = useState<string | null>(
    null
  );
  const [fotoReciboAssinado, setFotoReciboAssinado] = useState<string | null>(
    null
  );

  const sigCanvas = useRef<SignatureCanvas>(null); // Referência para o componente SignatureCanvas
  const fileInputRef = useRef<HTMLInputElement>(null); // Referência para o input de arquivo

  useEffect(() => {
    if (id) {
      const fetchRecibo = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(
            `${
              import.meta.env.VITE_API_URL || "http://localhost:3001"
            }/api/recibos/confirmacao/${id}`
          );
          const data = await response.json();

          if (!response.ok) {
            // data aqui é do tipo { error: string }
            throw new Error(data.error || "Falha ao carregar recibo.");
          }

          const recibo = data as ReciboConfirmacaoBackend;

          setRecibo(recibo);
          setItensConfirmacao(
            recibo.itens.map((item) => ({
              itemId: item.id,
              conforme: false,
              quantidadeRecebida: item.quantidadeSolicitada,
              observacoes: item.observacoes || "",
            }))
          );
          setAssinaturaDigital(recibo.assinaturaDigital || null);
          setFotoReciboAssinado(recibo.fotoReciboAssinado || null);
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
    value: boolean | number | string
  ) {
    setItensConfirmacao((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId) {
          const updatedItem = { ...item, [field]: value };

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

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setAssinaturaDigital(null);
    }
  };

  const handleSignatureEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setAssinaturaDigital(sigCanvas.current.toDataURL());
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoReciboAssinado(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmar = async () => {
    if (!responsavel.trim()) {
      toast({
        title: "Erro",
        description: "Informe o responsável pelo recebimento.",
        variant: "destructive",
      });
      return;
    }
    // Validação da assinatura
    if (!assinaturaDigital) {
      toast({
        title: "Erro",
        description: "Por favor, colete a assinatura digital.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/recibos/confirmacao/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            responsavel,
            observacoes,
            itensConfirmacao,
            assinaturaDigital, // Envia a assinatura
            fotoReciboAssinado, // Envia a foto
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha ao confirmar.");

      toast({ title: "Recebimento confirmado!", description: data.message });
      navigate(`/recibos`); // Redireciona para a página de recibos
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
            <Button onClick={() => navigate("/recibos")} className="mt-4">
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
        <h2 className="text-3xl font-bold tracking-tight text-primary">
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
                          disabled={
                            recibo.status !== "pendente" ||
                            confirmacao?.conforme
                          } // Desabilita se não for pendente ou se já estiver conforme
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
                          disabled={
                            recibo.status !== "pendente" ||
                            confirmacao?.conforme
                          } // Desabilita se não for pendente ou se já estiver conforme
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
                disabled={recibo.status !== "pendente"} // Desabilita se não for pendente
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
                disabled={recibo.status !== "pendente"} // Desabilita se não for pendente
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campo de Assinatura Digital */}
      {recibo.status === "pendente" && ( // Apenas mostra se o recibo estiver pendente
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Assinatura do Responsável pelo Recebimento *
            </CardTitle>
            <CardDescription>
              Assine digitalmente para confirmar o recebimento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border border-gray-300 rounded-lg overflow-hidden relative">
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{
                  width: 500,
                  height: 200,
                  className: "sigCanvas border-none",
                }}
                onEnd={handleSignatureEnd}
                backgroundColor="rgb(248, 250, 252)" // Cor de fundo para o pad
              />
              <Button
                variant="outline"
                size="sm"
                onClick={clearSignature}
                className="absolute top-2 right-2"
                disabled={!sigCanvas.current || sigCanvas.current.isEmpty()}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
            {!assinaturaDigital && (
              <p className="text-sm text-red-500 mt-2">
                Assinatura é obrigatória.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Campo para Anexar Foto do Recibo Assinado */}
      {recibo.status === "pendente" && ( // Apenas mostra se o recibo estiver pendente
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Anexar Foto do Recibo Assinado (Opcional)
            </CardTitle>
            <CardDescription>
              Anexe uma foto do recibo físico assinado para comprovação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              id="fotoRecibo"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              ref={fileInputRef}
            />
            {fotoReciboAssinado && (
              <div className="mt-4 relative group">
                <img
                  src={fotoReciboAssinado}
                  alt="Recibo Assinado"
                  className="max-w-full h-auto rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setFotoReciboAssinado(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Exibir Assinatura e Foto se o recibo JÁ FOI confirmado */}
      {recibo.status !== "pendente" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Comprovante de Confirmação
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recibo.assinaturaDigital && (
              <div>
                <Label className="text-sm font-medium">
                  Assinatura Digital:
                </Label>
                <img
                  src={recibo.assinaturaDigital}
                  alt="Assinatura Digital"
                  className="w-full max-w-[200px] h-auto border border-gray-300 rounded-lg mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Responsável: {recibo.responsavelRecebimento}
                </p>
              </div>
            )}
            {recibo.fotoReciboAssinado && (
              <div>
                <Label className="text-sm font-medium">
                  Foto do Recibo Assinado:
                </Label>
                <img
                  src={recibo.fotoReciboAssinado}
                  alt="Recibo Físico Assinado"
                  className="w-full max-w-[200px] h-auto border border-gray-300 rounded-lg mt-2"
                />
              </div>
            )}
            {!recibo.assinaturaDigital && !recibo.fotoReciboAssinado && (
              <p className="text-sm text-muted-foreground">
                Nenhuma assinatura ou foto anexada.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        {recibo.status === "pendente" && ( // Botão de confirmar apenas se o recibo estiver pendente
          <Button onClick={handleConfirmar} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CheckCircle className="mr-2 h-4 w-4" />
            Confirmar Recebimento
          </Button>
        )}
        {recibo.status !== "pendente" && ( // Botão de imprimir/ver se o recibo já foi confirmado
          <Button onClick={() => navigate(`/recibos/imprimir/${recibo.id}`)}>
            <FileText className="mr-2 h-4 w-4" />
            Ver Comprovante
          </Button>
        )}
      </div>
    </div>
  );
}

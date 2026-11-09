import { useEffect, useRef, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Minus,
  ShoppingCart,
  Package2,
  Loader2,
  Building2,
  FileSpreadsheet,
  Search,
} from "lucide-react";
// Importar as interfaces completas do seu arquivo de tipos
import {
  Contrato,
  ItemContrato,
  UnidadeEducacional,
  TipoEstudante,
  PercapitaItem,
} from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  DadosFormularioAlimentado,
  construirItensPedidoFormDeMapeamento,
} from "./ImportPedidoDialog";

// Interface para o item de contrato com a nova estrutura de estoque
interface ItemContratoDetalhado extends ItemContrato {
  unidadeMedida: {
    id: string;
    sigla: string;
    nome: string;
  };
  contrato: {
    id: string;
    numero: string;
    fornecedor: {
      nome: string;
    };
  };
  percapitas: PercapitaItem[]; // Adicionado para incluir a percápita
  sugestoesPorUnidade?: Record<string, number>;
}

// Interface para a lista de contratos que vem da API
interface ContratoDaLista {
  id: string;
  numero: string;
  fornecedor: {
    nome: string;
  };
}

// Interface para os itens do formulário de pedido
interface ItemPedidoForm {
  itemContrato: ItemContratoDetalhado;
  unidades: {
    unidadeId: string;
    quantidade: number;
    unidadeNome: string;
    tipoEstoque: string;
    sugestao: number; // Nova propriedade para armazenar a sugestão de quantidade
  }[];
}

interface NovoPedidoDialogProps {
  onSuccess: () => void;
  dadosImportados?: DadosFormularioAlimentado | null;
  onClearDadosImportados?: () => void;
}

export function NovoPedidoDialog({
  onSuccess,
  dadosImportados,
  onClearDadosImportados,
}: NovoPedidoDialogProps) {
  const [open, setOpen] = useState(false);
  const [contratos, setContratos] = useState<ContratoDaLista[]>([]);
  const [unidades, setUnidades] = useState<UnidadeEducacional[]>([]);
  const [contratoSelecionado, setContratoSelecionado] =
    useState<Contrato | null>(null);
  const [selectedContratoId, setSelectedContratoId] = useState<
    string | undefined
  >();
  const [dataEntrega, setDataEntrega] = useState("");
  const [itensPedido, setItensPedido] = useState<ItemPedidoForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImportingPlanilha, setIsImportingPlanilha] = useState(false);
  const [tiposEstudante, setTiposEstudante] = useState<TipoEstudante[]>([]);
  const [tipoDePedidoAtivo, setTipoDePedidoAtivo] = useState<
    "creche" | "escola" | null
  >(null); // NOVO ESTADO
  const [buscaUnidade, setBuscaUnidade] = useState("");
  const [apenasComQuantidade, setApenasComQuantidade] = useState(false);

  const fileInputPlanilhaRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // COMENTÁRIO: Estado para armazenar os itens do contrato com suas percápitas
  const [itensContratoComPercapita, setItensContratoComPercapita] = useState<
    ItemContratoDetalhado[]
  >([]);

  const aplicarDadosAlimentados = (dados: DadosFormularioAlimentado) => {
    if (dados.contrato) {
      setContratoSelecionado(dados.contrato);
      setSelectedContratoId(dados.contrato.id);
      setContratos((prev) => {
        const existe = prev.some((c) => c.id === dados.contrato.id);
        if (existe) return prev;
        return [
          {
            id: dados.contrato.id,
            numero: dados.contrato.numero,
            fornecedor: {
              nome: dados.contrato.fornecedor?.nome || "Fornecedor",
            },
          },
          ...prev,
        ];
      });
    }
    if (dados.unidades) {
      setUnidades(dados.unidades);
    }
    if (dados.itensContratoComPercapita) {
      setItensContratoComPercapita(dados.itensContratoComPercapita);
    }
    const dtSugerida = dados.dataEntregaPrevista || dados.dataEntregaSugerida;
    if (dtSugerida) {
      setDataEntrega(dtSugerida);
    }
    const tipoAtivo = dados.tipoDePedidoAtivo || dados.tipoPublico || "escola";
    setTipoDePedidoAtivo(tipoAtivo);

    const itensConstruidos = construirItensPedidoFormDeMapeamento(dados);
    if (itensConstruidos.length > 0) {
      setItensPedido(itensConstruidos);
    }
  };

  useEffect(() => {
    if (dadosImportados) {
      setOpen(true);
      aplicarDadosAlimentados(dadosImportados);
    }
  }, [dadosImportados]);

  useEffect(() => {
    if (open) {
      const fetchInitialData = async () => {
        if (!dadosImportados) {
          setIsLoading(true);
        }
        try {
          // Busca a lista de contratos e as unidades com detalhes de estudantes
          const [contratosRes, unidadesRes, tiposEstudanteRes] =
            await Promise.all([
              fetch(
                `${
                  import.meta.env.VITE_API_URL || "http://localhost:3001"
                }/api/contratos-ativos`
              ),
              fetch(
                `${
                  import.meta.env.VITE_API_URL || "http://localhost:3001"
                }/api/unidades-ativas-detalhes`
              ),
              fetch(
                `${
                  import.meta.env.VITE_API_URL || "http://localhost:3001"
                }/api/tipos-estudante`
              ),
            ]);

          if (!contratosRes.ok || !unidadesRes.ok || !tiposEstudanteRes.ok)
            throw new Error("Falha ao carregar dados iniciais.");

          const contratosData = await contratosRes.json();
          const unidadesData = await unidadesRes.json();
          const tiposData = await tiposEstudanteRes.json();

          setContratos(contratosData);
          if (!dadosImportados) {
            setUnidades(unidadesData);
          }
          setTiposEstudante(tiposData);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Erro desconhecido";
          toast({
            title: "Erro",
            description: `Não foi possível carregar os dados para o formulário: ${errorMessage}`,
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchInitialData();
    } else {
      setContratoSelecionado(null);
      setItensPedido([]);
      setDataEntrega("");
      setSelectedContratoId(undefined);
      setItensContratoComPercapita([]);
      setTipoDePedidoAtivo(null); // RESETAR AQUI
      setBuscaUnidade("");
      setApenasComQuantidade(false);
      onClearDadosImportados?.();
    }
  }, [open, toast]);

  const handleUploadPlanilhaInterna = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setIsImportingPlanilha(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (selectedContratoId) {
        formData.append("contratoId", selectedContratoId);
      }
      if (dataEntrega) {
        formData.append("dataEntregaPrevista", dataEntrega);
      }
      formData.append("atualizarUnidades", "true");
      formData.append("atualizarPercapitas", "true");

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/pedidos/alimentar-formulario`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || "Falha ao alimentar o formulário a partir da planilha."
        );
      }

      const itensConstruidos = construirItensPedidoFormDeMapeamento(data);
      aplicarDadosAlimentados({
        ...data,
        itensPedidoForm: itensConstruidos,
      });
      toast({
        title: "Planilha importada no formulário!",
        description: `${itensConstruidos.length} produtos e quantidades por escola alimentados automaticamente.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao ler planilha",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsImportingPlanilha(false);
      if (fileInputPlanilhaRef.current) {
        fileInputPlanilhaRef.current.value = "";
      }
    }
  };

  const handleSelecionarContrato = async (contratoId: string) => {
    setSelectedContratoId(contratoId);
    if (!contratoId) {
      setContratoSelecionado(null);
      setItensPedido([]);
      setItensContratoComPercapita([]);
      setTipoDePedidoAtivo(null); // E RESETAR AQUI TAMBÉM

      return;
    }
    setIsLoading(true);
    try {
      const [contratoRes, itensPercapitaRes] = await Promise.all([
        fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:3001"
          }/api/contratos/${contratoId}`
        ),
        fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:3001"
          }/api/percapita/itens-por-contrato/${contratoId}`
        ),
      ]);

      if (!contratoRes.ok || !itensPercapitaRes.ok)
        throw new Error("Falha ao buscar detalhes do contrato ou per cápitas.");

      const contratoData = await contratoRes.json();
      const itensPercapitaData: ItemContratoDetalhado[] =
        await itensPercapitaRes.json();

      setContratoSelecionado(contratoData);
      setItensContratoComPercapita(itensPercapitaData);
      setItensPedido([]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro",
        description: `Não foi possível carregar os itens do contrato: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calcularSugestaoQuantidade = (
    itemContrato: ItemContratoDetalhado,
    unidade: UnidadeEducacional
  ) => {
    // 1. Calcula o consumo total necessário em GRAMAS para a unidade educacional
    let totalConsumoEmGramas = 0;
    (itemContrato.percapitas || []).forEach((percapita) => {
      let numEstudantes = 0;
      const chaveId = (percapita.tipoEstudante?.id || "").toLowerCase();
      const chaveSigla = (percapita.tipoEstudante?.sigla || "").toLowerCase();
      const chaveNome = (percapita.tipoEstudante?.nome || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

      if (
        chaveId === "bercario" ||
        chaveSigla === "ber" ||
        chaveNome.includes("bercario")
      ) {
        numEstudantes = unidade.estudantesBercario;
      } else if (
        chaveId === "maternal" ||
        chaveSigla === "mat" ||
        chaveNome.includes("maternal")
      ) {
        numEstudantes = unidade.estudantesMaternal;
      } else if (
        chaveId === "pre" ||
        chaveSigla === "pre" ||
        chaveNome.includes("pre")
      ) {
        numEstudantes = unidade.estudantesPreEscola;
      } else if (
        chaveId === "regular" ||
        chaveSigla === "reg" ||
        chaveNome.includes("regular")
      ) {
        numEstudantes = unidade.estudantesRegular;
      } else if (
        chaveId === "integral" ||
        chaveSigla === "int" ||
        chaveNome.includes("integral")
      ) {
        numEstudantes = unidade.estudantesIntegral;
      } else if (
        chaveId === "eja" ||
        chaveSigla === "eja" ||
        chaveNome.includes("eja")
      ) {
        numEstudantes = unidade.estudantesEja;
      }

      if (numEstudantes > 0 && percapita.ativo) {
        const consumoMensalPorEstudante =
          percapita.gramagemPorEstudante * percapita.frequenciaMensal;
        totalConsumoEmGramas += consumoMensalPorEstudante * numEstudantes;
      }
    });

    // Se o item veio sem percápita configurada (ex: linha da planilha sem coluna percapta preenchida),
    // utiliza a sugestão histórica do contrato ou a referência padrão PNAE pelo número de alunos da unidade
    if (totalConsumoEmGramas === 0) {
      const historicoUnidade = itemContrato.sugestoesPorUnidade?.[unidade.id];
      if (historicoUnidade && historicoUnidade > 0) {
        return Math.ceil(historicoUnidade);
      }

      const temPercapitaAtiva = (itemContrato.percapitas || []).some(
        (p) => p.ativo && p.gramagemPorEstudante > 0
      );
      if (!temPercapitaAtiva) {
        const totalAlunosUnidade =
          (unidade.estudantesBercario || 0) +
          (unidade.estudantesMaternal || 0) +
          (unidade.estudantesPreEscola || 0) +
          (unidade.estudantesRegular || 0) +
          (unidade.estudantesIntegral || 0) +
          (unidade.estudantesEja || 0);

        if (totalAlunosUnidade > 0) {
          const nomeNorm = itemContrato.nome
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase();
          if (nomeNorm.includes("ACUCAR")) {
            totalConsumoEmGramas = totalAlunosUnidade * 15 * 10;
          } else if (nomeNorm.includes("ARROZ")) {
            totalConsumoEmGramas = totalAlunosUnidade * 30 * 10;
          } else if (nomeNorm.includes("BISCOITO")) {
            totalConsumoEmGramas = totalAlunosUnidade * 30 * 13;
          } else if (nomeNorm.includes("FEIJAO")) {
            totalConsumoEmGramas = totalAlunosUnidade * 35 * 4;
          }
        }
      }
    }

    if (totalConsumoEmGramas === 0) {
      return 0;
    }

    // 2. Converte o total em gramas para a unidade de medida do CONTRATO
    let quantidadeSugerida = 0;
    const siglaUnidade = itemContrato.unidadeMedida.sigla.toLowerCase();
    const gramagemPacote = itemContrato.gramagemPorPacote;

    if (
      (siglaUnidade === "pct" ||
        siglaUnidade === "pacote" ||
        siglaUnidade === "un") &&
      gramagemPacote &&
      gramagemPacote > 0
    ) {
      // Se tiver gramagem por pacote configurada, divide o total de gramas pela gramagem do pacote
      quantidadeSugerida = totalConsumoEmGramas / gramagemPacote;
    } else if (siglaUnidade === "kg") {
      // Se for Kg, divide por 1000
      quantidadeSugerida = totalConsumoEmGramas / 1000;
    } else {
      // Para outras unidades (Un, L, etc.), a sugestão considera 1 para 1 (assumindo que a percápita representa a unidade)
      quantidadeSugerida = totalConsumoEmGramas;
    }

    // 3. Arredonda para cima, pois não se pode pedir frações de um pacote ou item.
    return Math.ceil(quantidadeSugerida);
  };

  const handleAdicionarItem = (item: ItemContratoDetalhado) => {
    if (itensPedido.find((ip) => ip.itemContrato.id === item.id)) return;

    const unidadesBase = unidades.map((u) => {
      const isCreche =
        u.estudantesBercario > 0 ||
        u.estudantesMaternal > 0 ||
        u.estudantesPreEscola > 0;
      const tipoEstoque: "creche" | "escola" = isCreche ? "creche" : "escola";
      const sugestao = calcularSugestaoQuantidade(item, u);

      return {
        unidadeId: u.id,
        unidadeNome: u.nome,
        tipoEstoque,
        sugestao,
      };
    });

    // Determina a aba ativa caso ainda não tenha sido definida na sessão
    let abaAtiva: "creche" | "escola" = tipoDePedidoAtivo ?? "escola";
    if (!tipoDePedidoAtivo) {
      const temSugestaoEscola = unidadesBase.some(
        (u) => u.tipoEstoque === "escola" && u.sugestao > 0
      );
      const temSugestaoCreche = unidadesBase.some(
        (u) => u.tipoEstoque === "creche" && u.sugestao > 0
      );

      if (!temSugestaoEscola && temSugestaoCreche) {
        abaAtiva = "creche";
      } else if (
        !temSugestaoEscola &&
        !temSugestaoCreche &&
        item.saldoEscola <= 0 &&
        item.saldoCreche > 0
      ) {
        abaAtiva = "creche";
      } else {
        abaAtiva = "escola";
      }
      setTipoDePedidoAtivo(abaAtiva);
    }

    const unidadesComSugestao = unidadesBase.map((u) => ({
      ...u,
      quantidade: u.tipoEstoque === abaAtiva ? u.sugestao : 0,
    }));

    setItensPedido((prev) => [
      ...prev,
      {
        itemContrato: item,
        unidades: unidadesComSugestao,
      },
    ]);
  };

  const handleTabChange = (novoTipoAtivo: "creche" | "escola") => {
    // Define o tipo de pedido para a sessão atual do diálogo
    setTipoDePedidoAtivo(novoTipoAtivo);

    // Itera sobre todos os itens já adicionados ao pedido e preenche automaticamente com o sugerido da aba selecionada
    setItensPedido((prevItens) =>
      prevItens.map((item) => {
        const novasUnidades = item.unidades.map((unidade) => {
          if (unidade.tipoEstoque === novoTipoAtivo) {
            const unidadeCompleta = unidades.find(
              (u) => u.id === unidade.unidadeId
            );
            const sugestao =
              unidade.sugestao > 0
                ? unidade.sugestao
                : unidadeCompleta
                ? calcularSugestaoQuantidade(item.itemContrato, unidadeCompleta)
                : 0;
            return {
              ...unidade,
              sugestao,
              quantidade:
                unidade.quantidade > 0 ? unidade.quantidade : sugestao,
            };
          }
          return { ...unidade, quantidade: 0 };
        });

        return { ...item, unidades: novasUnidades };
      })
    );
  };

  const handleRemoverItem = (itemId: string) =>
    setItensPedido((prev) =>
      prev.filter((ip) => ip.itemContrato.id !== itemId)
    );

  const handleQuantidadeChange = (
    itemId: string,
    unidadeId: string,
    quantidade: number
  ) => {
    setItensPedido((prev) =>
      prev.map((ip) =>
        ip.itemContrato.id === itemId
          ? {
              ...ip,
              unidades: ip.unidades.map((u) =>
                u.unidadeId === unidadeId
                  ? { ...u, quantidade: Math.max(0, quantidade) }
                  : u
              ),
            }
          : ip
      )
    );
  };

  const calcularQuantidadeTotalItem = (item: ItemPedidoForm) =>
    item.unidades.reduce((sum, u) => sum + u.quantidade, 0);

  const calcularTotalItem = (item: ItemPedidoForm) =>
    calcularQuantidadeTotalItem(item) * item.itemContrato.valorUnitario;

  const calcularQuantidadeTotalPedido = () =>
    itensPedido.reduce(
      (sum, item) => sum + calcularQuantidadeTotalItem(item),
      0
    );

  const calcularTotalPedido = () =>
    itensPedido.reduce((sum, item) => sum + calcularTotalItem(item), 0);

  const validarPedido = () => {
    if (!contratoSelecionado || !dataEntrega) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o contrato e o prazo de entrega.",
        variant: "destructive",
      });
      return false;
    }

    if (itensPedido.length === 0) {
      toast({
        title: "Nenhum item adicionado",
        description: "Adicione pelo menos um item ao pedido.",
        variant: "destructive",
      });
      return false;
    }

    if (calcularQuantidadeTotalPedido() <= 0) {
      toast({
        title: "Pedido sem quantidades",
        description:
          "Informe a quantidade de pelo menos uma unidade educacional.",
        variant: "destructive",
      });
      return false;
    }

    const saldosCreche: Record<string, number> = {};
    const saldosEscola: Record<string, number> = {};
    const saldosAtuais: Record<string, number> = {};

    contratoSelecionado.itens.forEach((item) => {
      saldosCreche[item.id] = item.saldoCreche;
      saldosEscola[item.id] = item.saldoEscola;
      saldosAtuais[item.id] = item.saldoAtual;
    });

    for (const item of itensPedido) {
      let totalCrechePedido = 0;
      let totalEscolaPedido = 0;

      item.unidades.forEach((u) => {
        if (u.tipoEstoque === "creche") {
          totalCrechePedido += u.quantidade;
        } else {
          totalEscolaPedido += u.quantidade;
        }
      });

      const saldoCrecheDisp =
        saldosCreche[item.itemContrato.id] ?? item.itemContrato.saldoCreche ?? 0;
      const saldoEscolaDisp =
        saldosEscola[item.itemContrato.id] ?? item.itemContrato.saldoEscola ?? 0;
      const saldoTotalDisp =
        saldosAtuais[item.itemContrato.id] ?? item.itemContrato.saldoAtual ?? 0;

      if (
        totalCrechePedido + totalEscolaPedido > saldoTotalDisp &&
        totalCrechePedido > saldoCrecheDisp
      ) {
        toast({
          title: "Saldo Insuficiente (Creche)",
          description: `O item "${item.itemContrato.nome}" ultrapassa o saldo disponível para creches.`,
          variant: "destructive",
        });
        return false;
      }

      if (
        totalCrechePedido + totalEscolaPedido > saldoTotalDisp &&
        totalEscolaPedido > saldoEscolaDisp
      ) {
        toast({
          title: "Saldo Insuficiente (Escola)",
          description: `O item "${item.itemContrato.nome}" ultrapassa o saldo disponível para escolas.`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSalvar = async () => {
    if (!validarPedido()) return;

    setIsLoading(true);
    const itensPayload = itensPedido.flatMap((item) =>
      item.unidades
        .filter((u) => u.quantidade > 0)
        .map((u) => ({
          itemContratoId: item.itemContrato.id,
          unidadeEducacionalId: u.unidadeId,
          quantidade: u.quantidade,
        }))
    );

    const pedidoPayload = {
      contratoId: contratoSelecionado?.id,
      dataEntregaPrevista: dataEntrega,
      valorTotal: calcularTotalPedido(),
      itens: itensPayload,
    };

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/pedidos`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pedidoPayload),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao criar o pedido.");
      }
      toast({
        title: "Pedido criado!",
        description: "O pedido foi criado com sucesso.",
      });
      setOpen(false);
      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const itensDisponiveis =
    itensContratoComPercapita.filter(
      (item) =>
        (item.saldoCreche > 0 || item.saldoEscola > 0 || item.saldoAtual > 0) &&
        !itensPedido.find((ip) => ip.itemContrato.id === item.id)
    ) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Pedido
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-[90vw] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden p-6">
        <DialogHeader className="shrink-0 pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pr-6">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Novo Pedido
              </DialogTitle>
              <DialogDescription>
                Selecione um contrato manualmente ou alimente os dados a partir
                de uma planilha (.xlsx / .csv)
              </DialogDescription>
            </div>
            <div>
              <input
                ref={fileInputPlanilhaRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleUploadPlanilhaInterna}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputPlanilhaRef.current?.click()}
                disabled={isLoading || isImportingPlanilha}
              >
                {isImportingPlanilha ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-primary" />
                )}
                Alimentar via Planilha (.xlsx/.csv)
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex justify-center items-center p-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto pr-2 py-3 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contrato">Contrato *</Label>
                <Select
                  value={selectedContratoId}
                  onValueChange={handleSelecionarContrato}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    {contratos.map((contrato) => (
                      <SelectItem key={contrato.id} value={contrato.id}>
                        {contrato.numero} - {contrato.fornecedor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dataEntrega">Prazo de Entrega *</Label>
                <DatePicker
                  id="dataEntrega"
                  value={dataEntrega}
                  onChange={(v) => setDataEntrega(v)}
                />
              </div>
            </div>

            {contratoSelecionado && (
              <>
                {itensDisponiveis.length > 0 && (
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Package2 className="h-4 w-4" />
                        Itens Disponíveis no Contrato ({itensDisponiveis.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {itensDisponiveis.map((item) => (
                          <Card key={item.id} className="p-3">
                            <div className="space-y-2">
                              <div>
                                <h4 className="font-medium text-sm truncate" title={item.nome}>
                                  {item.nome}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Saldo: Cre: {item.saldoCreche} | Esc:{" "}
                                  {item.saldoEscola} | Total: {item.saldoAtual}{" "}
                                  {item.unidadeMedida.sigla}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  R$ {item.valorUnitario.toFixed(2)} /{" "}
                                  {item.unidadeMedida.sigla}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleAdicionarItem(item)}
                                className="w-full"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Adicionar
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {itensPedido.length > 0 && (
                  <Card>
                    <CardHeader className="py-3 px-4 space-y-2">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          Itens do Pedido ({itensPedido.length})
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="relative w-64">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              placeholder="Filtrar escola/creche..."
                              value={buscaUnidade}
                              onChange={(e) => setBuscaUnidade(e.target.value)}
                              className="pl-8 h-8 text-xs"
                            />
                          </div>
                          <Button
                            type="button"
                            variant={
                              apenasComQuantidade ? "default" : "outline"
                            }
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() =>
                              setApenasComQuantidade((prev) => !prev)
                            }
                          >
                            {apenasComQuantidade
                              ? "Exibindo c/ Quantidade > 0"
                              : "Todas as Unidades"}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="space-y-6">
                        {itensPedido.map((item) => {
                          const qtdTotalItem =
                            calcularQuantidadeTotalItem(item);
                          return (
                            <div
                              key={item.itemContrato.id}
                              className="border rounded-lg p-4 space-y-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <h4 className="font-medium">
                                    {item.itemContrato.nome}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    Saldo disponível:{" "}
                                    {item.itemContrato.saldoAtual}{" "}
                                    {item.itemContrato.unidadeMedida.sigla} | R${" "}
                                    {item.itemContrato.valorUnitario.toFixed(2)}{" "}
                                    / {item.itemContrato.unidadeMedida.sigla}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">
                                    Qtd:{" "}
                                    {qtdTotalItem.toLocaleString("pt-BR")}{" "}
                                    {item.itemContrato.unidadeMedida.sigla}
                                  </Badge>
                                  <Badge variant="outline">
                                    Total: R${" "}
                                    {calcularTotalItem(item).toFixed(2)}
                                  </Badge>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoverItem(item.itemContrato.id)
                                    }
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              {/* Estrutura de Abas para separar Creches e Escolas */}
                              <Tabs
                                defaultValue="escola"
                                className="w-full"
                                value={tipoDePedidoAtivo ?? "escola"}
                                onValueChange={(value) =>
                                  handleTabChange(value as "creche" | "escola")
                                }
                              >
                                <TabsList className="grid w-full max-w-md grid-cols-2">
                                  <TabsTrigger value="creche">
                                    Pedido para Creches
                                  </TabsTrigger>
                                  <TabsTrigger value="escola">
                                    Pedido para Escolas
                                  </TabsTrigger>
                                </TabsList>

                                {/* Conteúdo da Aba de Creches */}
                                <TabsContent value="creche">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-4 max-h-[60vh] overflow-y-auto pr-1">
                                    {item.unidades
                                      .filter(
                                        (unidade) =>
                                          unidade.tipoEstoque === "creche" &&
                                          (!buscaUnidade ||
                                            unidade.unidadeNome
                                              .toLowerCase()
                                              .includes(
                                                buscaUnidade.toLowerCase()
                                              )) &&
                                          (!apenasComQuantidade ||
                                            unidade.quantidade > 0)
                                      )
                                      .map((unidade) => (
                                        <div
                                          key={unidade.unidadeId}
                                          className="space-y-2 p-2.5 rounded border bg-muted/10"
                                        >
                                          <Label className="text-xs font-medium">
                                            <div className="flex items-center gap-1" title={unidade.unidadeNome}>
                                              <Building2 className="h-3 w-3 shrink-0" />
                                              <span className="truncate">
                                                {unidade.unidadeNome}
                                              </span>
                                            </div>
                                          </Label>
                                          <Input
                                            type="number"
                                            min="0"
                                            max={item.itemContrato.saldoCreche}
                                            value={unidade.quantidade || 0}
                                            onChange={(e) =>
                                              handleQuantidadeChange(
                                                item.itemContrato.id,
                                                unidade.unidadeId,
                                                parseInt(e.target.value) || 0
                                              )
                                            }
                                            className="h-8"
                                          />
                                          <p className="text-[11px] text-muted-foreground">
                                            Sugerido: {unidade.sugestao}{" "}
                                            {
                                              item.itemContrato.unidadeMedida
                                                .sigla
                                            }
                                          </p>
                                        </div>
                                      ))}
                                  </div>
                                </TabsContent>

                                {/* Conteúdo da Aba de Escolas */}
                                <TabsContent value="escola">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-4 max-h-[60vh] overflow-y-auto pr-1">
                                    {item.unidades
                                      .filter(
                                        (unidade) =>
                                          unidade.tipoEstoque === "escola" &&
                                          (!buscaUnidade ||
                                            unidade.unidadeNome
                                              .toLowerCase()
                                              .includes(
                                                buscaUnidade.toLowerCase()
                                              )) &&
                                          (!apenasComQuantidade ||
                                            unidade.quantidade > 0)
                                      )
                                      .map((unidade) => (
                                        <div
                                          key={unidade.unidadeId}
                                          className="space-y-2 p-2.5 rounded border bg-muted/10"
                                        >
                                          <Label className="text-xs font-medium">
                                            <div className="flex items-center gap-1" title={unidade.unidadeNome}>
                                              <Building2 className="h-3 w-3 shrink-0" />
                                              <span className="truncate">
                                                {unidade.unidadeNome}
                                              </span>
                                            </div>
                                          </Label>
                                          <Input
                                            type="number"
                                            min="0"
                                            max={item.itemContrato.saldoEscola}
                                            value={unidade.quantidade || 0}
                                            onChange={(e) =>
                                              handleQuantidadeChange(
                                                item.itemContrato.id,
                                                unidade.unidadeId,
                                                parseInt(e.target.value) || 0
                                              )
                                            }
                                            className="h-8"
                                          />
                                          <p className="text-[11px] text-muted-foreground">
                                            Sugerido: {unidade.sugestao}{" "}
                                            {
                                              item.itemContrato.unidadeMedida
                                                .sigla
                                            }
                                          </p>
                                        </div>
                                      ))}
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        <DialogFooter className="shrink-0 pt-3 border-t mt-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-background">
          <div className="flex flex-wrap items-center gap-4">
            {itensPedido.length > 0 && (
              <>
                <span className="text-sm text-muted-foreground">
                  Volume Total:{" "}
                  <strong className="text-foreground">
                    {calcularQuantidadeTotalPedido().toLocaleString("pt-BR")}{" "}
                    unidades
                  </strong>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold">
                    Total do Pedido:
                  </span>
                  <span className="text-lg font-bold text-primary">
                    R$ {calcularTotalPedido().toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSalvar}
              disabled={
                isLoading ||
                !contratoSelecionado ||
                itensPedido.length === 0 ||
                calcularQuantidadeTotalPedido() <= 0
              }
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Pedido
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

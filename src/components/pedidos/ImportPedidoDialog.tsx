import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  Building2,
  Users,
  Package,
  Truck,
  Sparkles,
  EyeOff,
  Edit3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface DadosFormularioAlimentado {
  contrato: any;
  itensContratoComPercapita: any[];
  unidades: any[];
  dataEntregaPrevista?: string;
  dataEntregaSugerida?: string;
  tipoDePedidoAtivo?: "creche" | "escola";
  tipoPublico?: "creche" | "escola";
  mapeamentoItens?: {
    itemContratoId: string;
    nomePlanilha: string;
    quantidadeTotal: number;
    quantidadesPorUnidadeId: Record<string, number>;
  }[];
  itensPedidoForm?: {
    itemContrato: any;
    unidades: {
      unidadeId: string;
      quantidade: number;
      unidadeNome: string;
      tipoEstoque: string;
      sugestao: number;
    }[];
  }[];
  resumo?: any;
  resumoAlimentacao?: any;
}

interface ItemAnalisePlanilha {
  rowIndex: number;
  nomePlanilha: string;
  secao: string;
  oculto: boolean;
  embalagem: string;
  siglaUnidade: string;
  gramagemPorPacote: number | null;
  percaptaGramas: number;
  frequenciaMensal: number;
  escolasAtendidas: number;
  quantidadeTotal: number;
  consolidadoPlanilha: number;
  valorUnitarioEstimado: number;
  subtotalEstimado: number;
  itemContratoMatch: {
    id: string;
    nome: string;
    valorUnitario: number;
    saldoAtual: number;
    unidadeSigla: string;
  } | null;
}

interface EscolaAnalisePlanilha {
  colIndex: number;
  nomePlanilha: string;
  rota: string;
  totalAlunos: number;
  estudantesRegular: number;
  estudantesIntegral: number;
  estudantesEja: number;
  estudantesPreEscola: number;
  unidadeMatch: { id: string; nome: string; codigo: string } | null;
}

interface AnalisePlanilhaNormalizada {
  formato: string;
  titulo: string;
  fornecedorDetectado: string;
  tipoPublico: "creche" | "escola";
  dataEntregaSugerida: string;
  contratoSugerido: {
    id: string;
    numero: string;
    fornecedorNome: string;
  } | null;
  totalEscolas: number;
  escolasEncontradasNoBanco: number;
  escolasNovas: number;
  totaisAlunos: {
    matriculados: number;
    regular: number;
    integral: number;
    eja: number;
  };
  rotasDetectadas: string[];
  itens: ItemAnalisePlanilha[];
  escolas: EscolaAnalisePlanilha[];
}

function normalizarRespostaAnalise(raw: any): AnalisePlanilhaNormalizada {
  const itensRaw: any[] = Array.isArray(raw?.itens)
    ? raw.itens
    : Array.isArray(raw?.resumoItens?.lista)
    ? raw.resumoItens.lista
    : [];

  const escolasRaw: any[] = Array.isArray(raw?.escolas)
    ? raw.escolas
    : Array.isArray(raw?.resumoUnidades?.lista)
    ? raw.resumoUnidades.lista
    : [];

  const itens: ItemAnalisePlanilha[] = itensRaw.map((it, idx) => {
    const match = it.itemContratoMatch ?? it.itemContratoBanco ?? null;
    const qtdTotal = Number(it.quantidadeTotal ?? it.consolidadoPlanilha ?? 0);
    const valUnit = Number(
      it.valorUnitarioEstimado ?? match?.valorUnitario ?? 0
    );
    return {
      rowIndex: Number(it.rowIndex ?? it.linhaPlanilha ?? idx + 1),
      nomePlanilha: String(it.nomePlanilha ?? ""),
      secao: String(it.secao ?? "REGULAR"),
      oculto: Boolean(it.oculto),
      embalagem: String(
        it.embalagem ?? it.embalagemRaw ?? it.siglaUnidade ?? "Pct"
      ),
      siglaUnidade: String(
        it.siglaUnidade ?? it.unidadeSiglaSugerida ?? "Pct"
      ),
      gramagemPorPacote:
        it.gramagemPorPacote ?? it.gramagemPorPacoteSugerida ?? null,
      percaptaGramas: Number(it.percaptaGramas ?? it.percapitaGramas ?? 0),
      frequenciaMensal: Number(it.frequenciaMensal ?? 0),
      escolasAtendidas: Number(
        it.escolasAtendidas ?? it.totalEscolasComPedido ?? 0
      ),
      quantidadeTotal: qtdTotal,
      consolidadoPlanilha: Number(it.consolidadoPlanilha ?? qtdTotal),
      valorUnitarioEstimado: valUnit,
      subtotalEstimado: Number(
        it.subtotalEstimado ?? Number((qtdTotal * valUnit).toFixed(2))
      ),
      itemContratoMatch: match
        ? {
            id: String(match.id),
            nome: String(match.nome),
            valorUnitario: Number(match.valorUnitario ?? 0),
            saldoAtual: Number(match.saldoAtual ?? 0),
            unidadeSigla: String(match.unidadeSigla ?? "Pct"),
          }
        : null,
    };
  });

  const escolas: EscolaAnalisePlanilha[] = escolasRaw.map((esc, idx) => ({
    colIndex: Number(esc.colIndex ?? esc.colunaIndex ?? idx + 1),
    nomePlanilha: String(esc.nomePlanilha ?? ""),
    rota: String(esc.rota ?? ""),
    totalAlunos: Number(esc.totalAlunos ?? esc.alunosMatriculados ?? 0),
    estudantesRegular: Number(esc.estudantesRegular ?? esc.alunosRegular ?? 0),
    estudantesIntegral: Number(
      esc.estudantesIntegral ?? esc.alunosIntegral ?? 0
    ),
    estudantesEja: Number(esc.estudantesEja ?? esc.alunosEja ?? 0),
    estudantesPreEscola: Number(esc.estudantesPreEscola ?? 0),
    unidadeMatch: esc.unidadeMatch ?? esc.unidadeBanco ?? null,
  }));

  const rotasSet = new Set<string>();
  escolas.forEach((e) => {
    if (e.rota) rotasSet.add(e.rota);
  });

  return {
    formato: String(raw?.formato ?? "matriz"),
    titulo: String(raw?.titulo ?? "Planilha de Pedido"),
    fornecedorDetectado: String(raw?.fornecedorDetectado ?? "MAXXI"),
    tipoPublico:
      (raw?.tipoPublico ?? raw?.tipoEstabelecimento) === "creche"
        ? "creche"
        : "escola",
    dataEntregaSugerida: String(raw?.dataEntregaSugerida ?? ""),
    contratoSugerido: raw?.contratoSugerido ?? null,
    totalEscolas: Number(
      raw?.totalEscolas ?? raw?.resumoUnidades?.totalPlanilha ?? escolas.length
    ),
    escolasEncontradasNoBanco: Number(
      raw?.escolasEncontradasNoBanco ??
        raw?.resumoUnidades?.vinculadasBanco ??
        0
    ),
    escolasNovas: Number(
      raw?.escolasNovas ?? raw?.resumoUnidades?.novasParaCriar ?? 0
    ),
    totaisAlunos: {
      matriculados: Number(
        raw?.totaisAlunos?.matriculados ??
          raw?.resumoUnidades?.totalAlunosMatriculados ??
          0
      ),
      regular: Number(
        raw?.totaisAlunos?.regular ??
          raw?.resumoUnidades?.totalAlunosRegular ??
          0
      ),
      integral: Number(
        raw?.totaisAlunos?.integral ??
          raw?.resumoUnidades?.totalAlunosIntegral ??
          0
      ),
      eja: Number(
        raw?.totaisAlunos?.eja ?? raw?.resumoUnidades?.totalAlunosEja ?? 0
      ),
    },
    rotasDetectadas: Array.from(rotasSet),
    itens,
    escolas,
  };
}

export function construirItensPedidoFormDeMapeamento(
  dados: DadosFormularioAlimentado
) {
  if (Array.isArray(dados.itensPedidoForm) && dados.itensPedidoForm.length > 0) {
    return dados.itensPedidoForm;
  }

  const itensContrato = Array.isArray(dados.itensContratoComPercapita)
    ? dados.itensContratoComPercapita
    : [];
  const unidades = Array.isArray(dados.unidades) ? dados.unidades : [];
  const mapeamento = Array.isArray(dados.mapeamentoItens)
    ? dados.mapeamentoItens
    : [];
  const tipoAlvo =
    (dados.tipoPublico ?? dados.tipoDePedidoAtivo) === "creche"
      ? "creche"
      : "escola";

  return mapeamento
    .map((mapItem) => {
      const itemContrato = itensContrato.find(
        (ic: any) => ic.id === mapItem.itemContratoId
      );
      if (!itemContrato) return null;

      const quantidadesMap = mapItem.quantidadesPorUnidadeId || {};

      const unidadesForm = unidades.map((u: any) => {
        const isCreche =
          u.estudantesBercario > 0 ||
          u.estudantesMaternal > 0 ||
          u.estudantesPreEscola > 0;
        const qtdPlanilha = Number(quantidadesMap[u.id] || 0);
        const tipoEstoque =
          qtdPlanilha > 0 ? tipoAlvo : isCreche ? "creche" : "escola";

        return {
          unidadeId: u.id,
          quantidade: qtdPlanilha,
          unidadeNome: u.nome,
          tipoEstoque,
          sugestao: qtdPlanilha,
        };
      });

      return {
        itemContrato,
        unidades: unidadesForm,
      };
    })
    .filter(Boolean) as NonNullable<
    DadosFormularioAlimentado["itensPedidoForm"]
  >;
}

interface ImportPedidoDialogProps {
  onSuccess: () => void;
  onOpenInForm?: (dados: DadosFormularioAlimentado) => void;
}

export function ImportPedidoDialog({
  onSuccess,
  onOpenInForm,
}: ImportPedidoDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isFeedingForm, setIsFeedingForm] = useState(false);
  const [analise, setAnalise] = useState<AnalisePlanilhaNormalizada | null>(
    null
  );
  const [contratosDisponiveis, setContratosDisponiveis] = useState<
    { id: string; numero: string; fornecedor: { nome: string } }[]
  >([]);
  const [contratoId, setContratoId] = useState<string>("auto");
  const [dataEntrega, setDataEntrega] = useState<string>("");
  const [incluirLinhasOcultas, setIncluirLinhasOcultas] = useState(false);
  const [atualizarUnidades, setAtualizarUnidades] = useState(true);
  const [atualizarPercapitas, setAtualizarPercapitas] = useState(true);
  const [itensSelecionados, setItensSelecionados] = useState<string[]>([]);
  const [resultadoImportacao, setResultadoImportacao] = useState<any | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

  useEffect(() => {
    if (open) {
      fetch(`${apiUrl}/api/contratos-ativos?tipo=nutricao`)
        .then((res) => (res.ok ? res.json() : []))
        .then((lista) => {
          if (Array.isArray(lista)) setContratosDisponiveis(lista);
        })
        .catch(() => {});
    }
  }, [open, apiUrl]);

  const resetState = () => {
    setFile(null);
    setAnalise(null);
    setContratoId("auto");
    setDataEntrega("");
    setIncluirLinhasOcultas(false);
    setAtualizarUnidades(true);
    setAtualizarPercapitas(true);
    setItensSelecionados([]);
    setResultadoImportacao(null);
    setIsAnalyzing(false);
    setIsImporting(false);
    setIsFeedingForm(false);
  };

  const analisarArquivo = async (
    selectedFile: File,
    incluirOcultas: boolean,
    selectedContrato?: string
  ) => {
    setIsAnalyzing(true);
    setResultadoImportacao(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("incluirLinhasOcultas", String(incluirOcultas));
      if (selectedContrato && selectedContrato !== "auto") {
        formData.append("contratoId", selectedContrato);
      }

      const response = await fetch(`${apiUrl}/api/pedidos/analisar-planilha`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao analisar a planilha.");
      }

      const parsedAnalise = normalizarRespostaAnalise(data);
      setAnalise(parsedAnalise);

      if (!selectedContrato || selectedContrato === "auto") {
        setContratoId(parsedAnalise.contratoSugerido?.id || "auto");
      }
      if (!dataEntrega && parsedAnalise.dataEntregaSugerida) {
        setDataEntrega(parsedAnalise.dataEntregaSugerida);
      }

      const nomesValidos = parsedAnalise.itens
        .filter(
          (i) => (incluirOcultas ? true : !i.oculto) && i.quantidadeTotal > 0
        )
        .map((i) => i.nomePlanilha);
      setItensSelecionados(nomesValidos);
    } catch (error) {
      setAnalise(null);
      toast({
        title: "Falha ao ler planilha",
        description:
          error instanceof Error
            ? error.message
            : "Verifique o formato do arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      analisarArquivo(selected, incluirLinhasOcultas, contratoId);
    }
  };

  const handleToggleOcultas = (checked: boolean) => {
    setIncluirLinhasOcultas(checked);
    if (analise) {
      const nomesValidos = analise.itens
        .filter((i) => (checked ? true : !i.oculto) && i.quantidadeTotal > 0)
        .map((i) => i.nomePlanilha);
      setItensSelecionados(nomesValidos);
    }
  };

  const handleContratoChange = (novoContratoId: string) => {
    setContratoId(novoContratoId);
    if (file) {
      analisarArquivo(file, incluirLinhasOcultas, novoContratoId);
    }
  };

  const handleToggleItem = (nomePlanilha: string, checked: boolean) => {
    setItensSelecionados((prev) =>
      checked
        ? [...prev, nomePlanilha]
        : prev.filter((item) => item !== nomePlanilha)
    );
  };

  const handleImportarDireto = async () => {
    if (!file) return;
    if (itensSelecionados.length === 0) {
      toast({
        title: "Nenhum item selecionado",
        description:
          "Selecione ao menos um produto da planilha para importar.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (contratoId && contratoId !== "auto") {
        formData.append("contratoId", contratoId);
      }
      if (dataEntrega) {
        formData.append("dataEntregaPrevista", dataEntrega);
      }
      formData.append("incluirLinhasOcultas", String(incluirLinhasOcultas));
      formData.append("atualizarUnidades", String(atualizarUnidades));
      formData.append("atualizarPercapitas", String(atualizarPercapitas));
      formData.append("itensSelecionados", JSON.stringify(itensSelecionados));

      const response = await fetch(`${apiUrl}/api/pedidos/importar`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Falha ao importar planilha de pedido.");
      }

      setResultadoImportacao(data);
      toast({
        title: "Pedido importado e dados alimentados!",
        description: data.message,
      });
      onSuccess();
    } catch (error) {
      toast({
        title: "Erro na importação",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleAlimentarFormulario = async () => {
    if (!file || !onOpenInForm) return;
    if (itensSelecionados.length === 0) {
      toast({
        title: "Nenhum item selecionado",
        description:
          "Selecione ao menos um produto para carregar no formulário.",
        variant: "destructive",
      });
      return;
    }

    setIsFeedingForm(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (contratoId && contratoId !== "auto") {
        formData.append("contratoId", contratoId);
      }
      if (dataEntrega) {
        formData.append("dataEntregaPrevista", dataEntrega);
      }
      formData.append("incluirLinhasOcultas", String(incluirLinhasOcultas));
      formData.append("atualizarUnidades", String(atualizarUnidades));
      formData.append("atualizarPercapitas", String(atualizarPercapitas));
      formData.append("itensSelecionados", JSON.stringify(itensSelecionados));

      const response = await fetch(
        `${apiUrl}/api/pedidos/alimentar-formulario`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || "Falha ao alimentar o formulário de pedido."
        );
      }

      const itensPedidoForm = construirItensPedidoFormDeMapeamento(data);
      const payloadCompleto: DadosFormularioAlimentado = {
        ...data,
        dataEntregaPrevista:
          data.dataEntregaPrevista || data.dataEntregaSugerida || dataEntrega,
        tipoDePedidoAtivo:
          data.tipoDePedidoAtivo || data.tipoPublico || "escola",
        itensPedidoForm,
      };

      toast({
        title: "Formulário alimentado com sucesso!",
        description: `${itensPedidoForm.length} produtos e ${
          data.unidades?.length || 0
        } unidades carregados para revisão.`,
      });

      setOpen(false);
      resetState();
      onOpenInForm(payloadCompleto);
    } catch (error) {
      toast({
        title: "Erro ao alimentar formulário",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsFeedingForm(false);
    }
  };

  const listaItensSegura = analise?.itens ?? [];
  const totalItensOcultos = listaItensSegura.filter((i) => i.oculto).length;
  const itensExibidos = listaItensSegura.filter((i) =>
    incluirLinhasOcultas ? true : !i.oculto
  );

  const totalPacotesSelecionados = itensExibidos
    .filter((i) => itensSelecionados.includes(i.nomePlanilha))
    .reduce((acc, i) => acc + i.quantidadeTotal, 0);

  const valorTotalSelecionado = itensExibidos
    .filter((i) => itensSelecionados.includes(i.nomePlanilha))
    .reduce((acc, i) => acc + i.subtotalEstimado, 0);

  const resumoFinal =
    resultadoImportacao?.resumo ?? resultadoImportacao?.resumoAlimentacao ?? {};

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importar Planilha (.xlsx / .csv)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Planilha de Pedido e Alimentar Dados
          </DialogTitle>
          <DialogDescription>
            Envie a planilha de distribuição de merenda (ex.:{" "}
            <strong>PEDIDO MAXXI CEREAIS ESCOLAS</strong>) para alimentar
            automaticamente unidades, alunos matriculados, percápitas, itens de
            contrato e gerar o pedido por escola.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Upload Box */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-2 border-dashed rounded-lg bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {file
                    ? file.name
                    : "Selecione uma planilha .xlsx, .xls ou .csv"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {file
                    ? `${(file.size / 1024).toFixed(
                        1
                      )} KB • Formato reconhecido automaticamente`
                    : "Suporta matrizes de escolas por rota (padrão SEDUC/MAXXI) e planilhas tabulares"}
                </p>
              </div>
            </div>
            <div>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant={file ? "outline" : "default"}
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing || isImporting || isFeedingForm}
              >
                <Upload className="mr-2 h-4 w-4" />
                {file ? "Trocar Planilha" : "Escolher Arquivo"}
              </Button>
            </div>
          </div>

          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Analisando estrutura da planilha, escolas, rotas e itens...
              </p>
            </div>
          )}

          {analise && !isAnalyzing && !resultadoImportacao && (
            <div className="space-y-5">
              {/* Resumo de Cabeçalho e Indicadores da Planilha */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Cabeçalho Detectado
                      </p>
                      <p className="font-semibold text-sm truncate">
                        {analise.titulo}
                      </p>
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {analise.tipoPublico === "escola"
                          ? "Pedido para Escolas"
                          : "Pedido para Creches"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Unidades Educacionais
                      </p>
                      <p className="font-bold text-lg">
                        {analise.totalEscolas} escolas
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {analise.escolasEncontradasNoBanco} vinculadas •{" "}
                        {analise.escolasNovas} novas
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Users className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Alunos Matriculados
                      </p>
                      <p className="font-bold text-lg">
                        {analise.totaisAlunos.matriculados.toLocaleString(
                          "pt-BR"
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Reg: {analise.totaisAlunos.regular} | Int:{" "}
                        {analise.totaisAlunos.integral} | EJA:{" "}
                        {analise.totaisAlunos.eja}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Truck className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Rotas & Volumes
                      </p>
                      <p className="font-bold text-lg">
                        {totalPacotesSelecionados.toLocaleString("pt-BR")} unid.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {analise.rotasDetectadas.length} rotas de entrega
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Configurações de Contrato, Data e Alimentação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-card">
                <div className="space-y-2">
                  <Label>Contrato de Destino *</Label>
                  <Select
                    value={contratoId}
                    onValueChange={handleContratoChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione ou crie automaticamente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        ⚡ Automático (Vincular/Criar para{" "}
                        {analise.fornecedorDetectado ||
                          "Fornecedor da Planilha"}
                        )
                      </SelectItem>
                      {contratosDisponiveis.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.numero} - {c.fornecedor?.nome || "Fornecedor"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Itens ausentes no contrato serão cadastrados e terão seu
                    saldo alimentado automaticamente.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Data de Entrega Prevista *</Label>
                  <DatePicker
                    value={dataEntrega}
                    onChange={(v) => setDataEntrega(v)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Fornecedor detectado:{" "}
                    <strong>{analise.fornecedorDetectado}</strong>
                  </p>
                </div>

                <div className="md:col-span-2 flex flex-wrap gap-6 pt-2 border-t">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={atualizarUnidades}
                      onCheckedChange={(v) => setAtualizarUnidades(Boolean(v))}
                    />
                    <span>
                      Alimentar cadastro de Escolas (matrículas Regular,
                      Integral, EJA e Rotas)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={atualizarPercapitas}
                      onCheckedChange={(v) =>
                        setAtualizarPercapitas(Boolean(v))
                      }
                    />
                    <span>
                      Alimentar Percápitas (g) e Frequências mensais dos itens
                    </span>
                  </label>

                  {totalItensOcultos > 0 && (
                    <label className="flex items-center gap-2 text-sm cursor-pointer text-amber-700 dark:text-amber-400 font-medium">
                      <Checkbox
                        checked={incluirLinhasOcultas}
                        onCheckedChange={(v) => handleToggleOcultas(Boolean(v))}
                      />
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>
                        Incluir {totalItensOcultos} linhas ocultas na planilha
                        (Feijão Preto, Carnes)
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Tabela de Produtos Detectados */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/40 px-4 py-2.5 flex items-center justify-between border-b">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">
                      Produtos Identificados na Planilha (
                      {itensSelecionados.length} de {itensExibidos.length}{" "}
                      selecionados)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() =>
                        setItensSelecionados(
                          itensSelecionados.length === itensExibidos.length
                            ? []
                            : itensExibidos.map((i) => i.nomePlanilha)
                        )
                      }
                    >
                      {itensSelecionados.length === itensExibidos.length
                        ? "Desmarcar Todos"
                        : "Selecionar Todos"}
                    </Button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Produto (Planilha)</TableHead>
                        <TableHead>Seção</TableHead>
                        <TableHead>Embalagem</TableHead>
                        <TableHead>Percápita / Freq.</TableHead>
                        <TableHead>Vínculo no Contrato</TableHead>
                        <TableHead className="text-right">Escolas</TableHead>
                        <TableHead className="text-right">
                          Qtd. Consolidada
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itensExibidos.map((item) => {
                        const checked = itensSelecionados.includes(
                          item.nomePlanilha
                        );
                        const secLower = item.secao.toLowerCase();
                        return (
                          <TableRow
                            key={`${item.rowIndex}-${item.nomePlanilha}`}
                            className={!checked ? "opacity-50" : ""}
                          >
                            <TableCell>
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) =>
                                  handleToggleItem(
                                    item.nomePlanilha,
                                    Boolean(v)
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-1.5">
                                <span>{item.nomePlanilha}</span>
                                {item.oculto && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] border-amber-500 text-amber-600"
                                  >
                                    Linha Oculta
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  secLower === "regular"
                                    ? "secondary"
                                    : secLower === "integral"
                                    ? "default"
                                    : "outline"
                                }
                                className="text-xs capitalize"
                              >
                                {item.secao.toLowerCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              {item.embalagem || item.siglaUnidade}
                            </TableCell>
                            <TableCell className="text-xs">
                              {item.percaptaGramas > 0
                                ? `${item.percaptaGramas}g × ${
                                    item.frequenciaMensal || 1
                                  }x`
                                : "-"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {item.itemContratoMatch ? (
                                <span className="text-emerald-600 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {item.itemContratoMatch.nome} (R${" "}
                                  {item.itemContratoMatch.valorUnitario.toFixed(
                                    2
                                  )}
                                  )
                                </span>
                              ) : (
                                <span className="text-blue-600 flex items-center gap-1">
                                  <Sparkles className="h-3.5 w-3.5" />
                                  Será cadastrado (R${" "}
                                  {item.valorUnitarioEstimado.toFixed(2)})
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {item.escolasAtendidas}
                            </TableCell>
                            <TableCell className="text-right font-bold font-mono">
                              {item.quantidadeTotal.toLocaleString("pt-BR")}{" "}
                              <span className="text-xs font-normal text-muted-foreground">
                                {item.siglaUnidade}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="bg-muted/30 px-4 py-2.5 border-t flex flex-wrap items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total consolidado dos itens marcados:{" "}
                    <strong>
                      {totalPacotesSelecionados.toLocaleString("pt-BR")}{" "}
                      unidades
                    </strong>
                  </span>
                  <span>
                    Valor Total Estimado:{" "}
                    <strong className="text-primary">
                      {valorTotalSelecionado.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Resumo Pós-Importação */}
          {resultadoImportacao && (
            <div className="p-5 border rounded-lg bg-emerald-500/10 border-emerald-500/30 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-emerald-950 dark:text-emerald-200">
                    Importação e Alimentação Concluídas com Sucesso!
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {resultadoImportacao.message}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="p-3 rounded bg-background border">
                  <p className="text-xs text-muted-foreground">Nº do Pedido</p>
                  <p className="font-mono font-bold">
                    {resultadoImportacao.pedido?.numero ||
                      resumoFinal.numeroPedido}
                  </p>
                </div>
                <div className="p-3 rounded bg-background border">
                  <p className="text-xs text-muted-foreground">
                    Escolas Alimentadas
                  </p>
                  <p className="font-bold">
                    {(resumoFinal.unidadesCriadas || 0) +
                      (resumoFinal.unidadesAtualizadas || 0)}{" "}
                    unidades
                  </p>
                </div>
                <div className="p-3 rounded bg-background border">
                  <p className="text-xs text-muted-foreground">
                    Itens Distribuídos
                  </p>
                  <p className="font-bold">
                    {(resumoFinal.totalRegistrosItemPedido || 0).toLocaleString(
                      "pt-BR"
                    )}{" "}
                    lançamentos
                  </p>
                </div>
                <div className="p-3 rounded bg-background border">
                  <p className="text-xs text-muted-foreground">
                    Volume Total Pedido
                  </p>
                  <p className="font-bold">
                    {(
                      resumoFinal.quantidadeTotalUnidades ||
                      resumoFinal.totalUnidadesFisicas ||
                      0
                    ).toLocaleString("pt-BR")}{" "}
                    pacotes/unid.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isImporting || isFeedingForm}
          >
            {resultadoImportacao ? "Fechar" : "Cancelar"}
          </Button>

          {!resultadoImportacao && analise && (
            <div className="flex flex-wrap gap-2">
              {onOpenInForm && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAlimentarFormulario}
                  disabled={
                    isImporting ||
                    isFeedingForm ||
                    itensSelecionados.length === 0
                  }
                >
                  {isFeedingForm ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Edit3 className="mr-2 h-4 w-4" />
                  )}
                  Alimentar no Formulário (Revisar por Escola)
                </Button>
              )}

              <Button
                type="button"
                onClick={handleImportarDireto}
                disabled={
                  isImporting ||
                  isFeedingForm ||
                  itensSelecionados.length === 0
                }
              >
                {isImporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Importar e Gerar Pedido Agora
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

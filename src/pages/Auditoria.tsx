import { useCallback, useEffect, useState } from "react";
import { endOfMonth, format, startOfMonth, subDays } from "date-fns";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Bot,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  ListChecks,
  Loader2,
  RotateCcw,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MetricCard } from "@/components/ui/metric-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { USER_CATEGORIES, UserCategory } from "@/types/auth";
import { cn } from "@/lib/utils";

interface Linha {
  id: string;
  data: string;
  escopo: "unidade" | "central";
  origem: string;
  origemRotulo: string;
  tipo: string;
  item: string;
  medida: string;
  quantidade: number;
  saldoAnterior: number;
  saldoNovo: number;
  local: string;
  destino: string | null;
  responsavel: string;
  usuario: string | null;
  impersonadoPor: string | null;
  motivo: string;
  transcricao: string | null;
  documento: string | null;
}

interface Resposta {
  total: number;
  pagina: number;
  porPagina: number;
  resumo: { total: number; entradas: number; saidas: number; viaAssistente: number };
  itens: Linha[];
}

interface Acesso {
  id: string;
  createdAt: string;
  ip: string | null;
  admin: { nome: string; email: string };
  alvo: { nome: string; email: string; categoria: string };
}

interface Filtros {
  inicio: string;
  fim: string;
  tipo: string;
  origem: string;
  unidadeId: string;
  busca: string;
}

const TODOS = "todos";
const POR_PAGINA = 25;

const TIPOS = [
  { v: TODOS, l: "Todos os tipos" },
  { v: "entrada", l: "Entrada" },
  { v: "saida", l: "Saída" },
  { v: "ajuste", l: "Ajuste" },
  { v: "remanejamento", l: "Remanejamento" },
  { v: "descarte", l: "Descarte" },
];

const ORIGENS = [
  { v: TODOS, l: "Todas as origens" },
  { v: "assistente_voz", l: "Assistente de voz (IA)" },
  { v: "manual", l: "Manual (tela)" },
  { v: "recibo", l: "Recibo de entrega" },
  { v: "qrcode", l: "Saída por QR Code" },
  { v: "almoxarifado", l: "Almoxarifado central" },
];

const hoje = () => format(new Date(), "yyyy-MM-dd");
const FILTROS_INICIAIS: Filtros = {
  inicio: format(subDays(new Date(), 6), "yyyy-MM-dd"),
  fim: hoje(),
  tipo: TODOS,
  origem: TODOS,
  unidadeId: TODOS,
  busca: "",
};

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Fortaleza", dateStyle: "short", timeStyle: "short" });

const numero = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 3 });

// Converte os filtros da tela nos parâmetros da API (sem os "todos").
const paraParams = (f: Filtros) => ({
  inicio: f.inicio || undefined,
  fim: f.fim || undefined,
  tipo: f.tipo === TODOS ? undefined : f.tipo,
  origem: f.origem === TODOS ? undefined : f.origem,
  unidadeId: f.unidadeId === TODOS ? undefined : f.unidadeId,
  busca: f.busca.trim() || undefined,
});

function BadgeTipo({ tipo }: { tipo: string }) {
  const rotulo = TIPOS.find((t) => t.v === tipo)?.l ?? tipo;
  return (
    <Badge
      variant="outline"
      className={cn(
        tipo === "entrada" && "border-success/40 bg-success/10 text-success",
        tipo === "saida" && "border-destructive/40 bg-destructive/10 text-destructive"
      )}
    >
      {rotulo}
    </Badge>
  );
}

function BadgeOrigem({ linha }: { linha: Linha }) {
  const ia = linha.origem === "assistente_voz";
  return (
    <Badge variant={ia ? "default" : "secondary"} className="gap-1 whitespace-nowrap">
      {ia && <Bot className="h-3 w-3" />}
      {linha.origemRotulo}
    </Badge>
  );
}

export default function Auditoria() {
  const { toast } = useToast();
  const [form, setForm] = useState<Filtros>(FILTROS_INICIAIS);
  const [aplicados, setAplicados] = useState<Filtros>(FILTROS_INICIAIS);
  const [pagina, setPagina] = useState(1);
  const [dados, setDados] = useState<Resposta | null>(null);
  const [acessos, setAcessos] = useState<Acesso[]>([]);
  const [unidades, setUnidades] = useState<{ id: string; nome: string }[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [baixando, setBaixando] = useState<string | null>(null);
  const [aba, setAba] = useState("movimentacoes");

  useEffect(() => {
    apiService
      .getUnidades()
      .then((u) => setUnidades(Array.isArray(u) ? u : u.data ?? []))
      .catch(() => undefined);
  }, []);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      if (aba === "movimentacoes") {
        setDados(
          await apiService.getAuditoriaMovimentacoes({ ...paraParams(aplicados), pagina, porPagina: POR_PAGINA })
        );
      } else {
        setAcessos(await apiService.getAcessosComoOutroUsuario(aplicados.inicio, aplicados.fim));
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível carregar a auditoria",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  }, [aba, aplicados, pagina, toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const aplicar = (novos: Filtros) => {
    setForm(novos);
    setAplicados(novos);
    setPagina(1);
  };

  const periodo = (inicio: Date, fim: Date) =>
    aplicar({ ...form, inicio: format(inicio, "yyyy-MM-dd"), fim: format(fim, "yyyy-MM-dd") });

  const baixar = async (formato: "csv" | "xlsx") => {
    try {
      setBaixando(formato);
      if (aba === "acessos") {
        await apiService.downloadAuditoriaImpersonacao(aplicados.inicio, aplicados.fim);
      } else {
        const { truncadoEm } = await apiService.downloadAuditoriaMovimentacoes(paraParams(aplicados), formato);
        if (truncadoEm) {
          toast({
            title: "Exportação limitada",
            description: `Há ${truncadoEm} registros no filtro; o arquivo traz os 20.000 mais recentes. Reduza o período para exportar o restante.`,
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível baixar o arquivo",
        variant: "destructive",
      });
    } finally {
      setBaixando(null);
    }
  };

  const totalPaginas = dados ? Math.max(1, Math.ceil(dados.total / dados.porPagina)) : 1;
  const filtrosAlterados = JSON.stringify(form) !== JSON.stringify(aplicados);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Auditoria</h2>
          <p className="text-muted-foreground">
            Registro de quem entrou e saiu com produtos, e por qual canal (pessoa ou assistente de voz)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {aba === "movimentacoes" && (
            <Button variant="outline" onClick={() => baixar("xlsx")} disabled={!!baixando || !dados?.total}>
              {baixando === "xlsx" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
              Baixar Excel
            </Button>
          )}
          <Button variant="outline" onClick={() => baixar("csv")} disabled={!!baixando}>
            {baixando === "csv" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Baixar CSV
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription>O período vale para as duas abas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => periodo(new Date(), new Date())}>
              Hoje
            </Button>
            <Button variant="outline" size="sm" onClick={() => periodo(subDays(new Date(), 6), new Date())}>
              7 dias
            </Button>
            <Button variant="outline" size="sm" onClick={() => periodo(subDays(new Date(), 29), new Date())}>
              30 dias
            </Button>
            <Button variant="outline" size="sm" onClick={() => periodo(startOfMonth(new Date()), endOfMonth(new Date()))}>
              Este mês
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="audInicio">De</Label>
              <DatePicker id="audInicio" value={form.inicio} max={form.fim || undefined} onChange={(v) => setForm({ ...form, inicio: v })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="audFim">Até</Label>
              <DatePicker id="audFim" value={form.fim} min={form.inicio || undefined} onChange={(v) => setForm({ ...form, fim: v })} />
            </div>

            {aba === "movimentacoes" && (
              <>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Origem</Label>
                  <Select value={form.origem} onValueChange={(v) => setForm({ ...form, origem: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ORIGENS.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Unidade</Label>
                  <Select value={form.unidadeId} onValueChange={(v) => setForm({ ...form, unidadeId: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TODOS}>Todas as unidades</SelectItem>
                      {unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="audBusca">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="audBusca"
                      className="pl-9"
                      placeholder="Item, responsável, motivo, frase falada…"
                      value={form.busca}
                      onChange={(e) => setForm({ ...form, busca: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && aplicar(form)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => aplicar(form)}>
              <Search className="mr-2 h-4 w-4" />
              Aplicar filtros
            </Button>
            <Button variant="ghost" onClick={() => aplicar(FILTROS_INICIAIS)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Limpar
            </Button>
            {filtrosAlterados && <span className="self-center text-sm text-muted-foreground">Há filtros não aplicados</span>}
          </div>
        </CardContent>
      </Card>

      <Tabs value={aba} onValueChange={(v) => { setAba(v); setPagina(1); }}>
        <TabsList>
          <TabsTrigger value="movimentacoes">Entradas e saídas</TabsTrigger>
          <TabsTrigger value="acessos">Acessos como outro usuário</TabsTrigger>
        </TabsList>

        <TabsContent value="movimentacoes" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <MetricCard title="Registros" value={dados ? numero(dados.resumo.total) : "…"} icon={ListChecks} />
            <MetricCard title="Entradas" value={dados ? numero(dados.resumo.entradas) : "…"} icon={ArrowDownCircle} variant="success" />
            <MetricCard title="Saídas" value={dados ? numero(dados.resumo.saidas) : "…"} icon={ArrowUpCircle} variant="destructive" />
            <MetricCard title="Via assistente de voz" value={dados ? numero(dados.resumo.viaAssistente) : "…"} icon={Bot} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Movimentações</CardTitle>
              <CardDescription>
                {dados ? `${numero(dados.total)} registro(s) no filtro` : "Carregando…"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Quem registrou</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carregando && !dados ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : dados && dados.itens.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Nenhuma movimentação encontrada neste período e filtros.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dados?.itens.map((l) => (
                      <TableRow key={l.id} className={cn(carregando && "opacity-60")}>
                        <TableCell className="whitespace-nowrap">{dataHora(l.data)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <BadgeOrigem linha={l} />
                            <BadgeTipo tipo={l.tipo} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                          <div className="font-medium">{l.item}</div>
                          <div className="text-xs text-muted-foreground">
                            {l.local}
                            {l.destino ? ` → ${l.destino}` : ""}
                          </div>
                        </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div>
                          <div
                            className={cn(
                              "font-semibold",
                              l.tipo === "entrada" && "text-success",
                              l.tipo === "saida" && "text-destructive"
                            )}
                          >
                            {l.tipo === "entrada" ? "+" : l.tipo === "saida" ? "−" : ""}
                            {numero(l.quantidade)} {l.medida}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            saldo {numero(l.saldoAnterior)} → {numero(l.saldoNovo)}
                          </div>
                        </div>
                        </TableCell>
                        <TableCell>
                          <div>
                          <div>{l.responsavel}</div>
                          {l.usuario && l.usuario !== l.responsavel && (
                            <div className="text-xs text-muted-foreground">conta: {l.usuario}</div>
                          )}
                          {l.impersonadoPor && (
                            <div className="text-xs font-medium text-warning">acessado por {l.impersonadoPor}</div>
                          )}
                        </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div>
                          <div className="text-sm">{l.motivo}</div>
                          {l.transcricao && <div className="text-xs italic text-muted-foreground">“{l.transcricao}”</div>}
                          {l.documento && <div className="text-xs text-muted-foreground">{l.documento}</div>}
                        </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {dados && dados.total > 0 && (
                <div className="mt-4 flex items-center justify-between gap-2">
                  <Button variant="outline" size="sm" disabled={pagina <= 1 || carregando} onClick={() => setPagina((p) => p - 1)}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {pagina} de {totalPaginas}
                  </span>
                  <Button variant="outline" size="sm" disabled={pagina >= totalPaginas || carregando} onClick={() => setPagina((p) => p + 1)}>
                    Próxima
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acessos">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acessos como outro usuário</CardTitle>
              <CardDescription>
                Cada vez que um administrador usa “Entrar como”. Ações feitas nesse modo aparecem na aba de movimentações como “acessado por”.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Administrador</TableHead>
                    <TableHead>Acessou como</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carregando && acessos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : acessos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        Nenhum acesso neste período.
                      </TableCell>
                    </TableRow>
                  ) : (
                    acessos.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="whitespace-nowrap">{dataHora(a.createdAt)}</TableCell>
                        <TableCell>{a.admin.nome}</TableCell>
                        <TableCell>
                          <div>{a.alvo.nome}</div>
                          <div className="text-xs text-muted-foreground">{a.alvo.email}</div>
                        </TableCell>
                        <TableCell>{USER_CATEGORIES[a.alvo.categoria as UserCategory]?.label ?? a.alvo.categoria}</TableCell>
                        <TableCell className="font-mono text-xs">{a.ip ?? "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  Loader2,
  Mic,
  RotateCcw,
  Search,
  Send,
  Square,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { cn } from "@/lib/utils";

interface Proposta {
  estoqueId: string;
  itemNome: string;
  unidadeNome: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  medida: string;
  quantidadeFalada: string;
  saldoAtual: number;
  saldoNovo: number;
}

interface Mensagem {
  role: "user" | "assistant";
  content: string;
}

interface Registro {
  id: number;
  texto: string;
}

type Estado = "parado" | "gravando" | "processando" | "gravandoAcao";

const MAX_GRAVACAO_SEGUNDOS = 30;
const CHAVE_SESSAO = "assistente-voz";

// A conversa fica guardada na sessão do navegador: se a página recarregar (o navegador do celular
// descarta abas em segundo plano) ou o usuário trocar de aba, a conversa e a confirmação pendente
// continuam de onde pararam.
function lerSessao(): { mensagens: Mensagem[]; proposta: Proposta | null; registros: Registro[] } {
  try {
    const dados = JSON.parse(sessionStorage.getItem(CHAVE_SESSAO) ?? "null");
    if (dados && Array.isArray(dados.mensagens)) {
      return { mensagens: dados.mensagens, proposta: dados.proposta ?? null, registros: dados.registros ?? [] };
    }
  } catch {
    // sessionStorage indisponível ou conteúdo inválido: começa do zero
  }
  return { mensagens: [], proposta: null, registros: [] };
}
const EVENTO_MICROFONE = "assistente:microfone";

const EXEMPLOS = [
  { frase: "Saiu 10 quilos de feijão", rotulo: "Saída", icone: ArrowUpCircle, cor: "text-destructive" },
  { frase: "Chegaram 5 quilos de arroz", rotulo: "Entrada", icone: ArrowDownCircle, cor: "text-success" },
  { frase: "Quanto tem de óleo?", rotulo: "Consulta", icone: Search, cor: "text-primary" },
];

// Formatos que o navegador consegue gravar (Safari/iPhone usa mp4).
function escolherFormato() {
  const candidatos = [
    { mime: "audio/webm;codecs=opus", ext: "webm" },
    { mime: "audio/webm", ext: "webm" },
    { mime: "audio/mp4", ext: "mp4" },
    { mime: "audio/ogg;codecs=opus", ext: "ogg" },
  ];
  return candidatos.find((c) => window.MediaRecorder?.isTypeSupported?.(c.mime)) ?? null;
}

const numero = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 3 });

const descreve = (p: Proposta) =>
  `${p.tipo === "saida" ? "Saída" : "Entrada"} de ${numero(p.quantidade)} ${p.medida} de ${p.itemNome}`;

const tempo = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// Barras animadas da onda sonora (só aparecem gravando).
function Onda({ ativa }: { ativa: boolean }) {
  return (
    <div className="flex h-6 min-w-[3.5rem] items-center justify-center gap-1" aria-hidden>
      {ativa
        ? [0, 1, 2, 3, 4, 5, 6].map((i) => (
            <span
              key={i}
              className="voz-onda h-6 w-1 rounded-full bg-destructive"
              style={{ animationDelay: `${i * 0.11}s` }}
            />
          ))
        : null}
    </div>
  );
}

export default function Assistente() {
  const { user } = useAuth();
  const [disponivel, setDisponivel] = useState<boolean | null>(null);
  const [estado, setEstado] = useState<Estado>("parado");
  const [segundos, setSegundos] = useState(0);
  const [sessaoInicial] = useState(lerSessao);
  const [mensagens, setMensagens] = useState<Mensagem[]>(sessaoInicial.mensagens);
  const [proposta, setProposta] = useState<Proposta | null>(sessaoInicial.proposta);
  const [registros, setRegistros] = useState<Registro[]>(sessaoInicial.registros);
  const [erro, setErro] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [falar, setFalar] = useState(true);

  const gravadorRef = useRef<MediaRecorder | null>(null);
  const trechosRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ultimaFraseRef = useRef("");
  const fimRef = useRef<HTMLDivElement>(null);
  const aoTocarRef = useRef<() => void>(() => undefined);
  const descartarRef = useRef(false);

  useEffect(() => {
    apiService
      .getAssistenteStatus()
      .then((r) => setDisponivel(!!r.disponivel))
      .catch(() => setDisponivel(false));
  }, []);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens, proposta]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        CHAVE_SESSAO,
        JSON.stringify({ mensagens: mensagens.slice(-30), proposta, registros: registros.slice(0, 10) })
      );
    } catch {
      // sem sessionStorage: a conversa só não sobrevive à recarga
    }
  }, [mensagens, proposta, registros]);

  const pararMicrofone = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(
    () => () => {
      pararMicrofone();
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
    },
    [pararMicrofone]
  );

  // No celular o microfone é o botão central da barra: avisa o estado para ele mudar de aparência
  // (verde = pronto, vermelho = gravando, giratório = processando).
  useEffect(() => {
    const voz = estado === "gravando" ? "gravando" : estado === "parado" ? "parado" : "processando";
    window.dispatchEvent(new CustomEvent("assistente:estado", { detail: { voz } }));
    return () => {
      window.dispatchEvent(new CustomEvent("assistente:estado", { detail: { voz: "parado" } }));
    };
  }, [estado]);

  // O botão central da barra do celular dispara este evento quando já estamos nesta tela.
  useEffect(() => {
    const aoEvento = () => aoTocarRef.current();
    window.addEventListener(EVENTO_MICROFONE, aoEvento);
    return () => window.removeEventListener(EVENTO_MICROFONE, aoEvento);
  }, []);

  // Navegadores móveis só liberam áudio depois de um toque: "destrava" no clique do microfone.
  const destravarAudio = () => {
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.muted = true;
    audioRef.current.play().catch(() => undefined);
    audioRef.current.muted = false;
  };

  const falarTexto = useCallback(
    async (frase: string) => {
      if (!falar) return;
      try {
        const blob = await apiService.assistenteFalar(frase);
        const url = URL.createObjectURL(blob);
        const audio = audioRef.current ?? new Audio();
        audioRef.current = audio;
        audio.src = url;
        audio.onended = () => URL.revokeObjectURL(url);
        await audio.play();
      } catch {
        // Sem a voz da nuvem, usa a voz do próprio aparelho.
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const fala = new SpeechSynthesisUtterance(frase);
          fala.lang = "pt-BR";
          window.speechSynthesis.speak(fala);
        }
      }
    },
    [falar]
  );

  const dizer = useCallback(
    (frase: string) => {
      setMensagens((m) => [...m, { role: "assistant", content: frase }]);
      falarTexto(frase);
    },
    [falarTexto]
  );

  const confirmar = useCallback(
    async (p: Proposta) => {
      setEstado("gravandoAcao");
      setErro(null);
      try {
        const r = await apiService.assistenteConfirmar({
          estoqueId: p.estoqueId,
          tipo: p.tipo,
          quantidade: p.quantidade,
          transcricao: ultimaFraseRef.current,
        });
        setProposta(null);
        setRegistros((lista) => [
          { id: Date.now(), texto: `${descreve(p)} — saldo: ${numero(r.saldoNovo)} ${r.medida}` },
          ...lista,
        ]);
        dizer(`Pronto! Registrei. Agora tem ${numero(r.saldoNovo)} ${r.medida} de ${r.itemNome}.`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Não foi possível registrar.";
        setErro(msg);
        setProposta(null);
        dizer(msg);
      } finally {
        setEstado("parado");
      }
    },
    [dizer]
  );

  const cancelar = useCallback(() => {
    setProposta(null);
    dizer("Tudo bem, não registrei nada.");
  }, [dizer]);

  // Processa a resposta do servidor (vale para voz e texto).
  const tratarResposta = useCallback(
    async (r: { transcricao: string; resposta?: string; proposta?: Proposta | null; decisao?: string }, pendente: Proposta | null) => {
      setMensagens((m) => [...m, { role: "user", content: r.transcricao }]);

      if (r.decisao && pendente) {
        if (r.decisao === "confirmar") await confirmar(pendente);
        else cancelar();
        return;
      }

      ultimaFraseRef.current = r.transcricao;
      setProposta(r.proposta ?? null);
      if (r.resposta) dizer(r.resposta);
    },
    [confirmar, cancelar, dizer]
  );

  const historicoParaEnviar = () => mensagens.slice(-8);

  const enviarAudio = useCallback(
    async (blob: Blob, ext: string) => {
      setEstado("processando");
      setErro(null);
      const pendente = proposta;
      try {
        const r = await apiService.assistenteVoz(blob, ext, historicoParaEnviar(), pendente);
        await tratarResposta(r, pendente);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não consegui entender. Tente de novo.");
      } finally {
        setEstado((atual) => (atual === "gravandoAcao" ? atual : "parado"));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [proposta, mensagens, tratarResposta]
  );

  const enviarTexto = async (frase: string) => {
    const t = frase.trim();
    if (!t || estado !== "parado") return;
    setTexto("");
    setEstado("processando");
    setErro(null);
    const pendente = proposta;
    try {
      const r = await apiService.assistenteTexto(t, historicoParaEnviar(), pendente);
      await tratarResposta(r, pendente);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui entender. Tente de novo.");
    } finally {
      setEstado((atual) => (atual === "gravandoAcao" ? atual : "parado"));
    }
  };

  const iniciarGravacao = async () => {
    setErro(null);
    destravarAudio();
    window.speechSynthesis?.cancel();

    const formato = escolherFormato();
    if (!navigator.mediaDevices?.getUserMedia || !formato) {
      setErro("Este aparelho ou navegador não consegue gravar áudio. Use o campo de texto abaixo.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const gravador = new MediaRecorder(stream, { mimeType: formato.mime });
      trechosRef.current = [];
      gravador.ondataavailable = (ev) => ev.data.size > 0 && trechosRef.current.push(ev.data);
      descartarRef.current = false;
      gravador.onstop = () => {
        pararMicrofone();
        if (descartarRef.current) {
          setEstado("parado");
          return;
        }
        const blob = new Blob(trechosRef.current, { type: formato.mime });
        enviarAudio(blob, formato.ext);
      };
      gravador.start();
      gravadorRef.current = gravador;

      setSegundos(0);
      setEstado("gravando");
      timerRef.current = window.setInterval(() => {
        setSegundos((s) => {
          if (s + 1 >= MAX_GRAVACAO_SEGUNDOS) gravadorRef.current?.stop();
          return s + 1;
        });
      }, 1000);
    } catch (e) {
      pararMicrofone();
      const negado = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError");
      setErro(
        negado
          ? "Sem permissão para o microfone. Libere o microfone nas configurações do navegador."
          : "Não consegui usar o microfone."
      );
    }
  };

  const pararGravacao = () => {
    if (gravadorRef.current?.state === "recording") gravadorRef.current.stop();
  };

  // Para a gravação sem enviar nada.
  const cancelarGravacao = () => {
    descartarRef.current = true;
    pararGravacao();
  };

  const aoTocarMicrofone = () => {
    if (estado === "gravando") pararGravacao();
    else if (estado === "parado") iniciarGravacao();
  };
  aoTocarRef.current = aoTocarMicrofone;

  const limparConversa = () => {
    setMensagens([]);
    setProposta(null);
    setErro(null);
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
  };

  if (disponivel === null) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!disponivel) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Assistente de voz</h2>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            O assistente de voz ainda não foi ativado. Peça ao administrador para cadastrar a chave da
            OpenAI em Configurações.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const gravando = estado === "gravando";
  const ocupado = estado === "processando" || estado === "gravandoAcao";
  const primeiroNome = user?.nome?.split(" ")[0] ?? "";
  const vazio = mensagens.length === 0 && !proposta;

  const statusTexto = gravando
    ? `Ouvindo… ${tempo(segundos)}`
    : ocupado
    ? "Um instante…"
    : proposta
    ? "Diga “confirmo” ou toque em Confirmar"
    : "Toque para falar";

  return (
    // No celular o painel do microfone é fixo, flutuando acima da barra de navegação, como em
    // um app; o pb deixa espaço para o conteúdo não ficar escondido atrás dele.
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3 pb-36 md:pb-0">
      {/* Cabeçalho compacto */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-bold tracking-tight text-primary md:text-3xl">Assistente de voz</h2>
          <p className="hidden text-muted-foreground md:block">
            Diga o que entrou ou saiu do estoque, e eu registro.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {mensagens.length > 0 && (
            <Button variant="outline" size="icon" onClick={limparConversa} aria-label="Limpar conversa">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setFalar((v) => !v);
              audioRef.current?.pause();
              window.speechSynthesis?.cancel();
            }}
            aria-label={falar ? "Desligar a voz das respostas" : "Ligar a voz das respostas"}
          >
            {falar ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
          </Button>
        </div>
      </div>

      {/* Área da conversa */}
      <div className="flex flex-1 flex-col gap-2">
        {vazio && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-1 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mic className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold">Olá{primeiroNome ? `, ${primeiroNome}` : ""}!</p>
              <p className="text-muted-foreground">O que aconteceu no estoque hoje?</p>
            </div>
            <div className="grid w-full gap-2">
              {EXEMPLOS.map(({ frase, rotulo, icone: Icone, cor }) => (
                <button
                  key={frase}
                  type="button"
                  onClick={() => enviarTexto(frase)}
                  disabled={ocupado || gravando}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition-colors active:bg-muted disabled:opacity-50"
                >
                  <Icone className={cn("h-7 w-7 shrink-0", cor)} />
                  <span className="min-w-0">
                    <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {rotulo}
                    </span>
                    <span className="block text-base font-medium">“{frase}”</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {mensagens.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-base",
                m.role === "user"
                  ? "rounded-br-sm bg-primary text-primary-foreground"
                  : "rounded-bl-sm border border-border bg-card text-foreground"
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {estado === "processando" && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-2.5 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Entendendo…
            </div>
          </div>
        )}

        {/* Confirmação */}
        {proposta && (
          <Card className="mt-1 border-2 border-primary shadow-lg">
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center gap-3">
                {proposta.tipo === "saida" ? (
                  <ArrowUpCircle className="h-11 w-11 shrink-0 text-destructive" />
                ) : (
                  <ArrowDownCircle className="h-11 w-11 shrink-0 text-success" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {proposta.tipo === "saida" ? "Saída" : "Entrada"} · {proposta.unidadeNome}
                  </p>
                  <p className="text-xl font-bold leading-tight">
                    {numero(proposta.quantidade)} {proposta.medida} de {proposta.itemNome}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Saldo: {numero(proposta.saldoAtual)} → {numero(proposta.saldoNovo)} {proposta.medida}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-14 text-base" onClick={cancelar} disabled={ocupado}>
                  <X className="mr-2 h-5 w-5" />
                  Cancelar
                </Button>
                <Button className="h-14 text-base" onClick={() => confirmar(proposta)} disabled={ocupado}>
                  {estado === "gravandoAcao" ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-5 w-5" />
                  )}
                  Confirmar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {erro && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {registros.length > 0 && (
          <div className="mt-1 space-y-1.5 rounded-2xl bg-success/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-success">Registrado agora há pouco</p>
            {registros.map((r) => (
              <div key={r.id} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>{r.texto}</span>
              </div>
            ))}
          </div>
        )}
        <div ref={fimRef} />
      </div>

      {/* Painel inferior, fixo acima da barra de navegação no celular. No celular o microfone é o
          botão verde central da barra (um só, para não confundir); no desktop há um microfone aqui. */}
      <div className="fixed bottom-[5.9rem] left-1/2 z-20 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 rounded-3xl border border-border bg-card p-3 shadow-xl md:static md:bottom-auto md:left-auto md:z-10 md:mt-auto md:w-auto md:max-w-none md:translate-x-0 md:p-4 md:shadow-sm">
        {/* Desktop: microfone */}
        <div className="hidden flex-col items-center gap-2 pb-4 md:flex">
          <Onda ativa={gravando} />
          <button
            type="button"
            onClick={aoTocarMicrofone}
            disabled={ocupado}
            aria-label={gravando ? "Parar e enviar" : "Falar"}
            className={cn(
              "relative flex h-20 w-20 items-center justify-center rounded-full text-primary-foreground shadow-xl transition-transform active:scale-95 disabled:opacity-60",
              gravando ? "bg-destructive" : "bg-primary"
            )}
          >
            {gravando && <span className="absolute inset-0 animate-ping rounded-full bg-destructive/40" />}
            {ocupado ? (
              <Loader2 className="relative h-9 w-9 animate-spin" />
            ) : gravando ? (
              <Square className="relative h-8 w-8 fill-current" />
            ) : (
              <Mic className="relative h-9 w-9" />
            )}
          </button>
          <p className={cn("text-sm font-medium", gravando ? "text-destructive" : "text-muted-foreground")}>
            {statusTexto}
            {gravando && <span className="block text-center text-xs font-normal">toque no quadrado para enviar</span>}
          </p>
          {gravando && (
            <Button variant="ghost" size="sm" onClick={cancelarGravacao}>
              Cancelar gravação
            </Button>
          )}
        </div>

        {/* Celular: indicador enquanto grava */}
        {gravando && (
          <div className="flex items-center gap-3 md:hidden">
            <Onda ativa />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-destructive">Ouvindo… {tempo(segundos)}</p>
              <p className="text-xs text-muted-foreground">Toque no botão vermelho para enviar</p>
            </div>
            <Button variant="outline" size="sm" onClick={cancelarGravacao}>
              Cancelar
            </Button>
          </div>
        )}

        {/* Campo de texto: sempre visível (some só enquanto grava no celular) */}
        <form
          className={cn("flex gap-2", gravando && "hidden md:flex")}
          onSubmit={(e) => {
            e.preventDefault();
            enviarTexto(texto);
          }}
        >
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ou digite aqui: saiu 2 kg de arroz"
            disabled={ocupado || gravando}
            maxLength={500}
            className="h-12 rounded-full px-4"
          />
          <Button
            type="submit"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-full"
            disabled={!texto.trim() || ocupado || gravando}
            aria-label="Enviar mensagem"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>

        {/* Celular: dica do que fazer agora */}
        {!gravando && (
          <p className="mt-2 text-center text-xs text-muted-foreground md:hidden">
            {ocupado
              ? "Um instante…"
              : proposta
              ? "Diga “confirmo” ou toque em Confirmar"
              : "Toque no microfone verde para falar"}
          </p>
        )}
      </div>
    </div>
  );
}

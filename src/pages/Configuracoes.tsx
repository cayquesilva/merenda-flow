import { useEffect, useRef, useState } from "react";
import { ImageIcon, RotateCcw, Save, Trash2, Upload } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { useBranding } from "@/contexts/BrandingContext";
import {
  Branding,
  BRANDING_PADRAO,
  arquivoParaDataUrl,
  ehCorClara,
  TEXTO_AJUDA_PADRAO,
} from "@/lib/branding";

// Cores padrão do sistema (equivalentes aos valores do tema em index.css).
const COR_PRIMARIA_PADRAO = "#21966b";
const COR_MENU_PADRAO = "#0f172a";

const REGEX_HEX = /^#[0-9a-fA-F]{6}$/;

interface CampoCorProps {
  id: string;
  label: string;
  descricao: string;
  valor: string | null;
  padrao: string;
  onChange: (valor: string | null) => void;
}

function CampoCor({ id, label, descricao, valor, padrao, onChange }: CampoCorProps) {
  const exibida = valor ?? padrao;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={exibida}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1"
        />
        <Input
          value={exibida}
          onChange={(e) => {
            const v = e.target.value.trim();
            if (REGEX_HEX.test(v)) onChange(v.toLowerCase());
          }}
          maxLength={7}
          className="font-mono"
          aria-label={`${label} em hexadecimal`}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={valor === null}
          onClick={() => onChange(null)}
        >
          Padrão
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{descricao}</p>
    </div>
  );
}

interface CampoImagemProps {
  label: string;
  descricao: string;
  valor: string | null;
  maxLado: number;
  aceitar: string;
  tamanhoPreview: string;
  onChange: (valor: string | null) => void;
}

function CampoImagem({
  label,
  descricao,
  valor,
  maxLado,
  aceitar,
  tamanhoPreview,
  onChange,
}: CampoImagemProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleArquivo = async (file?: File) => {
    if (!file) return;
    try {
      onChange(await arquivoParaDataUrl(file, maxLado));
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Imagem inválida",
        variant: "destructive",
      });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div
          className={`flex shrink-0 items-center justify-center rounded-md border border-dashed border-input bg-muted/40 ${tamanhoPreview}`}
        >
          {valor ? (
            <img src={valor} alt={label} className="max-h-full max-w-full object-contain" />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Enviar imagem
          </Button>
          {valor && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Remover
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={aceitar}
          className="hidden"
          onChange={(e) => handleArquivo(e.target.files?.[0])}
        />
      </div>
      <p className="text-xs text-muted-foreground">{descricao}</p>
    </div>
  );
}

const MODELOS_CHAT = ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4o"];

// Chave da OpenAI do assistente de voz. A chave é cifrada no servidor e nunca volta para a
// tela: aqui só aparece se está configurada e os últimos 4 caracteres.
function CartaoAssistenteVoz() {
  const { toast } = useToast();
  const [carregando, setCarregando] = useState(true);
  const [configurada, setConfigurada] = useState(false);
  const [final, setFinal] = useState<string | null>(null);
  const [modelo, setModelo] = useState(MODELOS_CHAT[0]);
  const [chave, setChave] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    apiService
      .getConfigAssistente()
      .then((c) => {
        setConfigurada(c.configurada);
        setFinal(c.final);
        setModelo(c.modelo);
      })
      .catch(() => undefined)
      .finally(() => setCarregando(false));
  }, []);

  const executar = async (acao: () => Promise<void>) => {
    try {
      setOcupado(true);
      await acao();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Operação falhou",
        variant: "destructive",
      });
    } finally {
      setOcupado(false);
    }
  };

  const aplicar = (c: { configurada: boolean; final: string | null; modelo: string }) => {
    setConfigurada(c.configurada);
    setFinal(c.final);
    setModelo(c.modelo);
    setChave("");
  };

  const salvar = () =>
    executar(async () => {
      const c = await apiService.updateConfigAssistente({
        ...(chave.trim() ? { openaiApiKey: chave.trim() } : {}),
        modelo,
      });
      aplicar(c);
      toast({ title: "Assistente de voz salvo!" });
    });

  const testar = () =>
    executar(async () => {
      const r = await apiService.testarConfigAssistente(chave.trim() || undefined);
      toast({ title: "Tudo certo", description: r.mensagem });
    });

  const remover = () =>
    executar(async () => {
      if (!confirm("Remover a chave? O assistente de voz deixa de funcionar até uma nova chave ser cadastrada.")) return;
      aplicar(await apiService.updateConfigAssistente({ removerChave: true }));
      toast({ title: "Chave removida" });
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Assistente de voz</CardTitle>
        <CardDescription>
          Permite registrar entradas e saídas de estoque falando no celular. Usa a chave de API da
          sua conta OpenAI (o custo é cobrado nela).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {carregando ? null : (
          <>
            <p className="text-sm">
              Situação:{" "}
              {configurada ? (
                <span className="font-semibold text-success">chave configurada (…{final})</span>
              ) : (
                <span className="font-semibold text-destructive">sem chave — o assistente está desativado</span>
              )}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="openaiApiKey">
                  {configurada ? "Substituir a chave" : "Chave da API OpenAI"}
                </Label>
                <Input
                  id="openaiApiKey"
                  type="password"
                  autoComplete="off"
                  value={chave}
                  onChange={(e) => setChave(e.target.value)}
                  placeholder={configurada ? "Deixe em branco para manter a atual" : "sk-..."}
                />
                <p className="text-xs text-muted-foreground">
                  A chave fica cifrada no servidor e não pode ser vista depois de salva.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modeloAssistente">Modelo de linguagem</Label>
                <select
                  id="modeloAssistente"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {MODELOS_CHAT.map((m) => (
                    <option key={m} value={m}>
                      {m}
                      {m === "gpt-4o-mini" ? " (recomendado, mais barato)" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  A transcrição e a voz usam os modelos de áudio da OpenAI automaticamente.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={salvar} disabled={ocupado || (!configurada && !chave.trim())}>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </Button>
              <Button variant="outline" onClick={testar} disabled={ocupado || (!configurada && !chave.trim())}>
                Testar conexão
              </Button>
              {configurada && (
                <Button variant="ghost" onClick={remover} disabled={ocupado}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover chave
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Configuracoes() {
  const { branding, setBranding } = useBranding();
  const { toast } = useToast();
  const [form, setForm] = useState<Branding>(branding);
  const [saving, setSaving] = useState(false);

  const atualizar = <K extends keyof Branding>(campo: K, valor: Branding[K]) =>
    setForm((atual) => ({ ...atual, [campo]: valor }));

  const handleSalvar = async () => {
    if (!form.nomePlataforma.trim() || !form.subtitulo.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Informe o nome da plataforma e o subtítulo.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const salvo = await apiService.updateBranding({
        nomePlataforma: form.nomePlataforma,
        subtitulo: form.subtitulo,
        organizacao: form.organizacao,
        textoAjuda: form.textoAjuda,
        corPrimaria: form.corPrimaria,
        corMenu: form.corMenu,
        logo: form.logo,
        favicon: form.favicon,
      });
      const novo = { ...BRANDING_PADRAO, ...salvo };
      setBranding(novo);
      setForm(novo);
      toast({ title: "Configurações salvas!", description: "A nova identidade já está em uso." });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível salvar",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRestaurar = async () => {
    if (!confirm("Restaurar nome, cores, logo e favicon para o padrão do sistema?")) return;

    try {
      setSaving(true);
      await apiService.resetBranding();
      setBranding(BRANDING_PADRAO);
      setForm(BRANDING_PADRAO);
      toast({ title: "Padrão restaurado" });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível restaurar",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const corPrimaria = form.corPrimaria ?? COR_PRIMARIA_PADRAO;
  const corMenu = form.corMenu ?? COR_MENU_PADRAO;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Configurações</h2>
          <p className="text-muted-foreground">
            Personalize a identidade visual da plataforma
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleRestaurar} disabled={saving}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Restaurar padrão
          </Button>
          <Button onClick={handleSalvar} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Identidade</CardTitle>
            <CardDescription>Nome exibido no login, no menu e na aba do navegador</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nomePlataforma">Nome da plataforma *</Label>
              <Input
                id="nomePlataforma"
                value={form.nomePlataforma}
                maxLength={60}
                onChange={(e) => atualizar("nomePlataforma", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subtitulo">Subtítulo *</Label>
              <Input
                id="subtitulo"
                value={form.subtitulo}
                maxLength={120}
                onChange={(e) => atualizar("subtitulo", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="organizacao">Órgão / secretaria</Label>
              <Input
                id="organizacao"
                value={form.organizacao ?? ""}
                maxLength={120}
                placeholder="Ex.: Secretaria Municipal de Educação"
                onChange={(e) => atualizar("organizacao", e.target.value || null)}
              />
              <p className="text-xs text-muted-foreground">
                Aparece no rodapé da tela de login. Deixe em branco para ocultar.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="textoAjuda">Texto de ajuda do login</Label>
              <Input
                id="textoAjuda"
                value={form.textoAjuda ?? ""}
                maxLength={160}
                placeholder={TEXTO_AJUDA_PADRAO}
                onChange={(e) => atualizar("textoAjuda", e.target.value || null)}
              />
            </div>
            <CampoImagem
              label="Logo"
              descricao="PNG, JPG, WEBP ou SVG. Fundo transparente fica melhor. Máx. 700 KB."
              valor={form.logo}
              maxLado={512}
              aceitar="image/png,image/jpeg,image/webp,image/svg+xml"
              tamanhoPreview="h-16 w-24"
              onChange={(v) => atualizar("logo", v)}
            />
            <CampoImagem
              label="Favicon (ícone da aba)"
              descricao="Imagem quadrada (PNG, SVG ou ICO), idealmente 64×64."
              valor={form.favicon}
              maxLado={64}
              aceitar="image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,image/webp"
              tamanhoPreview="h-12 w-12"
              onChange={(v) => atualizar("favicon", v)}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cores</CardTitle>
              <CardDescription>
                A cor de destaque vale para botões, links e itens ativos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CampoCor
                id="corPrimaria"
                label="Cor de destaque"
                descricao="Botões, item ativo do menu e títulos."
                valor={form.corPrimaria}
                padrao={COR_PRIMARIA_PADRAO}
                onChange={(v) => atualizar("corPrimaria", v)}
              />
              <CampoCor
                id="corMenu"
                label="Cor do menu lateral"
                descricao="Fundo da barra lateral. O texto se ajusta para manter a leitura."
                valor={form.corMenu}
                padrao={COR_MENU_PADRAO}
                onChange={(v) => atualizar("corMenu", v)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pré-visualização</CardTitle>
              <CardDescription>Prévia antes de salvar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex overflow-hidden rounded-lg border">
                <div className="w-40 shrink-0 space-y-2 p-3" style={{ backgroundColor: corMenu }}>
                  <div className="flex items-center gap-2">
                    {form.logo ? (
                      <img src={form.logo} alt="" className="h-7 w-7 shrink-0 object-contain" />
                    ) : (
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm"
                        style={{ backgroundColor: corPrimaria }}
                      >
                        🥗
                      </div>
                    )}
                    <span
                      className="truncate text-xs font-bold"
                      style={{ color: previewTexto(corMenu) }}
                    >
                      {form.nomePlataforma || "Nome"}
                    </span>
                  </div>
                  <div
                    className="rounded-md px-2 py-1 text-xs font-semibold"
                    style={{ backgroundColor: corPrimaria, color: previewTexto(corPrimaria) }}
                  >
                    Item ativo
                  </div>
                  <div className="px-2 py-1 text-xs" style={{ color: previewTexto(corMenu) }}>
                    Outro item
                  </div>
                </div>
                <div className="flex-1 space-y-2 bg-background p-3">
                  <p className="text-sm font-bold" style={{ color: corPrimaria }}>
                    {form.subtitulo || "Subtítulo"}
                  </p>
                  <div
                    className="inline-block rounded-md px-3 py-1.5 text-xs font-medium"
                    style={{ backgroundColor: corPrimaria, color: previewTexto(corPrimaria) }}
                  >
                    Botão
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CartaoAssistenteVoz />
    </div>
  );
}

// Texto claro ou escuro conforme o fundo (mesma regra aplicada ao tema real).
const previewTexto = (hex: string) => (ehCorClara(hex) ? "#0f172a" : "#f8fafc");

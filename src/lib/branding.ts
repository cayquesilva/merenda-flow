export interface Branding {
  nomePlataforma: string;
  subtitulo: string;
  // Órgão exibido no rodapé do login (ex.: nome da secretaria). Vazio oculta a linha.
  organizacao: string | null;
  textoAjuda: string | null;
  corPrimaria: string | null;
  corMenu: string | null;
  logo: string | null;
  favicon: string | null;
}

export const BRANDING_PADRAO: Branding = {
  nomePlataforma: "Merenda Flow",
  subtitulo: "Gestão de Alimentação Escolar",
  organizacao: null,
  textoAjuda: null,
  corPrimaria: null,
  corMenu: null,
  logo: null,
  favicon: null,
};

export const TEXTO_AJUDA_PADRAO =
  "Precisa de acesso? Contate a equipe de TI ou coordenação.";

const CACHE_KEY = "branding";

export function lerBrandingCache(): Branding | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? { ...BRANDING_PADRAO, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

export function salvarBrandingCache(branding: Branding) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(branding));
  } catch {
    // cache é só uma otimização (evita piscar a marca padrão ao abrir)
  }
}

// "#rrggbb" -> [h (0-360), s (0-100), l (0-100)]
export function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

// Luminância relativa (WCAG) para escolher texto claro ou escuro com contraste.
export function ehCorClara(hex: string) {
  const canal = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const lum = 0.2126 * canal(1) + 0.7152 * canal(3) + 0.0722 * canal(5);
  return lum > 0.4;
}

const hsl = (h: number, s: number, l: number) =>
  `${h} ${s}% ${Math.min(100, Math.max(0, l))}%`;

const CLARO = "0 0% 100%";
const ESCURO = "222 47% 11%";

// Variáveis alteradas inline em :root. Cobrem tema claro e escuro de propósito:
// só cores de destaque e de menu, que funcionam nos dois temas.
const VARIAVEIS = [
  "--primary",
  "--primary-foreground",
  "--ring",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-ring",
  "--sidebar-background",
  "--sidebar-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
];

export function aplicarBranding(branding: Branding) {
  const root = document.documentElement;
  VARIAVEIS.forEach((v) => root.style.removeProperty(v));

  if (branding.corPrimaria) {
    const [h, s, l] = hexToHsl(branding.corPrimaria);
    const cor = hsl(h, s, l);
    const fg = ehCorClara(branding.corPrimaria) ? ESCURO : CLARO;
    root.style.setProperty("--primary", cor);
    root.style.setProperty("--primary-foreground", fg);
    root.style.setProperty("--ring", cor);
    root.style.setProperty("--sidebar-primary", cor);
    root.style.setProperty("--sidebar-primary-foreground", fg);
    root.style.setProperty("--sidebar-ring", cor);
  }

  if (branding.corMenu) {
    const [h, s, l] = hexToHsl(branding.corMenu);
    const clara = ehCorClara(branding.corMenu);
    // Hover/seleção e bordas: um passo mais claro (ou mais escuro, se o menu for claro).
    const passo = clara ? -8 : 7;
    root.style.setProperty("--sidebar-background", hsl(h, s, l));
    root.style.setProperty("--sidebar-foreground", clara ? ESCURO : "210 40% 96%");
    root.style.setProperty("--sidebar-accent", hsl(h, s, l + passo));
    root.style.setProperty("--sidebar-accent-foreground", clara ? ESCURO : CLARO);
    root.style.setProperty("--sidebar-border", hsl(h, s, l + passo));
  }

  document.title = branding.nomePlataforma;

  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = branding.favicon || "/favicon.ico";
  // O tipo precisa acompanhar a imagem, senão alguns navegadores ignoram o ícone.
  const tipo = branding.favicon?.match(/^data:([^;]+);/)?.[1];
  if (tipo) link.type = tipo;
  else link.removeAttribute("type");
}

// Lê um arquivo de imagem e devolve data URL. Raster é reduzido (canvas) para
// manter o registro pequeno; SVG e ICO são mantidos como vieram.
export function arquivoParaDataUrl(file: File, maxLado: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => {
      const original = reader.result as string;
      if (/^data:image\/(svg\+xml|x-icon|vnd\.microsoft\.icon|gif)/.test(original)) {
        resolve(original);
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo de imagem inválido."));
      img.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        // PNG preserva transparência (importante para logos).
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = original;
    };
    reader.readAsDataURL(file);
  });
}

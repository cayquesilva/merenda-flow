import { timingSafeEqual, createHash } from 'crypto';
import { monitorEventLoopDelay, performance } from 'perf_hooks';
import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export type CheckStatus = 'ok' | 'degraded' | 'down' | 'skipped';

export interface Check {
  status: CheckStatus;
  critical: boolean;
  latencyMs?: number;
  message?: string;
  [k: string]: unknown;
}

export interface DeepHealthBody {
  protocol: 'office-health/1';
  status: 'ok' | 'degraded' | 'down';
  service: {
    name: string;
    version: string;
    environment: string;
    startedAt: string;
    uptimeSeconds: number;
  };
  checks: Record<string, Check>;
  runtime: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
    eventLoopDelayMeanMs: number;
    eventLoopDelayP99Ms: number;
  };
  checkedAt: string;
  durationMs: number;
  cached: boolean;
}

const startedAt = new Date();

// ── runtime & event loop ────────────────────────────────────────────
const loop = monitorEventLoopDelay({ resolution: 20 });
loop.enable();

export function getRuntime() {
  const m = process.memoryUsage();
  const mb = (b: number) => Math.round((b / 1024 / 1024) * 10) / 10;
  const meanMs = Number.isFinite(loop.mean) ? Math.round((loop.mean / 1e6) * 10) / 10 : 0;
  const p99Ms = Number.isFinite(loop.percentile(99)) ? Math.round((loop.percentile(99) / 1e6) * 10) / 10 : 0;

  const out = {
    rssMb: mb(m.rss),
    heapUsedMb: mb(m.heapUsed),
    heapTotalMb: mb(m.heapTotal),
    eventLoopDelayMeanMs: meanMs,
    eventLoopDelayP99Ms: p99Ms,
  };
  loop.reset();
  return out;
}

// ── manifesto (público) ─────────────────────────────────────────────
export function getManifest() {
  const related: string[] = [];
  const frontUrl =
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://merenda.portaleducampina.com.br' : undefined);

  if (frontUrl) {
    try {
      const parsed = new URL(frontUrl);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        related.push(parsed.origin);
      }
    } catch {
      // url inválida, ignora
    }
  }

  return {
    protocol: 'office-health/1',
    name: process.env.APP_NAME || 'Merenda Flow API',
    kind: 'api' as const,
    endpoints: {
      liveness: '/v1/health',
      deep: '/v1/health/deep',
      version: '/version.json',
    },
    auth: {
      deep: {
        type: 'header' as const,
        header: 'X-Health-Token',
      },
    },
    performance: [
      { name: 'liveness', path: '/v1/health' },
      { name: 'deep', path: '/v1/health/deep', auth: true },
    ],
    related,
  };
}

// ── liveness (público, sem banco) ───────────────────────────────────
export const liveness = () => ({
  status: 'ok',
  checkedAt: new Date().toISOString(),
});

// ── token: tamanho mínimo, comparação em tempo constante, limite por IP ─
const failures = new Map<string, number[]>();
const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 10;

export function authorize(ip: string, givenToken: string | undefined): 200 | 401 | 429 {
  const token = process.env.HEALTH_TOKEN ?? '';

  // Limpeza periódica de IPs antigos para evitar vazamento de memória
  if (failures.size > 500) {
    const cutoff = Date.now() - WINDOW_MS;
    for (const [k, timestamps] of failures.entries()) {
      const valid = timestamps.filter((t) => t > cutoff);
      if (valid.length === 0) {
        failures.delete(k);
      } else {
        failures.set(k, valid);
      }
    }
  }

  const now = Date.now();
  const recent = (failures.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_FAILURES) {
    return 429;
  }

  // Token deve ter no mínimo 32 caracteres conforme especificação
  if (token.length < 32 || !givenToken) {
    failures.set(ip, [...recent, now]);
    return 401;
  }

  const digest = (v: string) => createHash('sha256').update(v).digest();
  const ok = timingSafeEqual(digest(givenToken), digest(token));

  if (!ok) {
    failures.set(ip, [...recent, now]);
    return 401;
  }

  return 200;
}

// ── verificação com timeout ─────────────────────────────────────────
async function timed<T>(fn: () => Promise<T>, timeoutMs: number): Promise<{ result: T; latencyMs: number }> {
  const t0 = performance.now();
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
  });
  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    return { result, latencyMs: Math.round(performance.now() - t0) };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function runChecks(prisma: PrismaClient): Promise<Record<string, Check>> {
  const checks: Record<string, Check> = {};

  // 1. Banco de Dados SQL (crítico): SELECT 1 com timeout de 5 s
  let dbOk = false;
  try {
    const { latencyMs } = await timed(() => prisma.$queryRawUnsafe('SELECT 1'), 5000);
    checks.database = {
      status: latencyMs > 500 ? 'degraded' : 'ok',
      critical: true,
      latencyMs,
    };
    dbOk = true;
  } catch {
    checks.database = {
      status: 'down',
      critical: true,
      message: 'Banco de dados inacessível',
    };
  }

  // 2. Migrations (crítico): leitura da tabela de migrations
  if (!dbOk) {
    checks.migrations = {
      status: 'down',
      critical: true,
      message: 'Banco de dados inacessível',
    };
  } else {
    try {
      const { result: rows } = await timed(
        () =>
          prisma.$queryRawUnsafe<
            Array<{
              migration_name: string;
              finished_at: Date | string | null;
              rolled_back_at: Date | string | null;
              applied_steps_count: number;
            }>
          >(
            'SELECT migration_name, finished_at, rolled_back_at, applied_steps_count FROM _prisma_migrations ORDER BY started_at ASC'
          ),
        5000
      );

      const applied = rows.filter((m) => m.finished_at && !m.rolled_back_at).length;
      const failed = rows.filter((m) => m.rolled_back_at || (!m.finished_at && m.applied_steps_count === 0)).length;

      if (failed > 0) {
        checks.migrations = {
          status: 'down',
          critical: true,
          applied,
          pending: 0,
          failed,
          message: `${failed} migração(ões) com falha`,
        };
      } else {
        checks.migrations = {
          status: 'ok',
          critical: true,
          applied,
          pending: 0,
          failed: 0,
        };
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (
        errMsg.includes('_prisma_migrations') ||
        errMsg.includes('does not exist') ||
        errMsg.includes('não existe')
      ) {
        checks.migrations = {
          status: 'skipped',
          critical: false,
          message: 'Tabela _prisma_migrations não encontrada',
        };
      } else {
        checks.migrations = {
          status: 'degraded',
          critical: false,
          message: 'Não foi possível ler as migrações',
        };
      }
    }
  }

  // 3. Assistente de Voz / OpenAI (não crítico): checagem se configurado
  if (!process.env.OPENAI_BASE_URL) {
    checks.assistenteVoz = {
      status: 'skipped',
      critical: false,
      message: 'Assistente de voz padrão (OpenAI interna)',
    };
  } else {
    try {
      let httpStatus = 0;
      const { latencyMs } = await timed(async () => {
        const resp = await fetch(process.env.OPENAI_BASE_URL!, {
          signal: AbortSignal.timeout(5000),
        });
        httpStatus = resp.status;
      }, 5000);

      checks.assistenteVoz = {
        status: httpStatus >= 500 ? 'down' : latencyMs > 2000 ? 'degraded' : 'ok',
        critical: false,
        latencyMs,
        httpStatus,
      };
    } catch {
      checks.assistenteVoz = {
        status: 'down',
        critical: false,
        message: 'Endpoint do assistente de voz inacessível',
      };
    }
  }

  return checks;
}

function overall(checks: Record<string, Check>): 'ok' | 'degraded' | 'down' {
  let result: 'ok' | 'degraded' = 'ok';
  for (const c of Object.values(checks)) {
    if (c.status === 'down' && c.critical) return 'down';
    if (c.status === 'down' || c.status === 'degraded') result = 'degraded';
  }
  return result;
}

// ── deep com cache de 10 s e chamadas simultâneas compartilhadas ────
let cache: { at: number; body: DeepHealthBody } | null = null;
let inflight: Promise<DeepHealthBody> | null = null;

export function resetHealthCache() {
  cache = null;
  inflight = null;
}

export function resetHealthFailures() {
  failures.clear();
}

export async function deep(prisma: PrismaClient): Promise<{ httpStatus: 200 | 503; body: DeepHealthBody }> {
  if (cache && Date.now() - cache.at < 10_000) {
    return {
      httpStatus: cache.body.status === 'down' ? 503 : 200,
      body: { ...cache.body, cached: true },
    };
  }

  inflight ??= (async () => {
    const t0 = performance.now();
    const checks = await runChecks(prisma);
    const body: DeepHealthBody = {
      protocol: 'office-health/1',
      status: overall(checks),
      service: {
        name: process.env.APP_NAME || 'Merenda Flow API',
        version: process.env.APP_VERSION ?? '2.0.0',
        environment: process.env.NODE_ENV ?? 'development',
        startedAt: startedAt.toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
      },
      checks,
      runtime: getRuntime(),
      checkedAt: new Date().toISOString(),
      durationMs: Math.round(performance.now() - t0),
      cached: false,
    };
    cache = { at: Date.now(), body };
    return body;
  })().finally(() => {
    inflight = null;
  });

  const body = await inflight;
  return {
    httpStatus: body.status === 'down' ? 503 : 200,
    body,
  };
}

// ── Registro de rotas no Express ────────────────────────────────────
export function registrarOfficeHealth({ app, prisma }: { app: Express; prisma: PrismaClient }) {
  // 1. Manifesto público na raiz do domínio
  app.get('/.well-known/office-health', (_req: Request, res: Response) => {
    res.set('Cache-Control', 'public, max-age=300').json(getManifest());
  });

  // 2. Liveness (sem tocar no banco)
  const livenessHandler = (_req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store').json(liveness());
  };
  app.get('/v1/health', livenessHandler);
  app.get('/health', livenessHandler);
  app.get('/healthz', livenessHandler);

  // 3. Saúde profunda (deep) protegida por header
  const deepHandler = async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    const clientIp = req.ip || req.socket.remoteAddress || '?';
    const auth = authorize(clientIp, req.get('X-Health-Token'));

    if (auth === 401) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    if (auth === 429) {
      return res.status(429).json({ error: 'too many attempts' });
    }

    try {
      const { httpStatus, body } = await deep(prisma);
      return res.status(httpStatus).json(body);
    } catch {
      return res.status(503).json({
        protocol: 'office-health/1',
        status: 'down',
        service: {
          name: process.env.APP_NAME || 'Merenda Flow API',
          version: process.env.APP_VERSION ?? '2.0.0',
          environment: process.env.NODE_ENV ?? 'development',
          startedAt: startedAt.toISOString(),
          uptimeSeconds: Math.round(process.uptime()),
        },
        checks: {
          database: { status: 'down', critical: true, message: 'Falha interna no check de saúde' },
        },
        runtime: getRuntime(),
        checkedAt: new Date().toISOString(),
        durationMs: 0,
        cached: false,
      });
    }
  };
  app.get('/v1/health/deep', deepHandler);

  // 4. Versão
  const versionHandler = (_req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store').json({ version: process.env.APP_VERSION ?? '2.0.0' });
  };
  app.get('/version.json', versionHandler);
  app.get('/v1/health/version', versionHandler);
}

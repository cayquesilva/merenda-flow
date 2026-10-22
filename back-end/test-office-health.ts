import express from 'express';
import http from 'http';
import { AddressInfo } from 'net';
import { registrarOfficeHealth, resetHealthCache, resetHealthFailures } from './health';

async function runTests() {
  console.log('--- Iniciando testes do protocolo office-health/1 ---');

  const app = express();
  app.set('trust proxy', 1);

  // Mock do PrismaClient para os testes das rotas
  const mockPrisma = {
    $queryRawUnsafe: async (query: string) => {
      if (query.includes('SELECT 1')) {
        return [{ '?column?': 1 }];
      }
      if (query.includes('_prisma_migrations')) {
        return [
          {
            migration_name: '20250130000000_add_usuarios_table',
            finished_at: new Date(),
            rolled_back_at: null,
            applied_steps_count: 1,
          },
          {
            migration_name: '20250728165116_init',
            finished_at: new Date(),
            rolled_back_at: null,
            applied_steps_count: 1,
          },
        ];
      }
      return [];
    },
  } as any;

  process.env.HEALTH_TOKEN = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  process.env.APP_VERSION = '2.0.0-test';

  registrarOfficeHealth({ app, prisma: mockPrisma });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ PASSOU: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FALHOU: ${msg}`);
      failed++;
    }
  }

  try {
    // 1. Manifesto: /.well-known/office-health
    console.log('\n[1] Testando manifesto: /.well-known/office-health');
    const resManifest = await fetch(`${baseUrl}/.well-known/office-health`);
    assert(resManifest.status === 200, 'Manifesto retorna HTTP 200');
    assert(
      resManifest.headers.get('cache-control') === 'public, max-age=300',
      'Manifesto possui Cache-Control: public, max-age=300'
    );
    const bodyManifest = await resManifest.json();
    assert(bodyManifest.protocol === 'office-health/1', 'Manifesto protocol = office-health/1');
    assert(bodyManifest.kind === 'api', 'Manifesto kind = api');
    assert(bodyManifest.endpoints.liveness === '/v1/health', 'Manifesto endpoints.liveness = /v1/health');
    assert(bodyManifest.endpoints.deep === '/v1/health/deep', 'Manifesto endpoints.deep = /v1/health/deep');
    assert(bodyManifest.endpoints.version === '/version.json', 'Manifesto endpoints.version = /version.json');
    assert(bodyManifest.auth.deep.header === 'X-Health-Token', 'Manifesto auth header = X-Health-Token');
    assert(Array.isArray(bodyManifest.performance), 'Manifesto possui array performance');

    // 2. Liveness: /v1/health
    console.log('\n[2] Testando liveness: /v1/health');
    const resLiveness = await fetch(`${baseUrl}/v1/health`);
    assert(resLiveness.status === 200, 'Liveness retorna HTTP 200');
    assert(resLiveness.headers.get('cache-control') === 'no-store', 'Liveness possui Cache-Control: no-store');
    const bodyLiveness = await resLiveness.json();
    assert(bodyLiveness.status === 'ok', 'Liveness status = ok');
    assert(typeof bodyLiveness.checkedAt === 'string', 'Liveness checkedAt presente');
    assert(!('version' in bodyLiveness), 'Liveness não expõe versão (público)');
    assert(!('uptime' in bodyLiveness), 'Liveness não expõe uptime');

    // 3. Versão: /version.json
    console.log('\n[3] Testando versão: /version.json');
    const resVersion = await fetch(`${baseUrl}/version.json`);
    assert(resVersion.status === 200, 'Versão retorna HTTP 200');
    const bodyVersion = await resVersion.json();
    assert(bodyVersion.version === '2.0.0-test', 'Versão correta retornada');

    // 4. Deep: /v1/health/deep sem token
    console.log('\n[4] Testando deep sem token');
    const resDeepNoToken = await fetch(`${baseUrl}/v1/health/deep`);
    assert(resDeepNoToken.status === 401, 'Deep sem token retorna HTTP 401');

    // 5. Deep: /v1/health/deep com token incorreto
    console.log('\n[5] Testando deep com token incorreto');
    const resDeepWrongToken = await fetch(`${baseUrl}/v1/health/deep`, {
      headers: { 'X-Health-Token': 'wrong-token-invalid' },
    });
    assert(resDeepWrongToken.status === 401, 'Deep com token errado retorna HTTP 401');

    // 6. Deep: /v1/health/deep com token correto
    console.log('\n[6] Testando deep com token correto');
    const resDeepOk = await fetch(`${baseUrl}/v1/health/deep`, {
      headers: { 'X-Health-Token': process.env.HEALTH_TOKEN! },
    });
    assert(resDeepOk.status === 200, 'Deep com token correto retorna HTTP 200');
    assert(resDeepOk.headers.get('cache-control') === 'no-store', 'Deep possui Cache-Control: no-store');
    const rawText = await resDeepOk.text();
    assert(rawText.length < 65536, `Tamanho da resposta (${rawText.length} bytes) é menor que 64 KB`);
    const bodyDeep = JSON.parse(rawText);
    assert(bodyDeep.protocol === 'office-health/1', 'Deep protocol = office-health/1');
    assert(bodyDeep.status === 'ok', 'Deep status geral = ok');
    assert(bodyDeep.service.version === '2.0.0-test', 'Deep service.version = 2.0.0-test');
    assert(typeof bodyDeep.service.uptimeSeconds === 'number', 'Deep service.uptimeSeconds é número');
    assert(bodyDeep.checks.database.status === 'ok', 'Deep checks.database.status = ok');
    assert(bodyDeep.checks.database.critical === true, 'Deep checks.database.critical = true');
    assert(typeof bodyDeep.checks.database.latencyMs === 'number', 'Deep checks.database.latencyMs é número');
    assert(bodyDeep.checks.migrations.status === 'ok', 'Deep checks.migrations.status = ok');
    assert(bodyDeep.checks.migrations.applied === 2, 'Deep checks.migrations.applied = 2');
    assert(typeof bodyDeep.runtime.rssMb === 'number', 'Deep runtime.rssMb é número');
    assert(typeof bodyDeep.runtime.eventLoopDelayMeanMs === 'number', 'Deep runtime.eventLoopDelayMeanMs é número');
    assert(bodyDeep.cached === false, 'Primeira chamada Deep retorna cached: false');

    // 7. Teste de Cache no Deep
    console.log('\n[7] Testando cache no deep');
    const resDeepCache = await fetch(`${baseUrl}/v1/health/deep`, {
      headers: { 'X-Health-Token': process.env.HEALTH_TOKEN! },
    });
    const bodyDeepCache = await resDeepCache.json();
    assert(bodyDeepCache.cached === true, 'Segunda chamada Deep dentro de 10s retorna cached: true');

    // 8. Teste de Rate Limiting (429 após 10 tentativas erradas)
    console.log('\n[8] Testando rate limiting (429)');
    // Já fizemos 2 tentativas erradas (passos 4 e 5). Vamos fazer mais 8:
    for (let i = 0; i < 8; i++) {
      await fetch(`${baseUrl}/v1/health/deep`, { headers: { 'X-Health-Token': 'bad' } });
    }
    const resRateLimited = await fetch(`${baseUrl}/v1/health/deep`, { headers: { 'X-Health-Token': 'bad' } });
    assert(resRateLimited.status === 429, 'Após 10 tentativas com erro, retorna HTTP 429');

    // 9. Teste de Falha Crítica no Banco (503 / status down)
    console.log('\n[9] Testando falha crítica no banco (503 / down)');
    resetHealthCache();
    resetHealthFailures();
    const appFail = express();
    appFail.set('trust proxy', 1);
    const mockFailingPrisma = {
      $queryRawUnsafe: async () => {
        throw new Error('Database connection failed');
      },
    } as any;
    registrarOfficeHealth({ app: appFail, prisma: mockFailingPrisma });
    const serverFail = http.createServer(appFail);
    await new Promise<void>((res) => serverFail.listen(0, res));
    const portFail = (serverFail.address() as AddressInfo).port;
    try {
      const resFail = await fetch(`http://127.0.0.1:${portFail}/v1/health/deep`, {
        headers: { 'X-Health-Token': process.env.HEALTH_TOKEN! },
      });
      assert(resFail.status === 503, 'Quando banco cai, Deep retorna HTTP 503');
      const bodyFail = await resFail.json();
      assert(bodyFail.status === 'down', 'Deep status geral é "down"');
      assert(bodyFail.checks.database.status === 'down', 'checks.database.status é "down"');
      assert(bodyFail.checks.database.critical === true, 'checks.database.critical é true');
      assert(bodyFail.checks.database.message === 'Banco de dados inacessível', 'Mensagem sanitizada sem vazamento de dados');
    } finally {
      serverFail.close();
    }

  } finally {
    server.close();
  }

  console.log(`\n========================================`);
  console.log(`Testes finalizados: ${passed} passaram, ${failed} falharam.`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Erro na execução dos testes:', err);
  process.exit(1);
});

#!/bin/sh

# Este script Ã© o ponto de entrada do contÃªiner backend.
# Ele garante que o banco de dados esteja pronto, aplica migraÃ§Ãµes,
# executa o seed do Prisma e entÃ£o inicia a aplicaÃ§Ã£o.

echo "Iniciando entrypoint.sh..."

# --- Espera pelo Banco de Dados ---
# Ã‰ CRÃTICO que o banco de dados esteja acessÃ­vel antes de tentar migraÃ§Ãµes ou seed.
# O 'db' aqui refere-se ao nome do serviÃ§o do banco de dados no seu docker-compose.production.yml.
# A porta 5432 Ã© a porta padrÃ£o do PostgreSQL.
#
# Este Ã© um loop simples de espera. Para produÃ§Ã£o, considere ferramentas mais robustas
# como 'wait-for-it.sh' (https://github.com/vishnubob/wait-for-it) ou 'dockerize'.
# VocÃª precisaria adicionar 'nc' (netcat) Ã  sua imagem se usar esta abordagem simples.
# Exemplo com nc (vocÃª precisaria adicionar 'apk add netcat-openbsd' no Dockerfile):
# echo "Aguardando o serviÃ§o de banco de dados (db:5432)..."
# while ! nc -z db 5432; do
#   sleep 1 # Aguarda 1 segundo antes de tentar novamente
# done
# echo "Banco de dados estÃ¡ acessÃ­vel!"

# Uma alternativa mais simples para ambientes onde o 'depends_on' do Docker Compose/Swarm
# jÃ¡ Ã© suficiente para a ordem de inicializaÃ§Ã£o (mas nÃ£o garante a prontidÃ£o do DB):
echo "Aguardando um tempo para o banco de dados iniciar completamente..."
sleep 10 # Ajuste este valor conforme a necessidade de inicializaÃ§Ã£o do seu DB

# --- AplicaÃ§Ã£o das MigraÃ§Ãµes do Prisma ---
echo "Aplicando migraÃ§Ãµes do Prisma..."
# 'npx prisma migrate deploy' aplica todas as migraÃ§Ãµes pendentes.
# Ã‰ importante que isso ocorra antes do seed para garantir que o esquema esteja atualizado.
npx prisma migrate deploy
if [ $? -ne 0 ]; then
  echo "ERRO: Falha ao aplicar migraÃ§Ãµes do Prisma. Exiting."
  exit 1
fi
echo "MigraÃ§Ãµes do Prisma aplicadas com sucesso."

npx prisma generate
if [ $? -ne 0 ]; then
  echo "ERRO: Falha ao aplicar generate do Prisma. Exiting."
  exit 1
fi
echo "Generate do Prisma aplicadas com sucesso."

# --- ExecuÃ§Ã£o do Prisma Seed ---
echo "Executando Prisma Seed..."
# 'npx prisma db seed' executa o script de seed definido no seu package.json.
# Certifique-se de que seu script prisma/seed.js Ã© idempotente para evitar problemas
# se este contÃªiner for reiniciado ou se houver mÃºltiplas rÃ©plicas.
npx prisma db seed
if [ $? -ne 0 ]; then
  echo "AVISO: Falha ao executar o Prisma Seed. Isso pode ser normal se o seed jÃ¡ foi executado ou se nÃ£o for idempotente."
  # NÃ£o saÃ­mos aqui, pois a aplicaÃ§Ã£o ainda pode rodar mesmo se o seed falhar.
fi
echo "Prisma Seed executado."

# --- Inicia a AplicaÃ§Ã£o Backend ---
echo "Iniciando a aplicaÃ§Ã£o backend..."
# 'exec "$@"' executa o comando que foi passado como CMD no Dockerfile.
# Isso substitui o processo atual do shell pelo processo da aplicaÃ§Ã£o,
# garantindo que os sinais (como SIGTERM) sejam passados corretamente para a aplicaÃ§Ã£o.
exec "$@"
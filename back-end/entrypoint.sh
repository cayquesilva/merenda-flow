#!/bin/sh

# Este script é o ponto de entrada do contêiner backend.
# Ele garante que o banco de dados esteja pronto, aplica migrações,
# executa o seed do Prisma e então inicia a aplicação.

echo "Iniciando entrypoint.sh..."

# --- Espera pelo Banco de Dados ---
# É CRÍTICO que o banco de dados esteja acessível antes de tentar migrações ou seed.
# O 'db' aqui refere-se ao nome do serviço do banco de dados no seu docker-compose.production.yml.
# A porta 5432 é a porta padrão do PostgreSQL.
#
# Este é um loop simples de espera. Para produção, considere ferramentas mais robustas
# como 'wait-for-it.sh' (https://github.com/vishnubob/wait-for-it) ou 'dockerize'.
# Você precisaria adicionar 'nc' (netcat) à sua imagem se usar esta abordagem simples.
# Exemplo com nc (você precisaria adicionar 'apk add netcat-openbsd' no Dockerfile):
# echo "Aguardando o serviço de banco de dados (db:5432)..."
# while ! nc -z db 5432; do
#   sleep 1 # Aguarda 1 segundo antes de tentar novamente
# done
# echo "Banco de dados está acessível!"

# Uma alternativa mais simples para ambientes onde o 'depends_on' do Docker Compose/Swarm
# já é suficiente para a ordem de inicialização (mas não garante a prontidão do DB):
echo "Aguardando um tempo para o banco de dados iniciar completamente..."
sleep 10 # Ajuste este valor conforme a necessidade de inicialização do seu DB

# --- Aplicação das Migrações do Prisma ---
echo "Aplicando migrações do Prisma..."
# 'npx prisma migrate deploy' aplica todas as migrações pendentes.
# É importante que isso ocorra antes do seed para garantir que o esquema esteja atualizado.
npx prisma migrate deploy
if [ $? -ne 0 ]; then
  echo "ERRO: Falha ao aplicar migrações do Prisma. Exiting."
  exit 1
fi
echo "Migrações do Prisma aplicadas com sucesso."

npx prisma generate
if [ $? -ne 0 ]; then
  echo "ERRO: Falha ao aplicar generate do Prisma. Exiting."
  exit 1
fi
echo "Generate do Prisma aplicadas com sucesso."

# --- Execução do Prisma Seed ---
echo "Executando Prisma Seed..."
# 'npx prisma db seed' executa o script de seed definido no seu package.json.
# Certifique-se de que seu script prisma/seed.js é idempotente para evitar problemas
# se este contêiner for reiniciado ou se houver múltiplas réplicas.
npx prisma db seed
if [ $? -ne 0 ]; then
  echo "AVISO: Falha ao executar o Prisma Seed. Isso pode ser normal se o seed já foi executado ou se não for idempotente."
  # Não saímos aqui, pois a aplicação ainda pode rodar mesmo se o seed falhar.
fi
echo "Prisma Seed executado."

# --- Inicia a Aplicação Backend ---
echo "Iniciando a aplicação backend..."
# 'exec "$@"' executa o comando que foi passado como CMD no Dockerfile.
# Isso substitui o processo atual do shell pelo processo da aplicação,
# garantindo que os sinais (como SIGTERM) sejam passados corretamente para a aplicação.
exec "$@"
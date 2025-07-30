#!/bin/bash

# MerendaFlow Deploy Script for Docker Swarm

echo "🚀 Iniciando deploy do MerendaFlow..."

# Verificar se o Docker Swarm está ativo
if ! docker info | grep -q "Swarm: active"; then
    echo "❌ Docker Swarm não está ativo. Inicializando..."
    docker swarm init
fi

# Criar secrets (se não existirem)
echo "🔐 Configurando secrets..."
echo "CayqueSilva" | docker secret create postgres_user - 2>/dev/null || echo "Secret postgres_user já existe"
echo "Kiq3506!" | docker secret create postgres_password - 2>/dev/null || echo "Secret postgres_password já existe"

# Build das imagens
echo "🔨 Construindo imagens..."
docker build -t merendaflow-frontend:latest .
docker build -t merendaflow-backend:latest ./back-end

# Deploy do stack
echo "📦 Fazendo deploy do stack..."
docker stack deploy -c docker-stack.yml merendaflow

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 30

# Verificar status dos serviços
echo "📊 Status dos serviços:"
docker stack services merendaflow

echo "✅ Deploy concluído!"
echo "🌐 Aplicação disponível em: http://localhost"
echo "📊 Para monitorar: docker stack ps merendaflow"
echo "📋 Para logs: docker service logs merendaflow_frontend"
#!/bin/bash
set -e

# Versao padrao ou passada como primeiro argumento (ex: ./build-and-push.sh 3.0.1)
VERSION="${1:-3.0.1}"
API_URL="${VITE_API_URL:-https://api.merenda.portaleducampina.com.br}"

echo "========================================"
echo "Iniciando Build e Push - MerendaFlow"
echo "Versao : $VERSION"
echo "API URL: $API_URL"
echo "========================================"

# --- BACKEND ---
echo ""
echo "=== BACKEND ==="
echo "[INFO] Build da imagem do Backend ($VERSION e latest)..."
docker build \
  --build-arg APP_VERSION="$VERSION" \
  -t "cayquesilva/merendaflow-backend:$VERSION" \
  -t "cayquesilva/merendaflow-backend:latest" \
  ./back-end

echo "[INFO] Push da imagem do Backend ($VERSION)..."
docker push "cayquesilva/merendaflow-backend:$VERSION"

echo "[INFO] Push da imagem do Backend (latest)..."
docker push "cayquesilva/merendaflow-backend:latest"

# --- FRONTEND ---
echo ""
echo "=== FRONTEND ==="
echo "[INFO] Build da imagem do Frontend ($VERSION e latest)..."
docker build \
  --build-arg VITE_API_URL="$API_URL" \
  --build-arg APP_VERSION="$VERSION" \
  -t "cayquesilva/merendaflow-frontend:$VERSION" \
  -t "cayquesilva/merendaflow-frontend:latest" \
  .

echo "[INFO] Push da imagem do Frontend ($VERSION)..."
docker push "cayquesilva/merendaflow-frontend:$VERSION"

echo "[INFO] Push da imagem do Frontend (latest)..."
docker push "cayquesilva/merendaflow-frontend:latest"

echo ""
echo "========================================"
echo "[SUCESSO] Processo concluido com sucesso no Docker Hub!"
echo "Imagens publicadas:"
echo " - cayquesilva/merendaflow-backend:$VERSION"
echo " - cayquesilva/merendaflow-backend:latest"
echo " - cayquesilva/merendaflow-frontend:$VERSION"
echo " - cayquesilva/merendaflow-frontend:latest"
echo "========================================"

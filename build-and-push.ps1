param (
    [string]$Version = "3.0.1",
    [string]$ApiUrl = "https://api.merenda.portaleducampina.com.br"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Iniciando Build e Push - MerendaFlow" -ForegroundColor Cyan
Write-Host "Versao : $Version" -ForegroundColor Yellow
Write-Host "API URL: $ApiUrl" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

function Run-Step {
    param (
        [string]$Description,
        [scriptblock]$Action
    )
    Write-Host "`n[INFO] $Description..." -ForegroundColor Cyan
    & $Action
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n[ERRO] Falha em: $Description (Codigo: $LASTEXITCODE)" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "[OK] $Description concluido!" -ForegroundColor Green
}

# ----------------------------------------------------
# 1. BACKEND
# ----------------------------------------------------
Write-Host "`n=== BACKEND ===" -ForegroundColor Magenta

Run-Step "Build do Backend ($Version e latest)" {
    docker build `
        --build-arg APP_VERSION=$Version `
        -t "cayquesilva/merendaflow-backend:$Version" `
        -t "cayquesilva/merendaflow-backend:latest" `
        ./back-end
}

Run-Step "Push do Backend ($Version)" {
    docker push "cayquesilva/merendaflow-backend:$Version"
}

Run-Step "Push do Backend (latest)" {
    docker push "cayquesilva/merendaflow-backend:latest"
}

# ----------------------------------------------------
# 2. FRONTEND
# ----------------------------------------------------
Write-Host "`n=== FRONTEND ===" -ForegroundColor Magenta

Run-Step "Build do Frontend ($Version e latest)" {
    docker build `
        --build-arg VITE_API_URL=$ApiUrl `
        --build-arg APP_VERSION=$Version `
        -t "cayquesilva/merendaflow-frontend:$Version" `
        -t "cayquesilva/merendaflow-frontend:latest" `
        .
}

Run-Step "Push do Frontend ($Version)" {
    docker push "cayquesilva/merendaflow-frontend:$Version"
}

Run-Step "Push do Frontend (latest)" {
    docker push "cayquesilva/merendaflow-frontend:latest"
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "[SUCESSO] Processo concluido com sucesso no Docker Hub!" -ForegroundColor Green
Write-Host "Imagens publicadas:" -ForegroundColor Cyan
Write-Host " - cayquesilva/merendaflow-backend:$Version"
Write-Host " - cayquesilva/merendaflow-backend:latest"
Write-Host " - cayquesilva/merendaflow-frontend:$Version"
Write-Host " - cayquesilva/merendaflow-frontend:latest"
Write-Host "========================================" -ForegroundColor Cyan

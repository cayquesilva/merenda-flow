# --- Estágio de Build ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY prisma ./prisma
COPY . .

RUN npx prisma generate
RUN npm run build

# --- Estágio de Produção ---
FROM node:20-alpine

# Instala dependências do Chromium para Puppeteer funcionar
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev \
    bash \
    curl

# Variáveis para o Puppeteer funcionar corretamente com Chromium instalado via apk
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    CHROME_BIN=/usr/bin/chromium-browser

# Define diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependência
COPY --from=builder /app/package*.json ./

# Instala apenas dependências de produção
RUN npm install --only=production

# Copia código compilado e pastas necessárias
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copia o script de entrypoint e torna executável
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

# Expondo porta
EXPOSE 3001

# Entrypoint padrão e start do Node
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/index.js"]

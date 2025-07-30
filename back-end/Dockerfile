# --- Estágio de Build ---
# Usa uma imagem Node.js Alpine para um tamanho menor
FROM node:20-alpine AS builder

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia os arquivos package.json e package-lock.json (ou yarn.lock)
# para aproveitar o cache do Docker, instalando as dependências primeiro
COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies necessárias para o build e Prisma CLI)
RUN npm install

# Copia o Prisma e schema.prisma
COPY prisma ./prisma

# Copia o .env (ou defina manualmente dentro do container)
COPY . .

RUN npx prisma generate

# Executa o script de build do TypeScript (tsc) para compilar o código
# O resultado será colocado na pasta 'dist' (ou a pasta configurada no seu tsconfig.json)
RUN npm run build

# --- Estágio de Produção ---
# Usa uma imagem Node.js Alpine limpa para a aplicação final
FROM node:20-alpine

# Define o diretório de trabalho
WORKDIR /app

# Copia apenas os arquivos package.json e package-lock.json do estágio de build
COPY --from=builder /app/package*.json ./

# Instala apenas as dependências de produção
# Isso ajuda a manter a imagem final menor e mais segura
RUN npm install --only=production

# Copia os arquivos JavaScript compilados do estágio de build para o estágio de produção
# Certifique-se de que 'dist' é o diretório de saída do seu build TypeScript
COPY --from=builder /app/dist ./dist

# Copia a pasta 'prisma' inteira, que contém o schema.prisma e o script seed.js
# Isso é crucial para que o Prisma CLI e o seed funcionem em runtime
COPY --from=builder /app/prisma ./prisma

# Se você usa um arquivo .env em produção, copie-o também
# Certifique-se de que este arquivo não contenha informações sensíveis que não deveriam estar na imagem
# COPY --from=builder /app/.env ./.env

# Copia o script de entrypoint e o torna executável
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Expõe a porta em que sua aplicação backend irá rodar
EXPOSE 3000

# Define o script de entrypoint que será executado quando o contêiner iniciar
# Este script será responsável por esperar pelo DB, rodar migrações, o seed e iniciar a aplicação
ENTRYPOINT ["./entrypoint.sh"]

# Define o comando padrão que o entrypoint.sh irá executar no final
# Este é o comando para iniciar sua aplicação Node.js compilada
CMD ["node", "dist/index.js"]
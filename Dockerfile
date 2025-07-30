# Etapa de build
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY .env.production .env

COPY . .

RUN npm run build

# Etapa de execução usando `serve`
FROM node:18-alpine

WORKDIR /app

# Copia os arquivos estáticos do build
COPY --from=build /app/dist ./dist

# Instala servidor HTTP leve
RUN npm install -g serve

EXPOSE 3000

# Serve a pasta /dist com fallback para index.html (SPA)
CMD ["serve", "-s", "dist", "-l", "3000"]

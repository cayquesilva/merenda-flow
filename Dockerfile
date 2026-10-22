# Etapa de build
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

ARG VITE_API_URL=https://api.merenda.portaleducampina.com.br
ENV VITE_API_URL=$VITE_API_URL

COPY . .

RUN npm run build

# Etapa de execução
FROM node:18-alpine

WORKDIR /app

ARG APP_VERSION=2.0.0
ENV APP_VERSION=$APP_VERSION

# Copia os arquivos estáticos do build e o servidor
COPY --from=build /app/dist ./dist
COPY server.mjs ./

EXPOSE 3000

CMD ["node", "server.mjs"]

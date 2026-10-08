# Etapa de build
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

ARG VITE_API_URL=https://api.merenda.portaleducampina.com.br
ENV VITE_API_URL=$VITE_API_URL

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

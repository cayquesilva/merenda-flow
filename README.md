Merenda Flow
O Merenda Flow é um sistema de gestão para otimizar o fluxo de distribuição de merendas escolares, desde o controlo de contratos e fornecedores até à entrega nas unidades educacionais.

Funcionalidades
Gestão de Fornecedores: Cadastro e controlo de fornecedores.

Gestão de Contratos: Criação e acompanhamento de contratos de fornecimento, incluindo os seus itens e saldos.

Gestão de Unidades Educacionais: Cadastro das escolas e centros de ensino.

(Em desenvolvimento): Gestão de Pedidos, Controlo de Entregas e Recibos, Dashboard com Estatísticas.

Tecnologias Utilizadas
Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui

Backend: Node.js, Express, Prisma (ORM)

Banco de Dados: PostgreSQL (a correr em Docker)

🚀 Guia de Instalação e Execução
Siga os passos abaixo para configurar e executar o projeto no seu ambiente de desenvolvimento local.

1. Pré-requisitos
   Antes de começar, certifique-se de que tem os seguintes programas instalados na sua máquina:

Node.js (versão 18 ou superior)

npm (geralmente vem com o Node.js)

Docker e Docker Compose

2. Configuração do Projeto
   Primeiro, clone o repositório e instale as dependências do frontend e do backend.

# 1. Clone o repositório do GitHub

git clone <URL_DO_SEU_REPOSITORIO>
cd merenda-flow

# 2. Instale as dependências do Frontend (na raiz do projeto)

npm install

# 3. Navegue para a pasta do Backend e instale as suas dependências

cd backend
npm install

3. Configuração do Banco de Dados
   O sistema utiliza um banco de dados PostgreSQL que corre dentro de um contêiner Docker, facilitando a configuração.

3.1. Variáveis de Ambiente
Dentro da pasta backend, renomeie o ficheiro .env.example (se existir) para .env ou crie um novo ficheiro .env. Ele deve conter a URL de conexão para o banco de dados:

Ficheiro: backend/.env

# URL de conexão para o banco de dados PostgreSQL que será criado pelo Docker

# A senha "sua_senha_forte" deve ser a mesma definida no ficheiro docker-compose.yml

DATABASE_URL="postgresql://merenda_user:sua_senha_forte@localhost:5432/merenda_db"

3.2. Iniciar o Banco de Dados com Docker
Com o Docker em execução na sua máquina, utilize o Docker Compose para iniciar o contêiner do banco de dados.

# Na raiz do projeto (pasta 'merenda-flow')

docker-compose up -d

O comando -d (detached) faz com que o contêiner corra em segundo plano.

Para parar o contêiner, pode usar docker-compose down.

4. Migração e População do Banco de Dados (Seeding)
   Com o banco de dados a correr, precisamos de criar as tabelas e, opcionalmente, inserir alguns dados iniciais para teste.

# 1. Navegue para a pasta do backend

cd backend

# 2. Aplique as migrações do Prisma

# Este comando irá ler o ficheiro `schema.prisma` e criar todas as tabelas no banco.

npx prisma migrate dev

# 3. (Opcional) Popule o banco com dados iniciais

# Este comando executa o script `prisma/seed.js` para cadastrar dados de exemplo.

npx prisma db seed

Ao final destes passos, o seu banco de dados estará pronto e populado.

5. Executar a Aplicação
   Finalmente, vamos iniciar os servidores do backend e do frontend. Você precisará de dois terminais abertos.

Terminal 1 - Iniciar o Backend:

# A partir da pasta 'merenda-flow', navegue para o backend

cd backend

# Inicie o servidor da API

npm run start

# Ou, se não tiver o script "start", use: node index.js

O servidor da API estará a correr em http://localhost:3001.

Terminal 2 - Iniciar o Frontend:

# A partir da raiz do projeto ('merenda-flow')

npm run dev

A aplicação frontend estará acessível no seu navegador, geralmente em http://localhost:5173.

Pronto! O ambiente de desenvolvimento do Merenda Flow está totalmente configurado e em execução.

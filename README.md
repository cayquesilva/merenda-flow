# 🥗 Merenda Flow

O **Merenda Flow** é um sistema de gestão para otimizar o fluxo de distribuição de merendas escolares, desde o controle de contratos e fornecedores até a entrega nas unidades educacionais.

---

## 📦 Funcionalidades

- ✅ **Gestão de Fornecedores:** Cadastro e controle de fornecedores.
- ✅ **Gestão de Contratos:** Criação e acompanhamento de contratos, itens e saldos.
- ✅ **Gestão de Unidades Educacionais:** Cadastro de escolas e centros de ensino.
- 🚧 **Em desenvolvimento:**

  - Pedidos
  - Controle de Entregas e Recibos
  - Dashboard com estatísticas

---

## 💠 Tecnologias Utilizadas

| Camada       | Tecnologias                                      |
| ------------ | ------------------------------------------------ |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Backend**  | Node.js, Express, Prisma ORM                     |
| **Banco**    | PostgreSQL via Docker                            |

---

# 🚀 Guia de Instalação Local (Desenvolvimento)

## ✅ 1. Pré-requisitos

Instale os seguintes pacotes:

- Node.js 18+
- npm (incluído no Node.js)
- Docker e Docker Compose

---

## ✅ 2. Clonando o Projeto

```bash
git clone <URL_DO_REPOSITORIO>
cd merenda-flow
```

---

## ✅ 3. Instalação das Dependências

### Frontend

```bash
npm install
```

### Backend

```bash
cd backend
npm install
```

---

## ✅ 4. Banco de Dados com Docker

### 4.1. Criar `.env` no backend:

**Arquivo:** `backend/.env`

```env
DATABASE_URL="postgresql://merenda_user:sua_senha_forte@localhost:5432/merenda_db"
```

> Certifique-se que a senha e usuário estão de acordo com o `docker-compose.yml`.

### 4.2. Criar `docker-compose.yml` básico:

```yaml
version: "3.8"

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: merenda_db
      POSTGRES_USER: merenda_user
      POSTGRES_PASSWORD: sua_senha_forte
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### 4.3. Subir banco de dados:

```bash
docker-compose up -d
```

---

## ✅ 5. Migração e Seed do Banco

```bash
cd backend

npx prisma migrate dev
npx prisma db seed
```

---

## ✅ 6. Executar Projeto Local

### Backend (porta 3001):

```bash
cd backend
npm run start
```

### Frontend (porta 5173):

```bash
npm run dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

---

# 🚣 Guia de Deploy com Docker + Traefik (Produção)

## ✅ Requisitos

- Docker Swarm habilitado
- Traefik configurado como reverse proxy
- Rede externa Docker chamada `SimpliSoft`

---

## ✅ Exemplo de `docker-stack.yml`

```yaml
version: "3.8"

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: BANCO
      POSTGRES_USER: USER
      POSTGRES_PASSWORD: PASSWORD
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - SimpliSoft
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager

  backend:
    image: cayquesilva/merendaflow-backend:latest
    environment:
      DATABASE_URL: postgresql://USER:PASSWORD@LOCALDOBANCO:5432/BD
      FRONTEND_URL: https://frontend.seudominio
      NODE_ENV: production
    depends_on:
      - db
    networks:
      - SimpliSoft
    deploy:
      replicas: 2
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.merendaflow-backend.rule=Host(`frontend.seudominio`)"
        - "traefik.http.routers.merendaflow-backend.entrypoints=web,websecure"
        - "traefik.http.routers.merendaflow-backend.tls.certresolver=letsencryptresolver"
        - "traefik.http.services.merendaflow-backend.loadbalancer.server.port=3001"

  frontend:
    image: cayquesilva/merendaflow-frontend:latest
    environment:
      VITE_API_URL: https://api..seudominio
      NODE_ENV: production
    depends_on:
      - backend
    networks:
      - SimpliSoft
    deploy:
      replicas: 2
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.merendaflow-frontend.rule=Host(`frontend.seudominio`)"
        - "traefik.http.routers.merendaflow-frontend.entrypoints=web,websecure"
        - "traefik.http.routers.merendaflow-frontend.tls.certresolver=letsencryptresolver"
        - "traefik.http.services.merendaflow-frontend.loadbalancer.server.port=3000"

volumes:
  postgres_data:

networks:
  SimpliSoft:
    external: true
```

---

## ✅ Subir a Stack

```bash
docker stack deploy -c docker-stack.yml merenda
```

---

## ✅ Considerações Finais

- Verifique se as portas 80 e 443 estão liberadas para o Traefik.
- Certifique-se de que os domínios apontam corretamente para o IP do VPS.
- Traefik deve estar com resolução TLS via Let's Encrypt.

---

Pronto! Agora você possui um guia completo para execução local e implantação do Merenda Flow com Docker.

---

## 🎨 Funcionalidades de Interface

### Temas Claro e Escuro
O sistema possui suporte completo a temas claro e escuro, com transições suaves entre os modos. O seletor de tema está localizado na parte inferior da sidebar e oferece três opções:

- **Claro**: Tema claro tradicional
- **Escuro**: Tema escuro para reduzir o cansaço visual
- **Sistema**: Segue automaticamente a preferência do sistema operacional

### Paleta de Cores
O sistema utiliza uma paleta de cores baseada em tons de verde (160° no HSL), refletindo a identidade visual governamental:

- **Primária**: Verde institucional em diferentes saturações
- **Secundária**: Tons neutros complementares
- **Alertas**: Amarelo para avisos, vermelho para erros, verde para sucessos
- **Acentos**: Variações da cor primária para elementos interativos

---

## 📚 Documentação da API

A documentação completa das rotas da API está disponível no arquivo [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md).

### Principais Endpoints:

- **Autenticação**: `/api/auth/*`
- **Usuários**: `/api/usuarios/*`
- **Fornecedores**: `/api/fornecedores/*`
- **Unidades**: `/api/unidades/*`
- **Contratos**: `/api/contratos/*`
- **Pedidos**: `/api/pedidos/*`
- **Recibos**: `/api/recibos/*`
- **Estoque**: `/api/estoque/*`
- **Confirmações**: `/api/confirmacoes/*`
- **Relatórios**: `/api/relatorios/*`

### Collection do Postman
Para facilitar os testes da API, importe a collection do Postman disponível no repositório.

---

## 🤖 Como Interagir com o Assistente Bolt

Este projeto é assistido por uma inteligência artificial que pode auxiliar no desenvolvimento, estilização e documentação. Abaixo estão algumas instruções sobre como solicitar melhorias e informações:

### 🎨 Melhorias de Estilização e Temas

Para solicitar melhorias na estilização ou a implementação de temas (claro/escuro), seja o mais específico possível:

- **Para Estilização:** Indique o componente ou página, o objetivo da melhoria (ex: "tornar mais moderno", "melhorar legibilidade") e, se possível, forneça referências visuais.
  - **Exemplo:** "Melhore a estilização da página de `Dashboard`. Os cards de métricas devem ter um visual mais arrojado e os gráficos mais interativos."
- **Para Temas (Claro/Escuro):** Basta solicitar a adição da funcionalidade. O assistente utilizará as variáveis de CSS já configuradas e a biblioteca `next-themes` para implementar a alternância.
  - **Exemplo:** "Adicione a funcionalidade de tema claro e escuro ao aplicativo."

### 📚 Documentação da API

Para obter a documentação das rotas da API do backend, você pode solicitar diretamente:

- **Exemplo:** "Gere a documentação das rotas da minha API."

O assistente analisará o código do backend para fornecer detalhes sobre os endpoints, métodos HTTP, parâmetros e exemplos de resposta.

### 🔧 Melhorias Gerais

Para solicitar melhorias gerais no sistema:

- **Funcionalidades:** "Adicione funcionalidade de [descrição]"
- **Performance:** "Otimize a performance da página [nome]"
- **UX/UI:** "Melhore a experiência do usuário em [contexto]"
- **Acessibilidade:** "Torne o sistema mais acessível"

---

## 🎓 Sistema Educacional Avançado

O sistema possui funcionalidades específicas para o contexto educacional:

### 📊 Controle de Estudantes por Modalidade
- **Berçário e Maternal**: Classificados como "Creche"
- **Turmas Regulares, Integrais e EJA**: Classificados como "Escola"
- Cada unidade registra a quantidade de estudantes por modalidade

### 🧮 Sistema de Percápita
- Configuração de gramagem por estudante para cada item
- Frequência semanal de consumo configurável
- Cálculo automático de quantidades nos pedidos baseado na percápita

### 📦 Estoque Separado por Tipo
- **Estoque de Creches**: Para berçário e maternal
- **Estoque de Escolas**: Para turmas regulares, integrais e EJA
- Controle independente de saldos nos contratos
- Movimentações específicas por tipo de estoque

### 🎯 Cálculo Inteligente de Pedidos
O sistema calcula automaticamente as quantidades necessárias baseado em:
- Número de estudantes por modalidade na unidade
- Percápita configurada para cada item e tipo de estudante
- Disponibilidade no estoque apropriado (creche ou escola)
- Saldo disponível no contrato por tipo

---

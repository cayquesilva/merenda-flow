# 📚 Documentação da API - Sistema Merenda Flow

Esta documentação descreve todas as rotas disponíveis na API do Sistema de Gestão de Contratos de Merenda.

## 🔗 Base URL
```
http://localhost:3001/api
```

---

## 🔐 Autenticação

### POST `/auth/login`
Realiza o login do usuário no sistema.

**Body:**
```json
{
  "email": "admin@sistema.gov.br",
  "senha": "admin123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "uuid",
    "nome": "Administrador",
    "email": "admin@sistema.gov.br",
    "categoria": "administracao_tecnica",
    "ativo": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET `/auth/me`
Retorna os dados do usuário autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "uuid",
  "nome": "Administrador",
  "email": "admin@sistema.gov.br",
  "categoria": "administracao_tecnica",
  "ativo": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

## 👥 Usuários

### GET `/usuarios`
Lista todos os usuários do sistema.

**Query Parameters:**
- `q` (opcional): Termo de busca por nome ou email

**Response (200):**
```json
[
  {
    "id": "uuid",
    "nome": "João Silva",
    "email": "joao@sistema.gov.br",
    "categoria": "gerencia_nutricao",
    "ativo": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET `/usuarios/:id`
Retorna um usuário específico.

**Response (200):**
```json
{
  "id": "uuid",
  "nome": "João Silva",
  "email": "joao@sistema.gov.br",
  "categoria": "gerencia_nutricao",
  "ativo": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### POST `/usuarios`
Cria um novo usuário.

**Body:**
```json
{
  "nome": "Maria Santos",
  "email": "maria@sistema.gov.br",
  "senha": "senha123",
  "categoria": "comissao_recebimento",
  "ativo": true
}
```

### PUT `/usuarios/:id`
Atualiza um usuário existente.

**Body:**
```json
{
  "nome": "Maria Santos Silva",
  "email": "maria.silva@sistema.gov.br",
  "categoria": "gerencia_nutricao",
  "ativo": true
}
```

### DELETE `/usuarios/:id`
Remove um usuário do sistema.

**Response (204):** Sem conteúdo

---

## 🏢 Fornecedores

### GET `/fornecedores`
Lista todos os fornecedores.

**Query Parameters:**
- `q` (opcional): Termo de busca por nome, CNPJ ou email

**Response (200):**
```json
[
  {
    "id": "uuid",
    "nome": "Alimentos Frescos Ltda",
    "cnpj": "12345678000190",
    "telefone": "11999999999",
    "email": "contato@alimentosfrescos.com.br",
    "endereco": "Rua das Flores, 123 - São Paulo/SP",
    "ativo": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET `/fornecedores/lista`
Lista simplificada de fornecedores (apenas ID e nome).

**Response (200):**
```json
[
  {
    "id": "uuid",
    "nome": "Alimentos Frescos Ltda"
  }
]
```

### POST `/fornecedores`
Cria um novo fornecedor.

**Body:**
```json
{
  "nome": "Distribuidora Verde",
  "cnpj": "98765432000110",
  "telefone": "11888888888",
  "email": "vendas@verde.com.br",
  "endereco": "Av. Central, 456 - São Paulo/SP",
  "ativo": true
}
```

### PUT `/fornecedores/:id`
Atualiza um fornecedor existente.

### DELETE `/fornecedores/:id`
Remove um fornecedor do sistema.

---

## 🏫 Unidades Educacionais

### GET `/unidades`
Lista todas as unidades educacionais.

**Query Parameters:**
- `q` (opcional): Termo de busca por nome, código ou email

**Response (200):**
```json
[
  {
    "id": "uuid",
    "nome": "EMEI Jardim das Flores",
    "codigo": "JF001",
    "endereco": "Rua A, 100 - Bairro Central",
    "telefone": "11333333333",
    "email": "jardimflores@edu.sp.gov.br",
    "ativo": true
  }
]
```

### GET `/unidades-ativas`
Lista apenas as unidades educacionais ativas.

### POST `/unidades`
Cria uma nova unidade educacional.

**Body:**
```json
{
  "nome": "EMEF Vila Nova",
  "codigo": "VN002",
  "endereco": "Rua B, 200 - Vila Nova",
  "telefone": "11444444444",
  "email": "vilanova@edu.sp.gov.br",
  "ativo": true
}
```

### PUT `/unidades/:id`
Atualiza uma unidade educacional existente.

---

## 📄 Contratos

### GET `/contratos`
Lista todos os contratos.

**Query Parameters:**
- `q` (opcional): Termo de busca por número do contrato ou fornecedor

**Response (200):**
```json
[
  {
    "id": "uuid",
    "numero": "CT-2024-001",
    "dataInicio": "2024-01-01T00:00:00.000Z",
    "dataFim": "2024-12-31T00:00:00.000Z",
    "valorTotal": 250000.00,
    "status": "ativo",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "fornecedor": {
      "nome": "Alimentos Frescos Ltda"
    },
    "_count": {
      "itens": 5
    }
  }
]
```

### GET `/contratos/:id`
Retorna um contrato específico com todos os detalhes.

**Response (200):**
```json
{
  "id": "uuid",
  "numero": "CT-2024-001",
  "dataInicio": "2024-01-01T00:00:00.000Z",
  "dataFim": "2024-12-31T00:00:00.000Z",
  "valorTotal": 250000.00,
  "status": "ativo",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "fornecedor": {
    "id": "uuid",
    "nome": "Alimentos Frescos Ltda",
    "cnpj": "12345678000190",
    "email": "contato@alimentosfrescos.com.br"
  },
  "itens": [
    {
      "id": "uuid",
      "nome": "Arroz Integral",
      "valorUnitario": 5.50,
      "quantidadeOriginal": 10000,
      "saldoAtual": 8500,
      "unidadeMedida": {
        "id": "uuid",
        "nome": "Quilograma",
        "sigla": "kg"
      }
    }
  ]
}
```

### GET `/contratos-ativos`
Lista apenas os contratos ativos (para seleção em pedidos).

### POST `/contratos`
Cria um novo contrato.

**Body:**
```json
{
  "numero": "CT-2024-002",
  "fornecedorId": "uuid",
  "dataInicio": "2024-02-01T00:00:00.000Z",
  "dataFim": "2024-12-31T00:00:00.000Z",
  "status": "ativo",
  "itens": [
    {
      "nome": "Feijão Preto",
      "unidadeMedidaId": "uuid",
      "valorUnitario": 8.90,
      "quantidadeOriginal": 5000,
      "saldoAtual": 5000
    }
  ]
}
```

### PUT `/contratos/:id`
Atualiza um contrato existente (apenas dados básicos, não os itens).

---

## 🛒 Pedidos

### GET `/pedidos`
Lista todos os pedidos.

**Query Parameters:**
- `q` (opcional): Termo de busca por número do pedido ou fornecedor
- `status` (opcional): Filtro por status (pendente, confirmado, entregue, cancelado)

**Response (200):**
```json
[
  {
    "id": "uuid",
    "numero": "PD-2024-001",
    "dataPedido": "2024-07-20T00:00:00.000Z",
    "dataEntregaPrevista": "2024-07-25T00:00:00.000Z",
    "status": "confirmado",
    "valorTotal": 15750.00,
    "contrato": {
      "fornecedor": {
        "nome": "Alimentos Frescos Ltda"
      }
    },
    "_count": {
      "itens": 3
    }
  }
]
```

### GET `/pedidos/:id`
Retorna um pedido específico com todos os detalhes.

### GET `/pedidos/stats`
Retorna estatísticas dos pedidos.

**Response (200):**
```json
{
  "total": 25,
  "pendentes": 5,
  "entregues": 18,
  "valorTotal": 125000.00
}
```

### GET `/pedidos-para-recibo`
Lista pedidos confirmados disponíveis para gerar recibos.

### POST `/pedidos`
Cria um novo pedido.

**Body:**
```json
{
  "contratoId": "uuid",
  "dataEntregaPrevista": "2024-07-25T00:00:00.000Z",
  "valorTotal": 15750.00,
  "itens": [
    {
      "itemContratoId": "uuid",
      "unidadeEducacionalId": "uuid",
      "quantidade": 500
    }
  ]
}
```

---

## 🧾 Recibos

### GET `/recibos`
Lista todos os recibos.

**Query Parameters:**
- `q` (opcional): Termo de busca por número do recibo, pedido ou fornecedor
- `status` (opcional): Filtro por status (pendente, confirmado, parcial, rejeitado)

### GET `/recibos/:id`
Retorna um recibo específico com todos os detalhes.

### GET `/recibos/stats`
Retorna estatísticas dos recibos.

### GET `/recibos/confirmacao/:id`
Retorna dados do recibo para confirmação de recebimento.

### GET `/recibos/imprimir/:id`
Retorna dados do recibo formatados para impressão.

### GET `/recibos/imprimir-pedido/:pedidoId`
Retorna todos os recibos de um pedido para impressão.

### POST `/recibos`
Gera um novo recibo para um pedido.

**Body:**
```json
{
  "pedidoId": "uuid",
  "dataEntrega": "2024-07-25T00:00:00.000Z"
}
```

### POST `/recibos/confirmacao/:id`
Confirma o recebimento de um recibo.

**Body:**
```json
{
  "responsavel": "Maria Santos",
  "observacoes": "Entrega realizada conforme solicitado",
  "assinaturaDigital": "data:image/png;base64,iVBOR...",
  "fotoReciboAssinado": "data:image/jpeg;base64,/9j/4AAQ...",
  "itensConfirmacao": [
    {
      "itemId": "uuid",
      "conforme": true,
      "quantidadeRecebida": 500,
      "observacoes": ""
    }
  ]
}
```

---

## 📦 Estoque

### GET `/estoque/consolidado`
Lista o estoque consolidado de todas as unidades.

**Query Parameters:**
- `q` (opcional): Termo de busca por nome do item
- `unidadeId` (opcional): Filtro por unidade educacional
- `estoqueId` (opcional): Filtro por ID específico do estoque

**Response (200):**
```json
[
  {
    "id": "uuid",
    "quantidadeAtual": 150,
    "quantidadeMinima": 50,
    "ultimaAtualizacao": "2024-07-25T00:00:00.000Z",
    "itemContrato": {
      "nome": "Arroz Integral",
      "valorUnitario": 5.50,
      "unidadeMedida": {
        "sigla": "kg"
      },
      "contrato": {
        "numero": "CT-2024-001",
        "fornecedor": {
          "nome": "Alimentos Frescos Ltda"
        }
      }
    },
    "unidadeEducacional": {
      "nome": "EMEI Jardim das Flores"
    }
  }
]
```

### GET `/estoque/movimentacoes`
Lista o histórico de movimentações de estoque.

**Query Parameters:**
- `q` (opcional): Termo de busca
- `unidadeId` (opcional): Filtro por unidade

### GET `/estoque/catalogo-qrcode/:unidadeId`
Lista itens de estoque de uma unidade para gerar catálogo de QR Codes.

### POST `/estoque/movimentacao`
Registra uma nova movimentação de estoque.

**Body:**
```json
{
  "estoqueId": "uuid",
  "tipo": "saida",
  "quantidade": 10,
  "motivo": "Distribuição para merenda",
  "responsavel": "Maria Santos"
}
```

### POST `/estoque/saida-qrcode/:estoqueId`
Registra saída de estoque via QR Code.

**Body:**
```json
{
  "quantidade": 1
}
```

---

## ✅ Confirmações

### GET `/confirmacoes`
Lista consolidações de pedidos e confirmações detalhadas.

**Response (200):**
```json
{
  "consolidacoes": [
    {
      "pedidoId": "uuid",
      "pedido": {
        "numero": "PD-2024-001",
        "dataPedido": "2024-07-20T00:00:00.000Z",
        "valorTotal": 15750.00,
        "contrato": {
          "fornecedor": {
            "nome": "Alimentos Frescos Ltda"
          }
        }
      },
      "statusConsolidacao": "completo",
      "totalUnidades": 3,
      "unidadesConfirmadas": 3,
      "percentualConfirmacao": 100
    }
  ],
  "confirmacoesDetalhadas": []
}
```

---

## 📊 Relatórios

### GET `/relatorios/consolidado-pedidos-data/:contratoId`
Retorna dados consolidados de pedidos por contrato.

### POST `/relatorios/consolidado-pedidos/:contratoId`
Gera relatório consolidado de pedidos (PDF).

### GET `/relatorios/entregas`
Gera relatório de entregas por período.

**Query Parameters:**
- `dataInicio`: Data de início (YYYY-MM-DD)
- `dataFim`: Data de fim (YYYY-MM-DD)
- `unidadeId` (opcional): Filtro por unidade

### GET `/relatorios/conformidade`
Gera relatório de conformidade das entregas.

**Query Parameters:**
- `dataInicio`: Data de início (YYYY-MM-DD)
- `dataFim`: Data de fim (YYYY-MM-DD)

### GET `/relatorios/gastos-fornecedor`
Gera relatório de gastos por fornecedor.

**Query Parameters:**
- `dataInicio`: Data de início (YYYY-MM-DD)
- `dataFim`: Data de fim (YYYY-MM-DD)
- `fornecedorId` (opcional): Filtro por fornecedor

### GET `/relatorios/estoque-unidade`
Gera relatório de estoque por unidade.

**Query Parameters:**
- `dataInicio`: Data de início (YYYY-MM-DD)
- `dataFim`: Data de fim (YYYY-MM-DD)
- `unidadeId` (opcional): Filtro por unidade

### GET `/relatorios/movimentacao-responsavel`
Gera relatório de movimentações por responsável.

**Query Parameters:**
- `dataInicio`: Data de início (YYYY-MM-DD)
- `dataFim`: Data de fim (YYYY-MM-DD)
- `responsavel` (opcional): Filtro por responsável

---

## 🔧 Utilitários

### GET `/unidades-medida`
Lista todas as unidades de medida disponíveis.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "nome": "Quilograma",
    "sigla": "kg"
  }
]
```

### GET `/dashboard-data`
Retorna dados consolidados para o dashboard.

**Response (200):**
```json
{
  "metrics": {
    "totalContratos": 5,
    "contratosAtivos": 3,
    "totalFornecedores": 8,
    "totalPedidos": 25,
    "valorTotalContratos": 500000.00,
    "consolidacoesPendentes": 2,
    "eficienciaEntrega": 95.5
  },
  "alerts": {
    "itensComSaldoBaixo": [],
    "contratosVencendo": []
  },
  "recentContracts": []
}
```

### GET `/test-db`
Testa a conexão com o banco de dados.

**Response (200):**
```json
{
  "status": "sucesso",
  "message": "Conexão com o banco de dados estabelecida com sucesso"
}
```

### GET `/movimentacoes/responsaveis`
Lista todos os responsáveis que já fizeram movimentações.

**Response (200):**
```json
[
  "Maria Santos",
  "João Silva",
  "Ana Costa"
]
```

---

## 🧮 Percápita de Estudantes

### GET `/percapita`
Lista todas as percápitas cadastradas.

**Query Parameters:**
- `q` (opcional): Termo de busca por item ou tipo de estudante

**Response (200):**
```json
[
  {
    "id": "uuid",
    "gramagemPorEstudante": 150.5,
    "frequenciaMensal": 5,
    "ativo": true,
    "itemContrato": {
      "nome": "Arroz Integral",
      "contrato": {
        "numero": "CT-2024-001",
        "fornecedor": {
          "nome": "Alimentos Frescos Ltda"
        }
      }
    },
    "tipoEstudante": {
      "nome": "Berçário",
      "sigla": "BER",
      "categoria": "creche"
    }
  }
]
```

### POST `/percapita`
Cria uma nova percápita.

**Body:**
```json
{
  "itemContratoId": "uuid-do-item-contrato",
  "tipoEstudanteId": "uuid-do-tipo-estudante",
  "gramagemPorEstudante": 150.5,
  "frequenciaMensal": 5,
  "ativo": true
}
```

### PUT `/percapita/:id`
Atualiza uma percápita existente.

### DELETE `/percapita/:id`
Remove uma percápita do sistema.

### GET `/tipos-estudante`
Lista todos os tipos de estudantes disponíveis.

**Response (200):**
```json
[
  {
    "id": "bercario",
    "nome": "Berçário",
    "sigla": "BER",
    "categoria": "creche",
    "ordem": 1
  }
]
```

---

## 📝 Códigos de Status HTTP

- **200**: Sucesso
- **201**: Criado com sucesso
- **204**: Sem conteúdo (para operações de exclusão)
- **400**: Erro de validação ou dados inválidos
- **401**: Não autorizado (token inválido ou ausente)
- **403**: Acesso negado (sem permissão)
- **404**: Recurso não encontrado
- **409**: Conflito (ex: email já cadastrado)
- **500**: Erro interno do servidor

---

## 🔒 Autenticação e Autorização

Todas as rotas (exceto `/auth/login` e `/test-db`) requerem autenticação via token JWT no header:

```
Authorization: Bearer {token}
```

O sistema possui três categorias de usuários com diferentes permissões:

1. **Administração Técnica**: Acesso completo a todos os módulos
2. **Gerência de Nutrição**: Acesso a contratos, fornecedores, unidades, pedidos, recibos e relatórios
3. **Comissão de Recebimento**: Acesso apenas a confirmações e visualização de estoque

---

## 📋 Exemplos de Uso com cURL

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.gov.br","senha":"admin123"}'
```

### Listar Contratos
```bash
curl -X GET http://localhost:3001/api/contratos \
  -H "Authorization: Bearer {token}"
```

### Criar Fornecedor
```bash
curl -X POST http://localhost:3001/api/fornecedores \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Novo Fornecedor",
    "cnpj": "12345678000199",
    "email": "contato@novofornecedor.com.br",
    "ativo": true
  }'
```

---

## 🚀 Collection do Postman

Para facilitar os testes, você pode importar a collection do Postman com todos os endpoints configurados:

1. Abra o Postman
2. Clique em "Import"
3. Cole a URL: `{URL_DO_SEU_REPOSITORIO}/postman_collection.json`
4. Configure a variável de ambiente `base_url` como `http://localhost:3001/api`
5. Configure a variável `token` após fazer login

---

*Documentação gerada automaticamente - Última atualização: Janeiro 2025*
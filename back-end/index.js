// Carrega as variáveis de ambiente do arquivo .env
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg"); // Driver de conexão com o PostgreSQL

const app = express();
const port = 3001; // A porta onde sua API vai rodar

// Habilita o CORS para que seu frontend (rodando em outra porta) possa fazer requisições
app.use(cors());
app.use(express.json());

// Cria o "pool" de conexões com o banco de dados
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Rota de exemplo para criar a tabela de 'alunos'
app.get("/api/setup/create-alunos-table", async (req, res) => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS alunos (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                turma VARCHAR(50),
                data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
    res
      .status(200)
      .send({ message: 'Tabela "alunos" verificada/criada com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Erro ao criar a tabela de alunos." });
  }
});

// Rota para buscar todos os alunos
app.get("/api/alunos", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM alunos ORDER BY nome ASC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Erro ao buscar alunos." });
  }
});

app.get("/api/test-db", async (req, res) => {
  try {
    // A API está falhando ao executar esta linha
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Conexão com o banco de dados bem-sucedida!",
      time: result.rows[0].now,
    });
  } catch (err) {
    // E está executando este bloco, enviando o erro para o frontend
    console.error("Erro ao conectar ao banco de dados", err.stack);
    res.status(500).json({ error: "Falha ao conectar ao banco de dados" });
  }
});

app.listen(port, () => {
  console.log(`🚀 API do Merenda Flow rodando em http://localhost:${port}`);
  // Uma boa prática é testar a conexão quando o servidor inicia
  pool.query("SELECT NOW()", (err, res) => {
    if (err) {
      console.error("❌ Erro de conexão com o banco de dados:", err.message);
    } else {
      console.log("✅ Conexão com o banco de dados PostgreSQL bem-sucedida!");
    }
  });
});

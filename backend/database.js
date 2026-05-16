const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'estoque.db');

let db = null;

function salvar() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

let dirty = false;
setInterval(() => { if (dirty) { salvar(); dirty = false; } }, 5000);

function prepare(sql) {
  return {
    run: (...params) => { db.run(sql, params); dirty = true; },
    get: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) { const row = stmt.getAsObject(); stmt.free(); return row; }
      stmt.free(); return undefined;
    },
    all: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free(); return rows;
    },
  };
}

function transaction(fn) {
  return () => {
    db.run('BEGIN');
    try { fn(); db.run('COMMIT'); dirty = true; }
    catch (e) { db.run('ROLLBACK'); throw e; }
  };
}

async function init() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }

  // Produtos
  db.run(`CREATE TABLE IF NOT EXISTS produtos (
    id TEXT PRIMARY KEY, nome TEXT NOT NULL, descricao TEXT DEFAULT '',
    categoria TEXT DEFAULT 'Geral', unidade TEXT DEFAULT 'un',
    estoque_minimo INTEGER DEFAULT 0, estoque_atual INTEGER DEFAULT 0,
    preco_custo REAL DEFAULT 0, localizacao TEXT DEFAULT '', ativo INTEGER DEFAULT 1,
    criado_em TEXT DEFAULT (datetime('now','localtime')),
    atualizado_em TEXT DEFAULT (datetime('now','localtime'))
  );`);

  // Depósitos
  db.run(`CREATE TABLE IF NOT EXISTS depositos (
    id TEXT PRIMARY KEY, nome TEXT NOT NULL, descricao TEXT DEFAULT '',
    responsavel TEXT DEFAULT '', ativo INTEGER DEFAULT 1,
    criado_em TEXT DEFAULT (datetime('now','localtime'))
  );`);

  // Estoque por depósito
  db.run(`CREATE TABLE IF NOT EXISTS estoque_deposito (
    produto_id TEXT NOT NULL, deposito_id TEXT NOT NULL,
    quantidade INTEGER DEFAULT 0,
    PRIMARY KEY (produto_id, deposito_id)
  );`);

  // Séries
  db.run(`CREATE TABLE IF NOT EXISTS series (
    id TEXT PRIMARY KEY, produto_id TEXT NOT NULL, deposito_id TEXT,
    numero_serie TEXT NOT NULL UNIQUE, status TEXT DEFAULT 'disponivel',
    nota_entrada TEXT DEFAULT '', nota_saida TEXT DEFAULT '',
    criado_em TEXT DEFAULT (datetime('now','localtime'))
  );`);

  // Movimentações
  db.run(`CREATE TABLE IF NOT EXISTS movimentacoes (
    id TEXT PRIMARY KEY, produto_id TEXT NOT NULL,
    deposito_origem_id TEXT, deposito_destino_id TEXT,
    tipo TEXT NOT NULL, quantidade INTEGER NOT NULL,
    motivo TEXT DEFAULT '', numero_documento TEXT DEFAULT '',
    fornecedor_cliente TEXT DEFAULT '', observacao TEXT DEFAULT '',
    usuario_id TEXT, criado_em TEXT DEFAULT (datetime('now','localtime'))
  );`);

  // Movimentação séries
  db.run(`CREATE TABLE IF NOT EXISTS movimentacao_series (
    movimentacao_id TEXT NOT NULL, serie_id TEXT NOT NULL,
    PRIMARY KEY (movimentacao_id, serie_id)
  );`);

  // Usuários
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY, nome TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL, perfil TEXT DEFAULT 'operador', ativo INTEGER DEFAULT 1,
    criado_em TEXT DEFAULT (datetime('now','localtime'))
  );`);

  // Criar admin padrão se não existir
  const admin = prepare('SELECT id FROM usuarios WHERE email=?').get('admin@estoque.com');
  if (!admin) {
    const { v4: uuidv4 } = require('uuid');
    const senha = bcrypt.hashSync('admin123', 10);
    const now = new Date().toLocaleString('sv-SE');
    prepare('INSERT INTO usuarios (id,nome,email,senha,perfil,criado_em) VALUES (?,?,?,?,?,?)')
      .run(uuidv4(), 'Administrador', 'admin@estoque.com', senha, 'admin', now);
    console.log('👤 Usuário admin criado: admin@estoque.com / admin123');
  }

  // Criar depósito padrão se não existir
  const dep = prepare('SELECT id FROM depositos WHERE ativo=1').get();
  if (!dep) {
    const { v4: uuidv4 } = require('uuid');
    const now = new Date().toLocaleString('sv-SE');
    prepare('INSERT INTO depositos (id,nome,descricao,criado_em) VALUES (?,?,?,?)')
      .run(uuidv4(), 'Depósito Principal', 'Depósito padrão', now);
    console.log('🏭 Depósito principal criado');
  }

  salvar();
  console.log('✅ Banco de dados inicializado');
  return { prepare, transaction, salvar };
}

module.exports = { init };

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { init } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'estoque_secret_2024';

app.use(cors());
app.use(express.json());

let DB;

// ─── MIDDLEWARE AUTH ─────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Token inválido' }); }
}

function adminOnly(req, res, next) {
  if (req.usuario.perfil !== 'admin') return res.status(403).json({ error: 'Acesso restrito ao administrador' });
  next();
}

// ─── AUTH ────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: 'Email e senha obrigatórios' });
    const user = DB.prepare('SELECT * FROM usuarios WHERE email=? AND ativo=1').get(email);
    if (!user || !bcrypt.compareSync(senha, user.senha)) return res.status(401).json({ error: 'Email ou senha incorretos' });
    const token = jwt.sign({ id: user.id, nome: user.nome, email: user.email, perfil: user.perfil }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, usuario: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', auth, (req, res) => res.json(req.usuario));

// ─── USUÁRIOS ────────────────────────────────────────────
app.get('/api/usuarios', auth, adminOnly, (req, res) => {
  try { res.json(DB.prepare('SELECT id,nome,email,perfil,ativo,criado_em FROM usuarios ORDER BY nome').all()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/usuarios', auth, adminOnly, (req, res) => {
  try {
    const { nome, email, senha, perfil } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ error: 'Nome, email e senha obrigatórios' });
    const existe = DB.prepare('SELECT id FROM usuarios WHERE email=?').get(email);
    if (existe) return res.status(400).json({ error: 'Email já cadastrado' });
    const id = uuidv4();
    const hash = bcrypt.hashSync(senha, 10);
    const now = new Date().toLocaleString('sv-SE');
    DB.prepare('INSERT INTO usuarios (id,nome,email,senha,perfil,criado_em) VALUES (?,?,?,?,?,?)').run(id, nome, email, hash, perfil||'operador', now);
    res.status(201).json({ id, nome, email, perfil: perfil||'operador' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/usuarios/:id', auth, adminOnly, (req, res) => {
  try {
    const { nome, perfil, ativo, senha } = req.body;
    if (senha) {
      const hash = bcrypt.hashSync(senha, 10);
      DB.prepare('UPDATE usuarios SET nome=?,perfil=?,ativo=?,senha=? WHERE id=?').run(nome, perfil, ativo?1:0, hash, req.params.id);
    } else {
      DB.prepare('UPDATE usuarios SET nome=?,perfil=?,ativo=? WHERE id=?').run(nome, perfil, ativo?1:0, req.params.id);
    }
    res.json({ message: 'Usuário atualizado' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── DEPÓSITOS ───────────────────────────────────────────
app.get('/api/depositos', auth, (req, res) => {
  try { res.json(DB.prepare('SELECT * FROM depositos WHERE ativo=1 ORDER BY nome').all()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/depositos', auth, adminOnly, (req, res) => {
  try {
    const { nome, descricao, responsavel } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome obrigatório' });
    const id = uuidv4();
    const now = new Date().toLocaleString('sv-SE');
    DB.prepare('INSERT INTO depositos (id,nome,descricao,responsavel,criado_em) VALUES (?,?,?,?,?)').run(id, nome, descricao||'', responsavel||'', now);
    res.status(201).json(DB.prepare('SELECT * FROM depositos WHERE id=?').get(id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/depositos/:id', auth, adminOnly, (req, res) => {
  try {
    const { nome, descricao, responsavel } = req.body;
    DB.prepare('UPDATE depositos SET nome=?,descricao=?,responsavel=? WHERE id=?').run(nome, descricao||'', responsavel||'', req.params.id);
    res.json(DB.prepare('SELECT * FROM depositos WHERE id=?').get(req.params.id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/depositos/:id', auth, adminOnly, (req, res) => {
  try { DB.prepare('UPDATE depositos SET ativo=0 WHERE id=?').run(req.params.id); res.json({ message: 'Depósito removido' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Estoque por depósito
app.get('/api/depositos/:id/estoque', auth, (req, res) => {
  try {
    const rows = DB.prepare(`
      SELECT p.*, COALESCE(ed.quantidade,0) as qtd_deposito
      FROM produtos p
      LEFT JOIN estoque_deposito ed ON ed.produto_id=p.id AND ed.deposito_id=?
      WHERE p.ativo=1 ORDER BY p.nome
    `).all(req.params.id);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PRODUTOS ────────────────────────────────────────────
app.get('/api/produtos', auth, (req, res) => {
  try {
    const { busca, categoria, baixo_estoque } = req.query;
    let sql = 'SELECT * FROM produtos WHERE ativo=1';
    const params = [];
    if (busca) { sql += ' AND (nome LIKE ? OR descricao LIKE ? OR categoria LIKE ?)'; params.push(`%${busca}%`,`%${busca}%`,`%${busca}%`); }
    if (categoria) { sql += ' AND categoria=?'; params.push(categoria); }
    if (baixo_estoque==='true') sql += ' AND estoque_atual<=estoque_minimo AND estoque_minimo>0';
    sql += ' ORDER BY nome ASC';
    res.json(DB.prepare(sql).all(...params));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/produtos/:id', auth, (req, res) => {
  try {
    const p = DB.prepare('SELECT * FROM produtos WHERE id=?').get(req.params.id);
    if (!p) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(p);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/produtos', auth, (req, res) => {
  try {
    const { nome, descricao, categoria, unidade, estoque_minimo, preco_custo, localizacao } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome obrigatório' });
    const id = uuidv4(); const now = new Date().toLocaleString('sv-SE');
    DB.prepare(`INSERT INTO produtos (id,nome,descricao,categoria,unidade,estoque_minimo,preco_custo,localizacao,criado_em,atualizado_em) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(id, nome, descricao||'', categoria||'Geral', unidade||'un', estoque_minimo||0, preco_custo||0, localizacao||'', now, now);
    res.status(201).json(DB.prepare('SELECT * FROM produtos WHERE id=?').get(id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/produtos/:id', auth, (req, res) => {
  try {
    const { nome, descricao, categoria, unidade, estoque_minimo, preco_custo, localizacao } = req.body;
    const now = new Date().toLocaleString('sv-SE');
    DB.prepare(`UPDATE produtos SET nome=?,descricao=?,categoria=?,unidade=?,estoque_minimo=?,preco_custo=?,localizacao=?,atualizado_em=? WHERE id=?`)
      .run(nome, descricao, categoria, unidade, estoque_minimo, preco_custo, localizacao, now, req.params.id);
    res.json(DB.prepare('SELECT * FROM produtos WHERE id=?').get(req.params.id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/produtos/:id', auth, (req, res) => {
  try { DB.prepare('UPDATE produtos SET ativo=0 WHERE id=?').run(req.params.id); res.json({ message: 'Produto removido' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/categorias', auth, (req, res) => {
  try { res.json(DB.prepare('SELECT DISTINCT categoria FROM produtos WHERE ativo=1 ORDER BY categoria').all().map(c=>c.categoria)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── SÉRIES ──────────────────────────────────────────────
app.get('/api/produtos/:id/series', auth, (req, res) => {
  try { res.json(DB.prepare('SELECT * FROM series WHERE produto_id=? ORDER BY criado_em DESC').all(req.params.id)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/series/buscar/:numero', auth, (req, res) => {
  try {
    const s = DB.prepare(`SELECT s.*, p.nome as produto_nome, d.nome as deposito_nome FROM series s JOIN produtos p ON p.id=s.produto_id LEFT JOIN depositos d ON d.id=s.deposito_id WHERE s.numero_serie=?`).get(req.params.numero);
    if (!s) return res.status(404).json({ error: 'Número de série não encontrado' });
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── MOVIMENTAÇÕES ───────────────────────────────────────
app.post('/api/movimentacoes', auth, (req, res) => {
  try {
    const { produto_id, deposito_origem_id, deposito_destino_id, tipo, quantidade, motivo, numero_documento, fornecedor_cliente, observacao, series: numSeries } = req.body;
    if (!produto_id || !tipo || !quantidade) return res.status(400).json({ error: 'produto_id, tipo e quantidade obrigatórios' });

    const produto = DB.prepare('SELECT * FROM produtos WHERE id=?').get(produto_id);
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
    if (tipo==='saida' && produto.estoque_atual < quantidade) return res.status(400).json({ error: 'Estoque insuficiente' });

    const movId = uuidv4(); const now = new Date().toLocaleString('sv-SE');

    DB.prepare(`INSERT INTO movimentacoes (id,produto_id,deposito_origem_id,deposito_destino_id,tipo,quantidade,motivo,numero_documento,fornecedor_cliente,observacao,usuario_id,criado_em) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(movId, produto_id, deposito_origem_id||null, deposito_destino_id||null, tipo, quantidade, motivo||'', numero_documento||'', fornecedor_cliente||'', observacao||'', req.usuario.id, now);

    const delta = tipo==='entrada' ? quantidade : tipo==='saida' ? -quantidade : 0;
    if (delta !== 0) {
      DB.prepare(`UPDATE produtos SET estoque_atual=estoque_atual+?,atualizado_em=? WHERE id=?`).run(delta, now, produto_id);
    }

    // Atualizar estoque por depósito
    if (tipo==='entrada' && deposito_destino_id) {
      const ed = DB.prepare('SELECT * FROM estoque_deposito WHERE produto_id=? AND deposito_id=?').get(produto_id, deposito_destino_id);
      if (ed) DB.prepare('UPDATE estoque_deposito SET quantidade=quantidade+? WHERE produto_id=? AND deposito_id=?').run(quantidade, produto_id, deposito_destino_id);
      else DB.prepare('INSERT INTO estoque_deposito (produto_id,deposito_id,quantidade) VALUES (?,?,?)').run(produto_id, deposito_destino_id, quantidade);
    }
    if (tipo==='saida' && deposito_origem_id) {
      DB.prepare('UPDATE estoque_deposito SET quantidade=quantidade-? WHERE produto_id=? AND deposito_id=?').run(quantidade, produto_id, deposito_origem_id);
    }
    if (tipo==='transferencia') {
      if (deposito_origem_id) DB.prepare('UPDATE estoque_deposito SET quantidade=quantidade-? WHERE produto_id=? AND deposito_id=?').run(quantidade, produto_id, deposito_origem_id);
      if (deposito_destino_id) {
        const ed = DB.prepare('SELECT * FROM estoque_deposito WHERE produto_id=? AND deposito_id=?').get(produto_id, deposito_destino_id);
        if (ed) DB.prepare('UPDATE estoque_deposito SET quantidade=quantidade+? WHERE produto_id=? AND deposito_id=?').run(quantidade, produto_id, deposito_destino_id);
        else DB.prepare('INSERT INTO estoque_deposito (produto_id,deposito_id,quantidade) VALUES (?,?,?)').run(produto_id, deposito_destino_id, quantidade);
      }
    }

    // Séries
    if (numSeries && numSeries.length > 0) {
      for (const ns of numSeries) {
        let serieId;
        if (tipo==='entrada') {
          serieId = uuidv4();
          DB.prepare(`INSERT INTO series (id,produto_id,deposito_id,numero_serie,status,nota_entrada,criado_em) VALUES (?,?,?,'disponivel',?,?,?)`)
            .run(serieId, produto_id, deposito_destino_id||null, ns, numero_documento||'', now);
        } else {
          const serie = DB.prepare('SELECT * FROM series WHERE numero_serie=? AND produto_id=?').get(ns, produto_id);
          if (!serie) throw new Error(`Número de série ${ns} não encontrado`);
          serieId = serie.id;
          DB.prepare(`UPDATE series SET status='saida',nota_saida=? WHERE id=?`).run(numero_documento||'', serieId);
        }
        DB.prepare('INSERT INTO movimentacao_series (movimentacao_id,serie_id) VALUES (?,?)').run(movId, serieId);
      }
    }

    res.status(201).json(DB.prepare('SELECT * FROM movimentacoes WHERE id=?').get(movId));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/movimentacoes', auth, (req, res) => {
  try {
    const { produto_id, tipo, deposito_id, data_inicio, data_fim, limit=200 } = req.query;
    let sql = `SELECT m.*, p.nome as produto_nome, u.nome as usuario_nome,
      do1.nome as deposito_origem_nome, do2.nome as deposito_destino_nome
      FROM movimentacoes m JOIN produtos p ON p.id=m.produto_id
      LEFT JOIN usuarios u ON u.id=m.usuario_id
      LEFT JOIN depositos do1 ON do1.id=m.deposito_origem_id
      LEFT JOIN depositos do2 ON do2.id=m.deposito_destino_id
      WHERE 1=1`;
    const params = [];
    if (produto_id) { sql += ' AND m.produto_id=?'; params.push(produto_id); }
    if (tipo) { sql += ' AND m.tipo=?'; params.push(tipo); }
    if (deposito_id) { sql += ' AND (m.deposito_origem_id=? OR m.deposito_destino_id=?)'; params.push(deposito_id, deposito_id); }
    if (data_inicio) { sql += ' AND m.criado_em>=?'; params.push(data_inicio); }
    if (data_fim) { sql += ' AND m.criado_em<=?'; params.push(data_fim+' 23:59:59'); }
    sql += ' ORDER BY m.criado_em DESC LIMIT ?'; params.push(parseInt(limit));
    res.json(DB.prepare(sql).all(...params));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── DASHBOARD ───────────────────────────────────────────
app.get('/api/dashboard', auth, (req, res) => {
  try {
    const hoje = new Date().toISOString().slice(0,10);
    const seteDias = new Date(Date.now()-7*24*60*60*1000).toISOString().slice(0,10);
    const totalProdutos = DB.prepare('SELECT COUNT(*) as t FROM produtos WHERE ativo=1').get().t;
    const baixoEstoque = DB.prepare('SELECT COUNT(*) as t FROM produtos WHERE ativo=1 AND estoque_atual<=estoque_minimo AND estoque_minimo>0').get().t;
    const totalItens = DB.prepare('SELECT SUM(estoque_atual) as t FROM produtos WHERE ativo=1').get().t || 0;
    const entradasHoje = DB.prepare(`SELECT COALESCE(SUM(quantidade),0) as t FROM movimentacoes WHERE tipo='entrada' AND criado_em LIKE ?`).get(`${hoje}%`).t;
    const saidasHoje = DB.prepare(`SELECT COALESCE(SUM(quantidade),0) as t FROM movimentacoes WHERE tipo='saida' AND criado_em LIKE ?`).get(`${hoje}%`).t;
    const totalDepositos = DB.prepare('SELECT COUNT(*) as t FROM depositos WHERE ativo=1').get().t;
    const movRecentes = DB.prepare(`SELECT m.*,p.nome as produto_nome,u.nome as usuario_nome FROM movimentacoes m JOIN produtos p ON p.id=m.produto_id LEFT JOIN usuarios u ON u.id=m.usuario_id ORDER BY m.criado_em DESC LIMIT 10`).all();
    const produtosBaixo = DB.prepare(`SELECT * FROM produtos WHERE ativo=1 AND estoque_atual<=estoque_minimo AND estoque_minimo>0 ORDER BY (estoque_atual-estoque_minimo) ASC LIMIT 5`).all();
    const movPorDia = DB.prepare(`SELECT substr(criado_em,1,10) as dia, SUM(CASE WHEN tipo='entrada' THEN quantidade ELSE 0 END) as entradas, SUM(CASE WHEN tipo='saida' THEN quantidade ELSE 0 END) as saidas FROM movimentacoes WHERE criado_em>=? GROUP BY substr(criado_em,1,10) ORDER BY dia ASC`).all(seteDias);
    res.json({ totalProdutos, baixoEstoque, totalItens, entradasHoje, saidasHoje, totalDepositos, movRecentes, produtosBaixo, movPorDia });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── INICIAR ─────────────────────────────────────────────
init().then(database => {
  DB = database;
  app.listen(PORT, () => console.log(`✅ Servidor rodando em http://localhost:${PORT}`));
}).catch(err => { console.error('Erro:', err); process.exit(1); });

// routes/clientes.js
'use strict';

const express  = require('express');
const router   = express.Router();
const { getDB } = require('../db/connection');
const { authenticate, authorize } = require('../middleware/auth');

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const addDays = (isoDate, days) => {
  const d = new Date(isoDate + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const nowStr = () => new Date().toISOString().replace('T', ' ').split('.')[0];

// Gera/re-gera todas as parcelas semanais de um cliente
const gerarParcelas = (db, cliente) => {
  db.prepare('DELETE FROM parcelas WHERE cliente_id = ?').run(cliente.id);

  const insert = db.prepare(`
    INSERT INTO parcelas (id, cliente_id, numero_parcela, data_parcela, valor, status)
    VALUES (?, ?, ?, ?, ?, 'a_pagar')
  `);

  const run = db.transaction((c) => {
    for (let i = 1; i <= c.qtd_parcelas; i++) {
      insert.run(uid(), c.id, i, addDays(c.data_contrato, (i - 1) * 7), c.valor_parcela);
    }
  });
  run(cliente);
};

// Todas as rotas requerem autenticação
router.use(authenticate);

// ── GET /api/clientes ─────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const db  = getDB();
  const { q } = req.query;

  let sql = `
    SELECT c.*,
      COUNT(p.id) AS total_parcelas,
      SUM(CASE WHEN p.status IN ('pago','pagamento_dia') THEN 1 ELSE 0 END) AS parcelas_pagas
    FROM clientes c
    LEFT JOIN parcelas p ON p.cliente_id = c.id
    WHERE c.ativo = 1
  `;
  const params = [];

  if (q?.trim()) {
    sql += ` AND (c.nome LIKE ? OR c.cnpj LIKE ? OR c.cpf LIKE ? OR c.estabelecimento LIKE ?)`;
    const like = `%${q.trim()}%`;
    params.push(like, like, like, like);
  }

  sql += ' GROUP BY c.id ORDER BY c.nome COLLATE NOCASE';
  res.json(db.prepare(sql).all(...params));
});

// ── GET /api/clientes/:id ─────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const c = getDB().prepare('SELECT * FROM clientes WHERE id = ? AND ativo = 1').get(req.params.id);
  if (!c) return res.status(404).json({ erro: 'Cliente não encontrado.' });
  res.json(c);
});

// ── POST /api/clientes ── (admin, cobranca, atendimento) ──────────────────
router.post('/', authorize('admin', 'cobranca', 'atendimento'), (req, res) => {
  const { nome, estabelecimento, cpf, cnpj, telefone, cep, referencias,
          data_contrato, qtd_parcelas, valor_parcela, consultor } = req.body;

  if (!nome?.trim() || !estabelecimento?.trim() || !data_contrato || !qtd_parcelas || valor_parcela == null) {
    return res.status(400).json({ erro: 'Campos obrigatórios: nome, estabelecimento, data_contrato, qtd_parcelas, valor_parcela.' });
  }

  const qtd  = parseInt(qtd_parcelas);
  const vlr  = parseFloat(valor_parcela);

  if (isNaN(qtd) || qtd < 1 || qtd > 520) return res.status(400).json({ erro: 'Qtd. parcelas inválida.' });
  if (isNaN(vlr) || vlr < 0)              return res.status(400).json({ erro: 'Valor de parcela inválido.' });

  const db  = getDB();
  const id  = uid();
  const now = nowStr();

  db.prepare(`
    INSERT INTO clientes
      (id, nome, estabelecimento, cpf, cnpj, telefone, cep, referencias,
       data_contrato, qtd_parcelas, valor_parcela, consultor, criado_em, atualizado_em)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, nome.trim(), estabelecimento.trim(), cpf||'', cnpj||'',
         telefone||'', cep||'', referencias||'', data_contrato, qtd, vlr, consultor||'', now, now);

  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
  gerarParcelas(db, cliente);

  res.status(201).json({ ok: true, id });
});

// ── PUT /api/clientes/:id ── (admin, cobranca, atendimento) ───────────────
router.put('/:id', authorize('admin', 'cobranca', 'atendimento'), (req, res) => {
  const { nome, estabelecimento, cpf, cnpj, telefone, cep, referencias,
          data_contrato, qtd_parcelas, valor_parcela, consultor } = req.body;

  const qtd  = parseInt(qtd_parcelas);
  const vlr  = parseFloat(valor_parcela);

  if (!nome?.trim() || isNaN(qtd) || isNaN(vlr)) {
    return res.status(400).json({ erro: 'Dados inválidos.' });
  }

  const db   = getDB();
  const now  = nowStr();
  const info = db.prepare(`
    UPDATE clientes SET
      nome=?, estabelecimento=?, cpf=?, cnpj=?, telefone=?, cep=?,
      referencias=?, data_contrato=?, qtd_parcelas=?, valor_parcela=?,
      consultor=?, atualizado_em=?
    WHERE id=? AND ativo=1
  `).run(nome.trim(), estabelecimento.trim(), cpf||'', cnpj||'',
         telefone||'', cep||'', referencias||'', data_contrato,
         qtd, vlr, consultor||'', now, req.params.id);

  if (info.changes === 0) return res.status(404).json({ erro: 'Cliente não encontrado.' });

  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  gerarParcelas(db, cliente);

  res.json({ ok: true });
});

// ── DELETE /api/clientes/:id ── (admin only) ──────────────────────────────
router.delete('/:id', authorize('admin'), (req, res) => {
  const db   = getDB();
  const now  = nowStr();
  const info = db.prepare(
    `UPDATE clientes SET ativo = 0, atualizado_em = ? WHERE id = ?`
  ).run(now, req.params.id);

  if (info.changes === 0) return res.status(404).json({ erro: 'Cliente não encontrado.' });
  res.json({ ok: true });
});

module.exports = router;

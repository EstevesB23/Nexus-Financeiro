// routes/aprovacoes.js
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

const gerarParcelas = (db, cliente) => {
  db.prepare('DELETE FROM parcelas WHERE cliente_id = ?').run(cliente.id);
  const insert = db.prepare(`
    INSERT INTO parcelas (id, cliente_id, numero_parcela, data_parcela, valor, status)
    VALUES (?, ?, ?, ?, ?, 'a_pagar')
  `);
  const run = db.transaction((c) => {
    for (let i = 1; i <= c.qtd_parcelas; i++) {
      const vlr = Math.round((c.valor_parcela / c.qtd_parcelas) * 100) / 100;
      insert.run(uid(), c.id, i, addDays(c.data_contrato, (i - 1) * 7), vlr);
    }
  });
  run(cliente);
};

router.use(authenticate);

// ── GET /api/aprovacoes/count ── (admin) ──────────────────────────────────
router.get('/count', authorize('admin'), (req, res) => {
  const db = getDB();
  const row = db.prepare(
    "SELECT COUNT(*) AS total FROM clientes WHERE status_aprovacao = 'pendente' AND ativo = 1"
  ).get();
  res.json({ total: row.total });
});

// ── GET /api/aprovacoes ── (admin) ────────────────────────────────────────
router.get('/', authorize('admin'), (req, res) => {
  const db = getDB();
  const clientes = db.prepare(`
    SELECT id, nome, estabelecimento, cpf, cnpj, telefone, banco,
           consultor, data_contrato, qtd_parcelas, valor_parcela,
           referencias, cep, criado_em
    FROM clientes
    WHERE status_aprovacao = 'pendente' AND ativo = 1
    ORDER BY criado_em DESC
  `).all();
  res.json(clientes);
});

// ── PUT /api/aprovacoes/:id ── (admin) ────────────────────────────────────
router.put('/:id', authorize('admin'), (req, res) => {
  const { acao, motivo } = req.body;

  if (!['aprovar', 'rejeitar'].includes(acao)) {
    return res.status(400).json({ erro: 'Ação inválida. Use "aprovar" ou "rejeitar".' });
  }

  const db  = getDB();
  const now = nowStr();

  const cliente = db.prepare(
    "SELECT * FROM clientes WHERE id = ? AND status_aprovacao = 'pendente' AND ativo = 1"
  ).get(req.params.id);

  if (!cliente) return res.status(404).json({ erro: 'Cliente pendente não encontrado.' });

  if (acao === 'aprovar') {
    db.prepare(`
      UPDATE clientes SET status_aprovacao = 'aprovado', atualizado_em = ? WHERE id = ?
    `).run(now, req.params.id);
    gerarParcelas(db, cliente);
    return res.json({ ok: true, acao: 'aprovado' });
  }

  // rejeitar
  db.prepare(`
    UPDATE clientes
    SET status_aprovacao = 'rejeitado', motivo_rejeicao = ?, ativo = 0, atualizado_em = ?
    WHERE id = ?
  `).run(motivo?.trim() || null, now, req.params.id);

  res.json({ ok: true, acao: 'rejeitado' });
});

module.exports = router;

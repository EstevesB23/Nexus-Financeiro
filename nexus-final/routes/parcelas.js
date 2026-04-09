// routes/parcelas.js
'use strict';

const express  = require('express');
const router   = express.Router();
const { getDB } = require('../db/connection');
const { authenticate, authorize } = require('../middleware/auth');

const STATUS_VALIDOS = [
  'pago','a_pagar','atrasado','data_diferente','pagamento_dia',
  'um_dia_util','em_acordo','parcela_promocional','inadimplente','protestado'
];

router.use(authenticate);

// IMPORTANTE: rotas fixas ANTES das rotas com :id ─────────────────────────

// ── GET /api/parcelas/anos ────────────────────────────────────────────────
router.get('/anos', (req, res) => {
  const db   = getDB();
  const anos = db.prepare(
    `SELECT DISTINCT strftime('%Y', data_parcela) AS ano FROM parcelas ORDER BY ano`
  ).all().map(r => r.ano);
  res.json(anos);
});

// ── GET /api/parcelas/proximas ────────────────────────────────────────────
router.get('/proximas', (req, res) => {
  const db   = getDB();
  const hoje = new Date().toISOString().split('T')[0];
  const fim  = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; })();

  const lista = db.prepare(`
    SELECT p.*,
      c.nome AS cliente_nome,
      c.estabelecimento,
      c.qtd_parcelas AS total_parcelas
    FROM parcelas p
    JOIN clientes c ON c.id = p.cliente_id
    WHERE c.ativo = 1
      AND p.data_parcela BETWEEN ? AND ?
      AND p.status NOT IN ('pago','pagamento_dia')
    ORDER BY p.data_parcela ASC
    LIMIT 20
  `).all(hoje, fim);

  res.json(lista);
});

// ── GET /api/parcelas ─────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const db = getDB();
  const { mes, ano, status, q, inadimplente, protestado } = req.query;

  let sql = `
    SELECT p.*,
      c.nome         AS cliente_nome,
      c.estabelecimento,
      c.cnpj, c.cpf,
      c.telefone,
      c.consultor,
      c.qtd_parcelas AS total_parcelas
    FROM parcelas p
    JOIN clientes c ON c.id = p.cliente_id
    WHERE c.ativo = 1
  `;
  const params = [];

  if (mes)         { sql += ` AND strftime('%m', p.data_parcela) = ?`; params.push(mes.toString().padStart(2, '0')); }
  if (ano)         { sql += ` AND strftime('%Y', p.data_parcela) = ?`; params.push(ano.toString()); }
  if (status && STATUS_VALIDOS.includes(status)) { sql += ` AND p.status = ?`; params.push(status); }
  if (q?.trim())   { const like = `%${q.trim()}%`; sql += ` AND (c.nome LIKE ? OR c.estabelecimento LIKE ?)`; params.push(like, like); }

  if (inadimplente === '1') sql += ` AND p.status IN ('atrasado','inadimplente','protestado')`;
  if (protestado   === '1') sql += ` AND p.status = 'protestado'`;

  sql += ' ORDER BY p.data_parcela ASC';
  res.json(db.prepare(sql).all(...params));
});

// ── PATCH /api/parcelas/:id/status ───────────────────────────────────────
// Permite: admin, cobranca (não permite: inadimplencia, atendimento)
router.patch(
  '/:id/status',
  authorize('admin', 'cobranca'),
  (req, res) => {
    const { status, observacao } = req.body;

    if (!STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({ erro: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}` });
    }

    const db    = getDB();
    const now   = new Date().toISOString().replace('T', ' ').split('.')[0];
    const pagoEm = ['pago', 'pagamento_dia'].includes(status) ? now : null;

    const info = db.prepare(`
      UPDATE parcelas
      SET status=?, observacao=?, pago_em=?, atualizado_em=?
      WHERE id=?
    `).run(status, observacao?.trim() || null, pagoEm, now, req.params.id);

    if (info.changes === 0) return res.status(404).json({ erro: 'Parcela não encontrada.' });
    res.json({ ok: true });
  }
);

module.exports = router;

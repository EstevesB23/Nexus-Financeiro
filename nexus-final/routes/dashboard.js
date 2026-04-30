// routes/dashboard.js
'use strict';

const express  = require('express');
const router   = express.Router();
const { getDB } = require('../db/connection');
const { authenticate, authorize } = require('../middleware/auth');

// Dashboard: apenas admin e cobrança
router.get('/', authenticate, authorize('admin', 'cobranca'), (req, res) => {
  const db   = getDB();
  const hoje = new Date().toISOString().split('T')[0];
  const ano  = new Date().getFullYear().toString();

  const kpis = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM clientes WHERE ativo = 1)                                                AS total_clientes,
      SUM(CASE WHEN p.status IN ('pago','pagamento_dia') THEN 1 ELSE 0 END)                         AS pagas,
      SUM(CASE WHEN p.status NOT IN ('pago','pagamento_dia') AND p.data_parcela >= ? THEN 1 ELSE 0 END) AS pendentes,
      SUM(CASE WHEN p.status IN ('atrasado','inadimplente','protestado')             THEN 1 ELSE 0 END) AS atrasadas,
      SUM(CASE WHEN p.status IN ('pago','pagamento_dia') THEN p.valor ELSE 0 END)                   AS receita_total
    FROM parcelas p
    JOIN clientes c ON c.id = p.cliente_id
    WHERE c.ativo = 1
  `).get(hoje);

  const mensal = db.prepare(`
    SELECT
      CAST(strftime('%m', data_parcela) AS INTEGER) AS mes,
      SUM(valor)                                    AS total
    FROM parcelas p
    JOIN clientes c ON c.id = p.cliente_id
    WHERE c.ativo = 1
      AND strftime('%Y', data_parcela) = ?
      AND status IN ('pago','pagamento_dia')
    GROUP BY mes
    ORDER BY mes
  `).all(ano);

  const receitaMensal = Array.from({ length: 12 }, (_, i) => {
    const found = mensal.find(r => r.mes === i + 1);
    return found ? found.total : 0;
  });

  const inadimplentes = db.prepare(`
    SELECT
      COUNT(DISTINCT p.cliente_id)                                          AS clientes_inadimplentes,
      COUNT(*)                                                              AS parcelas_atrasadas,
      SUM(p.valor)                                                          AS valor_aberto,
      SUM(CASE WHEN p.status = 'protestado' THEN 1 ELSE 0 END)             AS protestados
    FROM parcelas p
    JOIN clientes c ON c.id = p.cliente_id
    WHERE c.ativo = 1
      AND p.status IN ('atrasado','inadimplente','protestado')
  `).get();

  res.json({ kpis, receitaMensal, inadimplentes, ano: parseInt(ano) });
});

module.exports = router;

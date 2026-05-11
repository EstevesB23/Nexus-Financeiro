// routes/dashboard.js
'use strict';

const express   = require('express');
const router    = express.Router();
const { getDB } = require('../db/connection');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin', 'cobranca'), (req, res) => {
  const db   = getDB();
  const hoje = new Date().toISOString().split('T')[0];
  const ano  = (req.query.ano || new Date().getFullYear()).toString();

  const banco     = req.query.banco?.trim()     || '';
  const consultor = req.query.consultor?.trim() || '';

  // Monta cláusula WHERE dinâmica
  const conds = ['c.ativo = 1'];
  const p     = [];

  if (banco)     { conds.push('c.banco = ?');     p.push(banco); }
  if (consultor) { conds.push('c.consultor = ?'); p.push(consultor); }

  const cWhere = conds.join(' AND ');

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = db.prepare(`
    SELECT
      COUNT(DISTINCT p.cliente_id)                                                                        AS total_clientes,
      SUM(CASE WHEN p.status IN ('pago','pagamento_dia') THEN 1 ELSE 0 END)                              AS pagas,
      SUM(CASE WHEN p.status NOT IN ('pago','pagamento_dia') AND p.data_parcela >= ? THEN 1 ELSE 0 END)  AS pendentes,
      SUM(CASE WHEN p.status IN ('atrasado','inadimplente','protestado') THEN 1 ELSE 0 END)              AS atrasadas,
      SUM(CASE WHEN p.status IN ('pago','pagamento_dia') THEN p.valor ELSE 0 END)                        AS receita_total,
      SUM(CASE WHEN p.status NOT IN ('pago','pagamento_dia') THEN p.valor ELSE 0 END)                    AS a_receber
    FROM parcelas p
    JOIN clientes c ON c.id = p.cliente_id
    WHERE ${cWhere}
  `).get(hoje, ...p);

  // ── Receita mensal (filtrada) ─────────────────────────────────────────────
  const mensal = db.prepare(`
    SELECT
      CAST(strftime('%m', data_parcela) AS INTEGER) AS mes,
      SUM(valor)                                    AS total
    FROM parcelas p
    JOIN clientes c ON c.id = p.cliente_id
    WHERE ${cWhere}
      AND strftime('%Y', data_parcela) = ?
      AND status IN ('pago','pagamento_dia')
    GROUP BY mes
    ORDER BY mes
  `).all(...p, ano);

  const receitaMensal = Array.from({ length: 12 }, (_, i) => {
    const found = mensal.find(r => r.mes === i + 1);
    return found ? found.total : 0;
  });

  // ── Inadimplência ─────────────────────────────────────────────────────────
  const inadimplentes = db.prepare(`
    SELECT
      COUNT(DISTINCT p.cliente_id)                                  AS clientes_inadimplentes,
      COUNT(*)                                                      AS parcelas_atrasadas,
      SUM(p.valor)                                                  AS valor_aberto,
      SUM(CASE WHEN p.status = 'protestado' THEN 1 ELSE 0 END)     AS protestados
    FROM parcelas p
    JOIN clientes c ON c.id = p.cliente_id
    WHERE ${cWhere}
      AND p.status IN ('atrasado','inadimplente','protestado')
  `).get(...p);

  // ── Opções de filtro (sempre sem filtro, para popular os selects) ─────────
  const bancos = db.prepare(
    `SELECT DISTINCT banco FROM clientes WHERE ativo = 1 AND banco != '' ORDER BY banco`
  ).all().map(r => r.banco);

  const consultores = db.prepare(
    `SELECT DISTINCT consultor FROM clientes WHERE ativo = 1 AND consultor IS NOT NULL AND consultor != '' ORDER BY consultor`
  ).all().map(r => r.consultor);

  const anos = db.prepare(
    `SELECT DISTINCT strftime('%Y', data_parcela) AS ano FROM parcelas ORDER BY ano DESC`
  ).all().map(r => r.ano);

  res.json({ kpis, receitaMensal, inadimplentes, ano: parseInt(ano), bancos, consultores, anos });
});

module.exports = router;

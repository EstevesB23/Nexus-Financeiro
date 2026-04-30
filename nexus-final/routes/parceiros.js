// routes/parceiros.js
'use strict';

const express  = require('express');
const router   = express.Router();
const { getDB } = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const BANCOS = ['BRADESCO', 'SANTANDER', 'ITAU'];

router.use(authenticate);

// GET /api/parceiros — totais por banco investidor
router.get('/', (req, res) => {
  const db = getDB();

  const result = BANCOS.map(banco => {
    const row = db.prepare(`
      SELECT
        COUNT(DISTINCT c.id)                                           AS total_clientes,
        COALESCE(SUM(c.valor_parcela), 0)                             AS total_investido,
        COALESCE(SUM(CASE WHEN p.status IN ('pago','pagamento_dia')
                          THEN p.valor ELSE 0 END), 0)                AS total_recebido
      FROM clientes c
      LEFT JOIN parcelas p ON p.cliente_id = c.id
      WHERE c.ativo = 1 AND c.banco = ?
    `).get(banco);

    return {
      banco,
      total_clientes:  row.total_clientes  || 0,
      total_investido: row.total_investido || 0,
      total_recebido:  row.total_recebido  || 0,
      a_receber:       (row.total_investido || 0) - (row.total_recebido || 0),
    };
  });

  res.json(result);
});

module.exports = router;

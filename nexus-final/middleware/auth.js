// middleware/auth.js
// Verifica JWT em todas as rotas protegidas
'use strict';

const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev_secret_troque_em_producao';

/**
 * Middleware de autenticação JWT.
 * Adiciona req.user = { id, username, nome, role } quando válido.
 */
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Não autenticado. Faça login.' });
  }

  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
    }
    return res.status(401).json({ erro: 'Token inválido.' });
  }
};

/**
 * Middleware de autorização por perfil.
 * Uso: authorize('admin') ou authorize(['admin', 'cobranca'])
 */
const authorize = (...roles) => (req, res, next) => {
  const allowed = roles.flat();
  if (!req.user || !allowed.includes(req.user.role)) {
    return res.status(403).json({ erro: 'Sem permissão para esta ação.' });
  }
  next();
};

module.exports = { authenticate, authorize };

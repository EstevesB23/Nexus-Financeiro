// routes/auth.js
'use strict';

const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const router   = express.Router();
const { getDB } = require('../db/connection');
const { authenticate, authorize } = require('../middleware/auth');

const SECRET  = process.env.JWT_SECRET    || 'dev_secret_troque_em_producao';
const EXPIRES = process.env.JWT_EXPIRES_IN || '8h';

// ── POST /api/auth/login ─────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ erro: 'Usuário e senha obrigatórios.' });
  }

  const db   = getDB();
  const user = db.prepare(
    `SELECT * FROM usuarios WHERE username = ? AND ativo = 1`
  ).get(username.toLowerCase().trim());

  if (!user) {
    // Tempo fixo para evitar timing attacks (não revela se o user existe)
    bcrypt.compareSync('dummy', '$2a$10$dummyhashtopreventtimingattack00000000000000000000');
    return res.status(401).json({ erro: 'Usuário ou senha incorretos.' });
  }

  const senhaOk = bcrypt.compareSync(password, user.password);
  if (!senhaOk) {
    return res.status(401).json({ erro: 'Usuário ou senha incorretos.' });
  }

  // Atualiza último login
  db.prepare(`UPDATE usuarios SET ultimo_login = strftime('%Y-%m-%d %H:%M:%S','now','localtime') WHERE id = ?`)
    .run(user.id);

  const payload = { id: user.id, username: user.username, nome: user.nome, role: user.role };
  const token   = jwt.sign(payload, SECRET, { expiresIn: EXPIRES });

  res.json({ ok: true, token, user: payload });
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// ── GET /api/auth/usuarios ── (admin only) ────────────────────────────────
router.get('/usuarios', authenticate, authorize('admin'), (req, res) => {
  const db   = getDB();
  const lista = db.prepare(
    `SELECT id, username, nome, role, ativo, criado_em, ultimo_login FROM usuarios ORDER BY nome`
  ).all();
  res.json(lista);
});

// ── POST /api/auth/usuarios ── (admin only) ───────────────────────────────
router.post('/usuarios', authenticate, authorize('admin'), (req, res) => {
  const { username, password, nome, role } = req.body;
  const rolesValidos = ['admin', 'cobranca', 'inadimplencia', 'atendimento'];

  if (!username?.trim() || !password || !nome?.trim() || !rolesValidos.includes(role)) {
    return res.status(400).json({ erro: 'Dados inválidos. Verifique todos os campos.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ erro: 'Senha deve ter ao menos 6 caracteres.' });
  }

  const db   = getDB();
  const hash = bcrypt.hashSync(password, 10);

  try {
    db.prepare(
      `INSERT INTO usuarios (username, password, nome, role) VALUES (?,?,?,?)`
    ).run(username.toLowerCase().trim(), hash, nome.trim(), role);
    res.status(201).json({ ok: true });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ erro: `Usuário "${username}" já existe.` });
    }
    throw e;
  }
});

// ── PATCH /api/auth/usuarios/:id/senha ── (admin only) ───────────────────
router.patch('/usuarios/:id/senha', authenticate, authorize('admin'), (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ erro: 'Senha deve ter ao menos 6 caracteres.' });
  }

  const db   = getDB();
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(`UPDATE usuarios SET password = ? WHERE id = ?`)
    .run(hash, req.params.id);

  if (info.changes === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  res.json({ ok: true });
});

// ── DELETE /api/auth/usuarios/:id ── (admin only) ─────────────────────────
router.delete('/usuarios/:id', authenticate, authorize('admin'), (req, res) => {
  if (String(req.params.id) === String(req.user.id)) {
    return res.status(400).json({ erro: 'Não é possível desativar seu próprio usuário.' });
  }

  const db   = getDB();
  const info = db.prepare(`UPDATE usuarios SET ativo = 0 WHERE id = ?`).run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  res.json({ ok: true });
});

module.exports = router;

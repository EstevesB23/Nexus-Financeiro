// server.js — Xcredit Financeira v2.0
'use strict';

// ── Carrega variáveis de ambiente (.env) ──────────────────────────────────
// Em produção: defina as variáveis diretamente no servidor (Railway, Render, etc.)
// Em desenvolvimento: crie um arquivo .env baseado no .env.example
try { require('fs').readFileSync('.env').toString().split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && !k.startsWith('#') && k.trim()) process.env[k.trim()] = v.join('=').trim();
}); } catch {}

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
const fs         = require('fs');

// ── Garante que o banco existe ────────────────────────────────────────────
const dbPath = path.join(__dirname, 'db', 'xcredit.db');
if (!fs.existsSync(dbPath)) {
  console.log('⚙️  Banco não encontrado — executando migração automática...');
  require('./db/migrate');
}

const app  = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// ── Segurança: Helmet (cabeçalhos HTTP seguros) ───────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:    ["'self'", "https://fonts.gstatic.com"],
      scriptSrc:  ["'self'", "'unsafe-inline'"],  // necessário para inline JS
      imgSrc:     ["'self'", "data:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────────────────────
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map(s => s.trim()),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ─────────────────────────────────────────────────────────
// Protege contra brute-force no login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 20,
  message: { erro: 'Muitas tentativas de login. Aguarde 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter geral da API
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minuto
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Body parser ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));

// ── Proxy trust (para Railway/Render/Heroku) ──────────────────────────────
if (isProd) app.set('trust proxy', 1);

// ── Arquivos estáticos (frontend) ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: isProd ? '1d' : 0,
  etag: true,
}));

// ── Rotas da API ──────────────────────────────────────────────────────────
app.use('/api/auth',      loginLimiter, require('./routes/auth'));
app.use('/api/clientes',  apiLimiter,   require('./routes/clientes'));
app.use('/api/parcelas',  apiLimiter,   require('./routes/parcelas'));
app.use('/api/dashboard', apiLimiter,   require('./routes/dashboard'));
app.use('/api/parceiros', apiLimiter,   require('./routes/parceiros'));

// Health check público
app.get('/api/health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'development', ts: new Date().toISOString() });
});

// ── SPA fallback (todas as rotas não-API servem o index.html) ─────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Handler de erros global ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERRO:`, err.message);
  // Nunca expõe stack trace em produção
  res.status(err.status || 500).json({
    erro: isProd ? 'Erro interno do servidor.' : err.message,
  });
});

// ── Inicia servidor ───────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║       🚀 Xcredit Financeira v2.0         ║
╠════════════════════════════════════════╣
  Ambiente : ${process.env.NODE_ENV || 'development'}
  Porta    : ${PORT}
  Banco    : ${dbPath}
  URL      : http://localhost:${PORT}
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => { console.log('SIGTERM recebido. Encerrando...'); process.exit(0); });
process.on('SIGINT',  () => { console.log('Encerrando...'); process.exit(0); });

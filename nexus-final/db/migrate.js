// db/migrate.js
'use strict';

const Database = require('better-sqlite3');
const bcrypt   = require('bcryptjs');
const path     = require('path');

const DB_PATH = path.join(__dirname, 'xcredit.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('⚙️  Criando/atualizando tabelas...');

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password   TEXT    NOT NULL,
    nome       TEXT    NOT NULL,
    role       TEXT    NOT NULL CHECK(role IN ('admin','cobranca','inadimplencia','atendimento')),
    ativo      INTEGER NOT NULL DEFAULT 1,
    criado_em  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now','localtime')),
    ultimo_login TEXT
  );

  CREATE TABLE IF NOT EXISTS clientes (
    id               TEXT    PRIMARY KEY,
    nome             TEXT    NOT NULL,
    estabelecimento  TEXT    NOT NULL,
    cpf              TEXT,
    cnpj             TEXT,
    telefone         TEXT,
    cep              TEXT,
    referencias      TEXT,
    data_contrato    TEXT    NOT NULL,
    qtd_parcelas     INTEGER NOT NULL CHECK(qtd_parcelas > 0),
    valor_parcela    REAL    NOT NULL CHECK(valor_parcela >= 0),
    consultor        TEXT,
    banco            TEXT    NOT NULL DEFAULT '',
    ativo            INTEGER NOT NULL DEFAULT 1,
    criado_em        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now','localtime')),
    atualizado_em    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS parcelas (
    id             TEXT    PRIMARY KEY,
    cliente_id     TEXT    NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    numero_parcela INTEGER NOT NULL,
    data_parcela   TEXT    NOT NULL,
    valor          REAL    NOT NULL CHECK(valor >= 0),
    status         TEXT    NOT NULL DEFAULT 'a_pagar' CHECK(status IN (
                     'pago','a_pagar','atrasado','data_diferente',
                     'pagamento_dia','um_dia_util','em_acordo',
                     'parcela_promocional','inadimplente','protestado'
                   )),
    observacao     TEXT,
    pago_em        TEXT,
    criado_em      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now','localtime')),
    atualizado_em  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now','localtime'))
  );

  -- Índices
  CREATE INDEX IF NOT EXISTS idx_parcelas_cliente ON parcelas(cliente_id);
  CREATE INDEX IF NOT EXISTS idx_parcelas_data    ON parcelas(data_parcela);
  CREATE INDEX IF NOT EXISTS idx_parcelas_status  ON parcelas(status);
  CREATE INDEX IF NOT EXISTS idx_clientes_nome    ON clientes(nome);
  CREATE INDEX IF NOT EXISTS idx_clientes_doc     ON clientes(cnpj, cpf);
`);

// ── Usuários padrão (senhas com bcrypt) ────────────────────────────────────
const SALT = 10;
const defaultUsers = [
  { username: 'admin',         password: 'admin123',  nome: 'Administrador', role: 'admin' },
  { username: 'cobranca',      password: 'cob123',    nome: 'Cobrança',      role: 'cobranca' },
  { username: 'inadimplencia', password: 'inad123',   nome: 'Inadimplência', role: 'inadimplencia' },
  { username: 'atendimento',   password: 'ate123',    nome: 'Atendimento',   role: 'atendimento' },
];

const insertUser = db.prepare(
  'INSERT OR IGNORE INTO usuarios (username, password, nome, role) VALUES (?,?,?,?)'
);

for (const u of defaultUsers) {
  const hash = bcrypt.hashSync(u.password, SALT);
  insertUser.run(u.username, hash, u.nome, u.role);
}

console.log('✅ Banco pronto!');
console.log(`📁 ${DB_PATH}`);
console.log('\nUsuários padrão:');
defaultUsers.forEach(u => console.log(`  [${u.role.padEnd(14)}] ${u.username} / ${u.password}`));

db.close();

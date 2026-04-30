[README.md](https://github.com/user-attachments/files/27229209/README.md)
# 🚀 Xcredit Financeira

Sistema financeiro completo — Node.js + SQLite, pronto para produção.

---

## 📁 Estrutura do Projeto

```
xcredit-financeira/
├── server.js               ← Entrada do servidor (Express)
├── package.json
├── .env.example            ← Copie para .env e configure
├── .gitignore
│
├── middleware/
│   └── auth.js             ← JWT: authenticate + authorize
│
├── routes/
│   ├── auth.js             ← Login e gestão de usuários
│   ├── clientes.js         ← CRUD de clientes + parcelas
│   ├── parcelas.js         ← Listagem, filtros e status
│   └── dashboard.js        ← KPIs e gráficos
│
├── db/
│   ├── migrate.js          ← Cria tabelas e usuários iniciais
│   ├── connection.js       ← Conexão SQLite (WAL mode)
│   └── xcredit.db            ← Banco de dados (gerado automaticamente)
│
├── scripts/
│   ├── import-planilha.js  ← Importa planilha Excel (Node)
│   └── import_xcredit.py   ← Lógica de importação (Python)
│
└── public/                 ← Frontend (servido pelo Express)
    ├── index.html
    ├── style.css
    └── app.js
```

---

## ⚡ Instalação

### 1. Pré-requisito: Node.js 18+
Baixe em https://nodejs.org

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```
Edite o `.env` e **troque o `JWT_SECRET`** por uma string longa e aleatória.
Para gerar uma:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Inicie
```bash
npm start       # produção
npm run dev     # desenvolvimento (reinício automático)
```

Acesse: **http://localhost:3000**

---

## 🔐 Usuários padrão

Os usuários são criados automaticamente na primeira execução.
**Troque as senhas imediatamente após o primeiro acesso.**

| Perfil        | Usuário       | Senha padrão | Acesso                       |
|---------------|---------------|--------------|------------------------------|
| Admin         | admin         | admin123     | Tudo                         |
| Cobrança      | cobranca      | cob123       | Clientes + Financeiro        |
| Inadimplência | inadimplencia | inad123      | Inadimplentes                |
| Atendimento   | atendimento   | ate123       | Clientes (sem excluir)       |

Para trocar a senha de um usuário via API (requer token de admin):
```bash
curl -X PATCH http://localhost:3000/api/auth/usuarios/1/senha \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password": "nova_senha_segura"}'
```

---

## 📊 Importar Planilha Excel

```bash
node scripts/import-planilha.js Cadastro_Clientes_XCredit.xlsx
```

Aceita planilhas com abas por mês (JANEIRO, FEVEREIRO, etc.)
no formato XCredit. Não duplica clientes existentes.

---

## 🌐 API REST

Todas as rotas (exceto login e health) exigem:
```
Authorization: Bearer <token>
```

### Auth
```
POST   /api/auth/login                → { token, user }
GET    /api/auth/me                   → usuário logado
GET    /api/auth/usuarios             → lista [admin]
POST   /api/auth/usuarios             → cria [admin]
PATCH  /api/auth/usuarios/:id/senha   → troca senha [admin]
DELETE /api/auth/usuarios/:id         → desativa [admin]
```

### Clientes
```
GET    /api/clientes        → lista (?q=busca)
GET    /api/clientes/:id    → busca um
POST   /api/clientes        → cria [admin, cobranca, atendimento]
PUT    /api/clientes/:id    → atualiza [admin, cobranca, atendimento]
DELETE /api/clientes/:id    → remove [admin]
```

### Parcelas
```
GET    /api/parcelas              → lista (?mes=&ano=&status=&q=&inadimplente=1)
GET    /api/parcelas/anos         → anos disponíveis
GET    /api/parcelas/proximas     → próximas (7 dias)
PATCH  /api/parcelas/:id/status   → atualiza status [admin, cobranca]
```

### Dashboard
```
GET /api/dashboard   → KPIs + gráficos [admin, cobranca]
```

---

## 🌍 Deploy em Produção

### Railway (recomendado)
1. Crie conta em https://railway.app
2. **Deploy from GitHub** (faça push do projeto primeiro)
3. Configure as variáveis no painel:
   ```
   NODE_ENV=production
   JWT_SECRET=<gerado acima>
   JWT_EXPIRES_IN=8h
   PORT=3000
   ```

### Render
1. Crie conta em https://render.com
2. New Web Service → conecte o repositório
3. Build Command: `npm install`
4. Start Command: `npm start`

### VPS com PM2
```bash
npm install -g pm2
pm2 start server.js --name xcredit
pm2 startup && pm2 save
```

---

## 🔒 Segurança

| Recurso | Implementação |
|---|---|
| Senhas | bcrypt (hash + salt) |
| Autenticação | JWT com expiração |
| Cabeçalhos HTTP | Helmet (CSP, HSTS, X-Frame...) |
| Brute-force | Rate limit: 20 tentativas/15min |
| Autorização | Middleware por perfil em cada rota |
| SQL Injection | Queries parametrizadas |
| Erros | Stack trace oculto em produção |

---

## 🛠️ Troubleshooting

**Dependências faltando**
```bash
npm install
```

**Porta em uso**
```bash
PORT=3001 npm start
```

**Recriar banco do zero**
```bash
rm db/xcredit.db db/xcredit.db-shm db/xcredit.db-wal
npm start
```

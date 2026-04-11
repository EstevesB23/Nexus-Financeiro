# Nexus Financeiro

Sistema fullstack de gestão de cobranças e inadimplência com controle de parcelas, KPIs financeiros e controle de acesso por perfil.

## Contexto

Empresas de cobrança que operam com planilhas Excel enfrentam dois problemas recorrentes: falta de visibilidade em tempo real sobre inadimplência e ausência de controle de acesso — qualquer pessoa vê tudo. O Nexus Financeiro resolve os dois com uma aplicação web que centraliza os dados, expõe KPIs em dashboard e restringe o acesso por perfil de usuário.

O sistema foi modelado a partir de operações financeiras reais, incluindo importação direta de planilhas Excel no formato usado pela XCredit, sem necessidade de reformatação manual dos dados.

## Decisões técnicas

**Por que SQLite em vez de PostgreSQL?**
Para um sistema de cobrança de médio porte sem necessidade de múltiplos servidores simultâneos, SQLite com WAL mode oferece performance suficiente e elimina a complexidade de operar um servidor de banco de dados separado. A troca para PostgreSQL, se necessária, exige alteração apenas na camada de conexão.

**Por que JWT em vez de sessões?**
O frontend em React consome a API REST de forma stateless — JWT elimina a necessidade de gerenciar sessões no servidor e facilita a adição de novos clientes (mobile, integrações) no futuro sem mudança na autenticação.

**Por que controle de acesso por perfil nas rotas?**
Em sistemas financeiros, nem todo usuário deve ver ou modificar tudo. O middleware de autorização por perfil garante que o time de atendimento veja clientes mas não exclua registros, enquanto o admin tem acesso total. Isso reflete como sistemas financeiros funcionam em produção.

**Por que importação de planilha Excel?**
Migrar dados de planilhas para um sistema é o gargalo real de qualquer implantação. O script de importação aceita o formato nativo da XCredit e evita duplicatas, tornando a adoção do sistema viável sem trabalho manual de digitação.

## Arquitetura

```
React (frontend) → Express API → SQLite
                       ↑
                  JWT middleware
                  Perfil de acesso por rota
```

O frontend é servido pelo próprio Express — não há servidor separado para o React em produção, o que simplifica o deploy.

## Instalação

```bash
git clone https://github.com/EstevesB23/Nexus-Financeiro.git
cd Nexus-Financeiro/nexus-final

npm install
cp .env.example .env
```

Edite o `.env` e substitua o `JWT_SECRET` por uma string longa e aleatória:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

```bash
npm run dev     # desenvolvimento (reinício automático)
npm start       # produção
```

Acesse: `http://localhost:3000`

## Usuários padrão

Criados automaticamente na primeira execução. Troque as senhas no primeiro acesso.

| Perfil | Usuário | Senha padrão | Acesso |
|---|---|---|---|
| Admin | admin | admin123 | Tudo |
| Cobrança | cobranca | cob123 | Clientes + Financeiro |
| Inadimplência | inadimplencia | inad123 | Inadimplentes |
| Atendimento | atendimento | ate123 | Clientes (sem excluir) |

## Importar planilha Excel

```bash
node scripts/import-planilha.js Cadastro_Clientes_XCredit.xlsx
```

Aceita planilhas com abas por mês (JANEIRO, FEVEREIRO...) no formato XCredit. Não duplica clientes existentes.

## API REST

Todas as rotas exigem `Authorization: Bearer <token>`, exceto login.

**Auth**
```
POST   /api/auth/login                 → { token, user }
GET    /api/auth/me                    → usuário logado
GET    /api/auth/usuarios              → lista [admin]
POST   /api/auth/usuarios              → cria [admin]
PATCH  /api/auth/usuarios/:id/senha    → troca senha [admin]
DELETE /api/auth/usuarios/:id          → desativa [admin]
```

**Clientes**
```
GET    /api/clientes        → lista (?q=busca)
GET    /api/clientes/:id    → busca um
POST   /api/clientes        → cria [admin, cobranca, atendimento]
PUT    /api/clientes/:id    → atualiza [admin, cobranca, atendimento]
DELETE /api/clientes/:id    → remove [admin]
```

**Parcelas**
```
GET    /api/parcelas              → lista (?mes=&ano=&status=&q=&inadimplente=1)
GET    /api/parcelas/anos         → anos disponíveis
GET    /api/parcelas/proximas     → próximas (7 dias)
PATCH  /api/parcelas/:id/status   → atualiza status [admin, cobranca]
```

**Dashboard**
```
GET    /api/dashboard   → KPIs + dados para gráficos [admin, cobranca]
```

## Segurança

| Recurso | Implementação |
|---|---|
| Senhas | bcrypt com hash + salt |
| Autenticação | JWT com expiração configurável |
| Cabeçalhos HTTP | Helmet (CSP, HSTS, X-Frame) |
| Brute-force | Rate limit: 20 tentativas / 15min |
| Autorização | Middleware por perfil em cada rota |
| SQL Injection | Queries parametrizadas |
| Erros | Stack trace oculto em produção |

## Deploy

**Railway (recomendado):**
1. Crie conta em [railway.app](https://railway.app)
2. Deploy from GitHub
3. Configure as variáveis: `NODE_ENV=production`, `JWT_SECRET`, `JWT_EXPIRES_IN=8h`, `PORT=3000`

**Render:**
1. New Web Service → conecte o repositório
2. Build Command: `npm install`
3. Start Command: `npm start`

## Stack

- Node.js + Express — API REST
- React + Vite + Tailwind CSS — frontend
- SQLite (WAL mode) — banco de dados
- JWT + bcrypt — autenticação e senhas
- Helmet — segurança de cabeçalhos HTTP
- Python — script de importação de planilhas

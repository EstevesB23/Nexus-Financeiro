# Nexus Financeiro — Frontend React

Frontend do sistema financeiro, construído com **React 18 + Vite + Tailwind CSS**.

---

## 📁 Estrutura

```
nexus-react/
├── index.html
├── vite.config.js          ← Proxy /api → backend na porta 3000
├── tailwind.config.js
├── src/
│   ├── main.jsx            ← Entry point
│   ├── App.jsx             ← Layout principal + roteamento
│   ├── index.css           ← Estilos globais + Tailwind
│   │
│   ├── context/
│   │   ├── AuthContext.jsx ← Estado de autenticação global
│   │   └── ToastContext.jsx← Notificações globais
│   │
│   ├── utils/
│   │   └── api.js          ← HTTP client + JWT + formatação
│   │
│   ├── components/
│   │   ├── ui.jsx          ← Badge, Button, Input, KpiCard, Skeleton...
│   │   ├── Sidebar.jsx     ← Menu lateral
│   │   ├── DataTable.jsx   ← Tabela com skeleton loader
│   │   ├── Pagination.jsx  ← Paginação reutilizável
│   │   ├── Modal.jsx       ← Dialog base + FieldGroup
│   │   └── ClienteModal.jsx← Formulário de cliente
│   │
│   └── pages/
│       ├── LoginPage.jsx
│       ├── ClientesPage.jsx
│       ├── FinanceiroPage.jsx
│       ├── DashboardPage.jsx
│       └── InadimplentesPage.jsx
```

---

## ⚡ Desenvolvimento

### 1. Pré-requisitos
- Node.js 18+
- Backend rodando na porta 3000 (`cd nexus-final && npm start`)

### 2. Instale as dependências
```bash
cd nexus-react
npm install
```

### 3. Inicie em modo dev
```bash
npm run dev
```
Acesse: **http://localhost:5173**

O Vite redireciona automaticamente `/api/*` para `http://localhost:3000`.

---

## 🏗️ Build para produção

```bash
npm run build
```

O build vai para `nexus-final/public/` (configurado no `vite.config.js`).
Depois basta rodar o backend normalmente — ele serve o frontend automaticamente.

```bash
cd nexus-final
npm start
# http://localhost:3000 → sistema completo
```

---

## 🎨 Stack

| Tecnologia | Uso |
|---|---|
| React 18 | Interface e componentização |
| Vite | Build tool e dev server |
| Tailwind CSS | Estilização utilitária |
| Recharts | Gráficos (barras + donut) |
| Lucide React | Ícones |

---

## 📦 Adicionando dependências

```bash
npm install nome-do-pacote
```

Exemplos úteis para o futuro:
- `react-router-dom` — se quiser URLs por aba
- `react-hook-form` — formulários mais robustos
- `date-fns` — manipulação de datas
- `react-query` — cache e sincronização de dados com a API

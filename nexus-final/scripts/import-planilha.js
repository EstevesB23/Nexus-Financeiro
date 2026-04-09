// scripts/import-planilha.js
// Importa a planilha XCredit para o banco SQLite
// Uso: node scripts/import-planilha.js caminho/planilha.xlsx

'use strict';

const { execSync } = require('child_process');
const path         = require('path');
const fs           = require('fs');

const arquivo = process.argv[2];

if (!arquivo) {
  console.log(`
╔══════════════════════════════════════════════════════╗
║     IMPORTADOR DE PLANILHAS — Nexus Financeiro       ║
╚══════════════════════════════════════════════════════╝

Uso:
  node scripts/import-planilha.js <planilha.xlsx>

Exemplos:
  node scripts/import-planilha.js Cadastro_Clientes_XCredit.xlsx
  node scripts/import-planilha.js "C:/Downloads/minha planilha.xlsx"

Formato suportado: abas por mês (JANEIRO, FEVEREIRO, etc.)
  `);
  process.exit(0);
}

if (!fs.existsSync(arquivo)) {
  console.error(`❌ Arquivo não encontrado: ${arquivo}`);
  process.exit(1);
}

// Detecta Python
const python = (() => {
  for (const cmd of ['python3', 'python']) {
    try { execSync(`${cmd} --version`, { stdio: 'ignore' }); return cmd; } catch {}
  }
  return null;
})();

if (!python) {
  console.error('❌ Python não encontrado. Instale em https://python.org');
  process.exit(1);
}

// Instala dependências Python se necessário
try {
  execSync(`${python} -c "import pandas, openpyxl"`, { stdio: 'ignore' });
} catch {
  console.log('📦 Instalando dependências Python (pandas, openpyxl)...');
  execSync(`${python} -m pip install pandas openpyxl --quiet`, { stdio: 'inherit' });
}

const scriptPy = path.join(__dirname, 'import_xcredit.py');
execSync(`${python} "${scriptPy}" "${arquivo}"`, { stdio: 'inherit' });

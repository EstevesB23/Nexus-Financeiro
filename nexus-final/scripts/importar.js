'use strict';

// scripts/importar.js
// Uso: node scripts/importar.js planilha1.xlsx [planilha2.xlsx ...]

const { execSync } = require('child_process');
const path         = require('path');
const fs           = require('fs');

const arquivos = process.argv.slice(2);

if (!arquivos.length) {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║      IMPORTADOR DE PLANILHAS — Xcredit Financeira         ║
╚═══════════════════════════════════════════════════════════╝

Uso:
  node scripts/importar.js planilha1.xlsx [planilha2.xlsx ...]

Exemplos:
  node scripts/importar.js "C:/Downloads/TERÇA BRADESCO.xlsx"
  node scripts/importar.js bradesco.xlsx itau.xlsx caixa.xlsx

A planilha deve ter uma aba chamada "Todas as Parcelas" com
as colunas: Status | Mês | CPF | Nome | Estabelecimento |
            Telefone | Valor Parcela | Data Pagamento |
            Valor Emprestado | Endereço | Referência | Consultor
  `);
  process.exit(0);
}

for (const arq of arquivos) {
  if (!fs.existsSync(arq)) {
    console.error(`❌ Arquivo não encontrado: ${arq}`);
    process.exit(1);
  }
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

const scriptPy = path.join(__dirname, 'import_planilhas.py');
const argsStr  = arquivos.map(a => `"${a}"`).join(' ');

execSync(`${python} "${scriptPy}" ${argsStr}`, { stdio: 'inherit' });

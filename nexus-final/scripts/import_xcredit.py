#!/usr/bin/env python3
"""
import_xcredit.py
Importa a planilha Cadastro_Clientes_XCredit.xlsx para o banco SQLite do Nexus Financeiro.

Uso:
  node scripts/import_xcredit.js   (chamado pelo Node)
  
Ou direto pelo Python (para teste):
  python3 scripts/import_xcredit.py planilha.xlsx
"""

import sys
import os
import re
import sqlite3
import pandas as pd
from datetime import datetime, timedelta

# ── Caminho do banco ──
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'db', 'nexus.db')
XLSX_PATH = sys.argv[1] if len(sys.argv) > 1 else None

if not XLSX_PATH:
    print("Uso: python3 import_xcredit.py <caminho_planilha.xlsx>")
    sys.exit(1)

if not os.path.exists(XLSX_PATH):
    print(f"Arquivo não encontrado: {XLSX_PATH}")
    sys.exit(1)

if not os.path.exists(DB_PATH):
    print(f"Banco não encontrado em {DB_PATH}. Execute 'npm run setup' primeiro.")
    sys.exit(1)

# ─────────────────────────────────────────
# FUNÇÕES AUXILIARES
# ─────────────────────────────────────────

def uid():
    import time, random, string
    return f"{int(time.time()*1000):x}{random.randint(0,99999):05x}"

def add_days(date_str, days):
    d = datetime.strptime(date_str, "%Y-%m-%d") + timedelta(days=days)
    return d.strftime("%Y-%m-%d")

def parse_date(val):
    """Aceita Timestamp pandas, string DD/MM/YYYY, YYYY-MM-DD, etc."""
    if val is None or (isinstance(val, float) and str(val) == 'nan'):
        return None
    if hasattr(val, 'strftime'):  # Timestamp pandas
        try:
            return val.strftime('%Y-%m-%d')
        except:
            return None
    s = str(val).strip()
    # DD/MM/YYYY ou DD/MM/ YYYY
    m = re.match(r'(\d{1,2})[/\-](\d{1,2})[/\-\s](\d{4})', s)
    if m:
        return f"{m.group(3)}-{m.group(2).zfill(2)}-{m.group(1).zfill(2)}"
    # YYYY-MM-DD
    m = re.match(r'(\d{4})-(\d{2})-(\d{2})', s)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    return None

def parse_valor(val):
    """Converte 'R$ 2.700,00', 'R$3.360,00', 1500, etc. para float."""
    if val is None or (isinstance(val, float) and str(val) == 'nan'):
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).strip()
    # Remove R$, espaços, pontos de milhar, troca vírgula por ponto
    s = re.sub(r'[R$\s]', '', s)
    s = s.replace('.', '').replace(',', '.')
    try:
        return float(s)
    except:
        return 0.0

def clean_str(val):
    if val is None or (isinstance(val, float) and str(val) == 'nan'):
        return ''
    return str(val).strip().replace('\n', ' ').replace('\r', '')

# ─────────────────────────────────────────
# LEITURA DA PLANILHA
# ─────────────────────────────────────────
print(f"\n📂 Lendo planilha: {XLSX_PATH}")
xl = pd.ExcelFile(XLSX_PATH)

MESES = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO',
         'JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO']

todos_clientes = []

for mes in MESES:
    if mes not in xl.sheet_names:
        continue

    df = pd.read_excel(XLSX_PATH, sheet_name=mes, header=0)

    # Renomeia colunas para nomes padronizados pelo índice (mais robusto)
    col_map = {
        df.columns[0]:  'origem',
        df.columns[1]:  'parceiro',
        df.columns[2]:  'nome',
        df.columns[3]:  'cpf',
        df.columns[4]:  'cnpj',
        df.columns[5]:  'data_finalizacao',
        df.columns[6]:  'data_primeiro_pgto',
        df.columns[7]:  'estabelecimento',
        df.columns[8]:  'telefone',
        df.columns[9]:  'endereco',
        df.columns[10]: 'referencia',
        df.columns[11]: 'consultor',
        df.columns[12]: 'observacoes',
        df.columns[13]: 'valor_emprestado',
        df.columns[14]: 'valor_a_pagar',
        df.columns[15]: 'qtd_parcelas',
    }
    df = df.rename(columns=col_map)

    # Filtra linhas válidas (com nome real)
    df = df[df['nome'].notna()]
    df = df[df['nome'].astype(str).str.strip().str.len() > 2]
    df = df[~df['nome'].astype(str).str.strip().isin(['-', 'nan', 'NOME'])]

    # Filtra linhas sem data de pagamento ou sem parcelas válidas
    df = df[df['qtd_parcelas'].notna()]

    for _, row in df.iterrows():
        nome      = clean_str(row['nome'])
        data_pgto = parse_date(row['data_primeiro_pgto'])
        qtd       = int(float(str(row['qtd_parcelas']).replace(',','.'))) if str(row['qtd_parcelas']).replace('.','').replace(',','').isdigit() else 0

        if not nome or not data_pgto or qtd == 0:
            continue

        valor_pagar    = parse_valor(row['valor_a_pagar'])
        valor_emp      = parse_valor(row['valor_emprestado'])
        valor_parcela  = round(valor_pagar / qtd, 2) if qtd > 0 and valor_pagar > 0 else round(valor_emp / qtd, 2) if qtd > 0 else 0

        todos_clientes.append({
            'mes':            mes,
            'nome':           nome,
            'cpf':            clean_str(row['cpf']),
            'cnpj':           clean_str(row['cnpj']),
            'estabelecimento': clean_str(row['estabelecimento']) or nome,
            'telefone':       clean_str(row['telefone']),
            'endereco':       clean_str(row['endereco']),
            'referencia':     clean_str(row['referencia']),
            'consultor':      clean_str(row['consultor']),
            'observacoes':    clean_str(row['observacoes']),
            'data_contrato':  parse_date(row['data_finalizacao']) or data_pgto,
            'data_primeiro_pgto': data_pgto,
            'qtd_parcelas':   qtd,
            'valor_parcela':  valor_parcela,
            'valor_total':    valor_pagar or valor_emp,
        })

print(f"✅ {len(todos_clientes)} clientes encontrados na planilha")

# ─────────────────────────────────────────
# IMPORTAÇÃO PARA O BANCO
# ─────────────────────────────────────────
conn = sqlite3.connect(DB_PATH)
conn.execute("PRAGMA foreign_keys = ON")
cur = conn.cursor()

inseridos   = 0
atualizados = 0
erros_list  = []

for c in todos_clientes:
    try:
        # Verifica se já existe pelo CNPJ ou CPF ou Nome+Data
        cliente_id = None
        if c['cnpj']:
            row = cur.execute("SELECT id FROM clientes WHERE cnpj = ? AND ativo = 1", (c['cnpj'],)).fetchone()
            if row:
                cliente_id = row[0]
        if not cliente_id and c['cpf']:
            row = cur.execute("SELECT id FROM clientes WHERE cpf = ? AND ativo = 1", (c['cpf'],)).fetchone()
            if row:
                cliente_id = row[0]
        if not cliente_id:
            row = cur.execute(
                "SELECT id FROM clientes WHERE nome = ? AND data_contrato = ? AND ativo = 1",
                (c['nome'], c['data_contrato'])
            ).fetchone()
            if row:
                cliente_id = row[0]

        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        if cliente_id:
            # Atualiza
            cur.execute("""
                UPDATE clientes SET
                    nome=?, estabelecimento=?, cpf=?, cnpj=?, telefone=?,
                    referencias=?, data_contrato=?, qtd_parcelas=?,
                    valor_parcela=?, consultor=?, atualizado_em=?
                WHERE id=?
            """, (
                c['nome'], c['estabelecimento'], c['cpf'], c['cnpj'], c['telefone'],
                c['referencia'] + (' | ' + c['observacoes'] if c['observacoes'] else ''),
                c['data_contrato'], c['qtd_parcelas'], c['valor_parcela'],
                c['consultor'], now, cliente_id
            ))
            atualizados += 1
        else:
            # Insere novo
            cliente_id = uid()
            cur.execute("""
                INSERT INTO clientes
                  (id, nome, estabelecimento, cpf, cnpj, telefone, cep, referencias,
                   data_contrato, qtd_parcelas, valor_parcela, consultor, criado_em, atualizado_em)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                cliente_id,
                c['nome'],
                c['estabelecimento'],
                c['cpf'],
                c['cnpj'],
                c['telefone'],
                '',  # CEP (não tem campo separado na planilha, está no endereço)
                c['referencia'] + (' | Obs: ' + c['observacoes'] if c['observacoes'] else ''),
                c['data_contrato'],
                c['qtd_parcelas'],
                c['valor_parcela'],
                c['consultor'],
                now, now
            ))
            inseridos += 1

        # ── Gera parcelas semanais a partir da data do primeiro pagamento ──
        cur.execute("DELETE FROM parcelas WHERE cliente_id = ?", (cliente_id,))

        for i in range(1, c['qtd_parcelas'] + 1):
            data_parcela = add_days(c['data_primeiro_pgto'], (i - 1) * 7)
            cur.execute("""
                INSERT INTO parcelas (id, cliente_id, numero_parcela, data_parcela, valor, status)
                VALUES (?,?,?,?,?,?)
            """, (uid(), cliente_id, i, data_parcela, c['valor_parcela'], 'a_pagar'))

    except Exception as e:
        erros_list.append(f"{c['nome']}: {e}")

conn.commit()
conn.close()

# ─────────────────────────────────────────
# RELATÓRIO
# ─────────────────────────────────────────
print(f"""
╔══════════════════════════════════════════╗
║     IMPORTAÇÃO XCREDIT CONCLUÍDA! ✅     ║
╠══════════════════════════════════════════╣
  📋 Clientes novos:       {inseridos}
  🔄 Clientes atualizados: {atualizados}
  📅 Parcelas geradas:     {sum(c['qtd_parcelas'] for c in todos_clientes)}
  ❌ Erros:                {len(erros_list)}
╚══════════════════════════════════════════╝
""")

if erros_list:
    print("Detalhes dos erros:")
    for e in erros_list:
        print(f"  • {e}")

print(f"Acesse o sistema em http://localhost:3000")

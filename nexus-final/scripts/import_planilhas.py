#!/usr/bin/env python3
"""
import_planilhas.py
Importa planilhas no formato "Todas as Parcelas" para o banco SQLite.

Uso:
  python3 scripts/import_planilhas.py planilha1.xlsx [planilha2.xlsx ...]

Ou via Node:
  node scripts/importar.js planilha1.xlsx [planilha2.xlsx ...]
"""

import sys
import os
import re
import sqlite3
import pandas as pd
from datetime import datetime

# Garante UTF-8 no terminal do Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'db', 'xcredit.db')

STATUS_MAP = {
    'pago':                 'pago',
    'a pagar':              'a_pagar',
    'parcela promocional':  'parcela_promocional',
    'atrasado':             'atrasado',
    'data diferente':       'data_diferente',
    'pagamento do dia':     'pagamento_dia',
    'em acordo':            'em_acordo',
    'um dia util':          'um_dia_util',
    'um dia útil':          'um_dia_util',
    'inadimplente':         'inadimplente',
    'protestado':           'protestado',
}

def uid():
    import time, random
    return f"{int(time.time()*1000):x}{random.randint(0,99999):05x}"

def parse_date(val):
    if val is None or (isinstance(val, float) and str(val) == 'nan'):
        return None
    if hasattr(val, 'strftime'):
        try:
            return val.strftime('%Y-%m-%d')
        except:
            return None
    s = str(val).strip()
    m = re.match(r'(\d{1,2})[/\-](\d{1,2})[/\-\s](\d{4})', s)
    if m:
        return f"{m.group(3)}-{m.group(2).zfill(2)}-{m.group(1).zfill(2)}"
    m = re.match(r'(\d{4})-(\d{2})-(\d{2})', s)
    if m:
        return s[:10]
    return None

def parse_valor(val):
    if val is None or (isinstance(val, float) and str(val) == 'nan'):
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    s = re.sub(r'[R$\s]', '', str(val).strip())
    s = s.replace('.', '').replace(',', '.')
    try:
        return float(s)
    except:
        return 0.0

def clean(val):
    if val is None or (isinstance(val, float) and str(val) == 'nan'):
        return ''
    return str(val).strip().replace('\n', ' ').replace('\r', '')

def map_status(raw):
    return STATUS_MAP.get(raw.strip().lower(), 'a_pagar')

def extract_banco(filepath):
    name = os.path.basename(filepath).upper()
    for banco in ['BRADESCO', 'ITAÚ', 'ITAU', 'CAIXA', 'SANTANDER', 'NUBANK', 'INTER', 'BANCO DO BRASIL', 'BB']:
        if banco in name:
            return banco.replace('Á', 'A').replace('Ú', 'U')
    return ''

# ─────────────────────────────────────────
# ARGUMENTOS
# ─────────────────────────────────────────
files = sys.argv[1:]
if not files:
    print("Uso: python3 import_planilhas.py planilha1.xlsx [planilha2.xlsx ...]")
    sys.exit(1)

for f in files:
    if not os.path.exists(f):
        print(f"❌ Arquivo não encontrado: {f}")
        sys.exit(1)

if not os.path.exists(DB_PATH):
    print(f"❌ Banco não encontrado em {DB_PATH}. Execute 'npm run setup' primeiro.")
    sys.exit(1)

# ─────────────────────────────────────────
# LEITURA DE TODAS AS PLANILHAS
# ─────────────────────────────────────────
todas_as_linhas = []  # lista de dicts com todos os dados brutos

for filepath in files:
    banco = extract_banco(filepath)
    print(f"📂 Lendo: {os.path.basename(filepath)}" + (f" [{banco}]" if banco else ""))

    try:
        df = pd.read_excel(filepath, sheet_name='Todas as Parcelas', header=0)
    except Exception as e:
        print(f"  ❌ Erro ao ler a planilha: {e}")
        continue

    for _, row in df.iterrows():
        nome = clean(row.iloc[3])
        data = parse_date(row.iloc[7])
        if not nome or not data:
            continue

        todas_as_linhas.append({
            'banco':            banco,
            'status_raw':       clean(row.iloc[0]),
            'cpf':              clean(row.iloc[2]),
            'nome':             nome,
            'estabelecimento':  clean(row.iloc[4]) or nome,
            'telefone':         clean(row.iloc[5]),
            'valor_parcela':    parse_valor(row.iloc[6]),
            'data_pagamento':   data,
            'valor_emprestado': parse_valor(row.iloc[8]),
            'endereco':         clean(row.iloc[9]),
            'referencia':       clean(row.iloc[10]),
            'consultor':        clean(row.iloc[11]),
        })

print(f"\n✅ {len(todas_as_linhas)} linhas lidas no total")

# ─────────────────────────────────────────
# ORGANIZA CLIENTES (deduplicação por CPF)
# ─────────────────────────────────────────
# Ordena por CPF e depois por data para manter parcelas em ordem
todas_as_linhas.sort(key=lambda x: (x['cpf'] or x['nome'], x['data_pagamento']))

# Mapeia client_key → dados do cliente e suas parcelas
clientes_map = {}  # key → { info, parcelas: [] }

for linha in todas_as_linhas:
    # Usa CPF como chave única; se não tiver, usa Nome
    key = linha['cpf'] if linha['cpf'] else f"__nome__{linha['nome'].upper()}"

    if key not in clientes_map:
        clientes_map[key] = {
            'id':               uid(),
            'nome':             linha['nome'],
            'estabelecimento':  linha['estabelecimento'],
            'cpf':              linha['cpf'],
            'telefone':         linha['telefone'],
            'endereco':         linha['endereco'],
            'referencia':       linha['referencia'],
            'consultor':        linha['consultor'],
            'banco':            linha['banco'],
            'data_contrato':    linha['data_pagamento'],  # primeira data
            'valor_emprestado': linha['valor_emprestado'],
            'parcelas':         [],
        }

    clientes_map[key]['parcelas'].append({
        'data':   linha['data_pagamento'],
        'valor':  linha['valor_parcela'],
        'status': map_status(linha['status_raw']),
    })

print(f"👥 {len(clientes_map)} clientes únicos identificados")

# ─────────────────────────────────────────
# IMPORTA PARA O BANCO
# ─────────────────────────────────────────
conn = sqlite3.connect(DB_PATH)
conn.execute("PRAGMA foreign_keys = ON")
cur = conn.cursor()

print("\n🗑️  Limpando dados de teste...")
cur.execute("DELETE FROM parcelas")
cur.execute("DELETE FROM clientes")
conn.commit()

now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
total_parcelas = 0
erros = []

for key, c in clientes_map.items():
    try:
        qtd = len(c['parcelas'])
        valor_medio = round(sum(p['valor'] for p in c['parcelas']) / qtd, 2) if qtd else 0

        cur.execute("""
            INSERT INTO clientes
              (id, nome, estabelecimento, cpf, cnpj, telefone, cep, referencias,
               data_contrato, qtd_parcelas, valor_parcela, consultor, banco, criado_em, atualizado_em)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            c['id'], c['nome'], c['estabelecimento'], c['cpf'], '',
            c['telefone'], c['endereco'], c['referencia'],
            c['data_contrato'], qtd, valor_medio,
            c['consultor'], c['banco'], now, now
        ))

        for i, p in enumerate(c['parcelas'], start=1):
            pago_em = p['data'] if p['status'] in ('pago', 'pagamento_dia') else None
            cur.execute("""
                INSERT INTO parcelas
                  (id, cliente_id, numero_parcela, data_parcela, valor, status, pago_em, criado_em, atualizado_em)
                VALUES (?,?,?,?,?,?,?,?,?)
            """, (uid(), c['id'], i, p['data'], p['valor'], p['status'], pago_em, now, now))
            total_parcelas += 1

    except Exception as e:
        erros.append(f"{c['nome']}: {e}")

conn.commit()
conn.close()

# ─────────────────────────────────────────
# RELATÓRIO
# ─────────────────────────────────────────
print(f"""
╔══════════════════════════════════════════╗
║      IMPORTAÇÃO CONCLUÍDA! ✅             ║
╠══════════════════════════════════════════╣
  👥 Clientes importados: {len(clientes_map)}
  📅 Parcelas importadas: {total_parcelas}
  ❌ Erros:               {len(erros)}
╚══════════════════════════════════════════╝
""")

if erros:
    print("Detalhes dos erros:")
    for e in erros:
        print(f"  • {e}")

print("Acesse o sistema em http://localhost:3000")

// src/components/ClienteModal.tsx
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { api } from '../utils/api'
import { useToast } from '../context/ToastContext'

const BANCOS = ['BRADESCO', 'SANTANDER', 'ITAU']

const EMPTY = {
  nome: '', estabelecimento: '', cpf: '', cnpj: '', telefone: '',
  cep: '', referencias: '', data_contrato: '', qtd_parcelas: '',
  valor_parcela: '', consultor: '', banco: '',
}

type Cliente = Partial<typeof EMPTY & { id: string }>

const masks: Record<string, (v: string) => string> = {
  cpf:      v => v.replace(/\D/g,'').slice(0,11).replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2'),
  cnpj:     v => v.replace(/\D/g,'').slice(0,14).replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2'),
  cep:      v => v.replace(/\D/g,'').slice(0,8).replace(/(\d{5})(\d)/,'$1-$2'),
  telefone: v => { const d = v.replace(/\D/g,'').slice(0,11); return d.length > 10 ? d.replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3') : d.replace(/(\d{2})(\d{4})(\d{4})/,'($1) $2-$3') },
}

type Props = {
  open: boolean
  onClose: () => void
  cliente: Cliente | null
  onSaved: () => void
}

function Inp({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <input
        {...props}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition"
      />
    </div>
  )
}

export default function ClienteModal({ open, onClose, cliente, onSaved }: Props) {
  const { showToast } = useToast()
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(cliente ? {
        nome: cliente.nome || '', estabelecimento: cliente.estabelecimento || '',
        cpf: cliente.cpf || '', cnpj: cliente.cnpj || '', telefone: cliente.telefone || '',
        cep: cliente.cep || '', referencias: cliente.referencias || '',
        data_contrato: cliente.data_contrato || '', qtd_parcelas: String(cliente.qtd_parcelas || ''),
        valor_parcela: String(cliente.valor_parcela || ''), consultor: cliente.consultor || '', banco: cliente.banco || '',
      } : { ...EMPTY })
    }
  }, [cliente, open])

  if (!open) return null

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))
  const mask = (field: string, value: string) => set(field, masks[field] ? masks[field](value) : value)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = { ...form, qtd_parcelas: parseInt(form.qtd_parcelas), valor_parcela: parseFloat(form.valor_parcela) }
      if (cliente?.id) {
        await api.put(`/clientes/${cliente.id}`, data)
        showToast('Cliente atualizado!', 'success')
      } else {
        await api.post('/clientes', data)
        showToast('Cadastro enviado para aprovação do administrador.', 'success')
      }
      onSaved()
      onClose()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-card max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">{cliente?.id ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Dados Pessoais</h3>
            <div className="grid grid-cols-2 gap-3">
              <Inp label="Nome Completo *" value={form.nome} onChange={e => set('nome', e.target.value)} required />
              <Inp label="Telefone *" value={form.telefone} onChange={e => mask('telefone', e.target.value)} placeholder="(00) 00000-0000" required />
              <Inp label="CPF" value={form.cpf} onChange={e => mask('cpf', e.target.value)} placeholder="000.000.000-00" maxLength={14} />
              <Inp label="CNPJ" value={form.cnpj} onChange={e => mask('cnpj', e.target.value)} placeholder="00.000.000/0000-00" maxLength={18} />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Estabelecimento</h3>
            <div className="grid grid-cols-2 gap-3">
              <Inp label="Nome do Estabelecimento *" value={form.estabelecimento} onChange={e => set('estabelecimento', e.target.value)} required />
              <Inp label="CEP" value={form.cep} onChange={e => mask('cep', e.target.value)} placeholder="00000-000" maxLength={9} />
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Referências</label>
              <textarea value={form.referencias} onChange={e => set('referencias', e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition resize-none"
                rows={2} placeholder="Endereço completo, ponto de referência..." />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Contrato</h3>
            <div className="grid grid-cols-2 gap-3">
              <Inp label="Data do Contrato *" type="date" value={form.data_contrato} onChange={e => set('data_contrato', e.target.value)} required />
              <Inp label="Qtd. Parcelas *" type="number" value={form.qtd_parcelas} onChange={e => set('qtd_parcelas', e.target.value)} placeholder="Ex: 12" min={1} max={520} required />
              <Inp label="Valor Total (R$) *" type="number" value={form.valor_parcela} onChange={e => set('valor_parcela', e.target.value)} placeholder="3360.00" step="0.01" min={0} required />
              <Inp label="Consultor *" value={form.consultor} onChange={e => set('consultor', e.target.value)} required />
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Banco *</label>
                <select value={form.banco} onChange={e => set('banco', e.target.value)} required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gold transition">
                  <option value="">Selecione o banco…</option>
                  {BANCOS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded-lg gradient-gold text-gold-foreground text-sm font-medium hover:opacity-95 transition disabled:opacity-60 shadow-gold">
              {saving ? 'Salvando...' : (cliente?.id ? 'Salvar Alterações' : 'Cadastrar Cliente')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

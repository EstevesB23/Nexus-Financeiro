// src/components/ClienteModal.jsx
import { useState, useEffect } from 'react'
import { User } from 'lucide-react'
import Modal, { FieldGroup } from './Modal'
import { Input, Textarea, Button } from './ui'
import { api } from '../utils/api'
import { useToast } from '../context/ToastContext'

const EMPTY = {
  nome: '', estabelecimento: '', cpf: '', cnpj: '', telefone: '',
  cep: '', referencias: '', data_contrato: '', qtd_parcelas: '',
  valor_parcela: '', consultor: '',
}

// Máscaras
const masks = {
  cpf:      v => v.replace(/\D/g,'').slice(0,11).replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2'),
  cnpj:     v => v.replace(/\D/g,'').slice(0,14).replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2'),
  cep:      v => v.replace(/\D/g,'').slice(0,8).replace(/(\d{5})(\d)/,'$1-$2'),
  telefone: v => { const d = v.replace(/\D/g,'').slice(0,11); return d.length > 10 ? d.replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3') : d.replace(/(\d{2})(\d{4})(\d{4})/,'($1) $2-$3') },
}

export default function ClienteModal({ open, onClose, cliente, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (cliente) {
      setForm({
        nome:            cliente.nome || '',
        estabelecimento: cliente.estabelecimento || '',
        cpf:             cliente.cpf  || '',
        cnpj:            cliente.cnpj || '',
        telefone:        cliente.telefone || '',
        cep:             cliente.cep  || '',
        referencias:     cliente.referencias || '',
        data_contrato:   cliente.data_contrato || '',
        qtd_parcelas:    cliente.qtd_parcelas || '',
        valor_parcela:   cliente.valor_parcela || '',
        consultor:       cliente.consultor || '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [cliente, open])

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))
  const mask = (field, value) => set(field, masks[field] ? masks[field](value) : value)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        ...form,
        qtd_parcelas:  parseInt(form.qtd_parcelas),
        valor_parcela: parseFloat(form.valor_parcela),
      }
      if (cliente?.id) {
        await api.put(`/clientes/${cliente.id}`, data)
        toast('Cliente atualizado com sucesso!', 'success')
      } else {
        await api.post('/clientes', data)
        toast('Cliente cadastrado com sucesso!', 'success')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={cliente ? 'Editar Cliente' : 'Novo Cliente'}
      icon={User}
    >
      <form onSubmit={handleSubmit} className="space-y-0">

        <FieldGroup title="Dados Pessoais">
          <div className="grid grid-cols-2 gap-3 mt-1">
            <Input label="Nome Completo *" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome do cliente" required />
            <Input label="Telefone *" value={form.telefone} onChange={e => mask('telefone', e.target.value)} placeholder="(00) 00000-0000" required />
            <Input label="CPF" value={form.cpf} onChange={e => mask('cpf', e.target.value)} placeholder="000.000.000-00" maxLength={14} />
            <Input label="CNPJ" value={form.cnpj} onChange={e => mask('cnpj', e.target.value)} placeholder="00.000.000/0000-00" maxLength={18} />
          </div>
        </FieldGroup>

        <FieldGroup title="Estabelecimento">
          <div className="grid grid-cols-2 gap-3 mt-1">
            <Input label="Nome do Estabelecimento *" value={form.estabelecimento} onChange={e => set('estabelecimento', e.target.value)} placeholder="Nome do negócio" required />
            <Input label="CEP" value={form.cep} onChange={e => mask('cep', e.target.value)} placeholder="00000-000" maxLength={9} />
          </div>
          <div className="mt-3">
            <Textarea label="Referências" value={form.referencias} onChange={e => set('referencias', e.target.value)} placeholder="Endereço completo, ponto de referência..." rows={2} />
          </div>
        </FieldGroup>

        <FieldGroup title="Contrato">
          <div className="grid grid-cols-2 gap-3 mt-1">
            <Input label="Data do Contrato *" type="date" value={form.data_contrato} onChange={e => set('data_contrato', e.target.value)} required />
            <Input label="Qtd. Parcelas Semanais *" type="number" value={form.qtd_parcelas} onChange={e => set('qtd_parcelas', e.target.value)} placeholder="Ex: 12" min={1} max={520} required />
            <Input label="Valor por Parcela (R$) *" type="number" value={form.valor_parcela} onChange={e => set('valor_parcela', e.target.value)} placeholder="500.00" step="0.01" min={0} required />
            <Input label="Consultor *" value={form.consultor} onChange={e => set('consultor', e.target.value)} placeholder="Nome do consultor" required />
          </div>
        </FieldGroup>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-line">
          <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando…' : (cliente ? 'Salvar Alterações' : 'Cadastrar Cliente')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

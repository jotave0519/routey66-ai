'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Card, PageHeader, Badge, Icon, Btn, Table, TR, TD, EmptyState, Input } from '@/components/ui'

interface Customer { id: string; name: string; phone: string; createdAt: string; whatsappName: string | null }

const inp: React.CSSProperties = {
  width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px',
  fontSize: 13, fontFamily: 'inherit', color: 'var(--text)', background: 'var(--card)', outline: 'none',
}
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 5 }

function CreateCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Customer) => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) { setError('Nome e telefone são obrigatórios'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post<{ customer: Customer }>('/admin/customers', { name: name.trim(), phone: phone.trim() })
      onCreated(res.customer)
      onClose()
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Erro ao criar cliente')
      setLoading(false)
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit}
        style={{ background: 'var(--card)', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: 440 }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Novo Cliente</span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="close" size={18} color="var(--muted)" /></button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Nome completo *</label>
            <input style={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João da Silva" autoFocus />
          </div>
          <div>
            <label style={lbl}>Telefone / WhatsApp *</label>
            <input style={inp} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex: 5511999998888" />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Formato: código do país + DDD + número (sem espaços ou traços)</div>
          </div>
          {error && <div style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', borderRadius: 6, padding: '8px 12px' }}>{error}</div>}
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <Btn type="submit" disabled={loading}><Icon name="person_add" size={14} color="#fff" />{loading ? 'Criando…' : 'Criar Cliente'}</Btn>
          <Btn variant="secondary" type="button" onClick={onClose}>Cancelar</Btn>
        </div>
      </form>
    </div>
  )
}

function initials(name: string) {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const router = useRouter()

  function load() {
    setLoading(true)
    api.get<{ data: Customer[]; total: number }>('/admin/customers?limit=200')
      .then((d) => { setCustomers(d.data); setTotal(d.total) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function handleCreated(c: Customer) {
    setCustomers((prev) => [c, ...prev])
    setTotal((t) => t + 1)
  }

  const filtered = customers.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (c.name ?? '').toLowerCase().includes(q) || c.phone.includes(q)
  })

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <PageHeader
        title="Clientes"
        subtitle={`${total} cliente${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}`}
        actions={<Btn onClick={() => setShowCreate(true)}><Icon name="person_add" size={15} color="#fff" />Novo Cliente</Btn>}
      />

      <div style={{ marginBottom: 16 }}>
        <Input value={search} onChange={setSearch} placeholder="Buscar por nome ou telefone…" prefix={<Icon name="search" size={16} color="var(--muted)" />} style={{ maxWidth: 360 }} />
      </div>

      <Card>
        {loading ? (
          <EmptyState message="Carregando…" icon="hourglass_empty" />
        ) : filtered.length === 0 ? (
          <EmptyState message="Nenhum cliente encontrado" icon="person_off" />
        ) : (
          <Table headers={['Cliente', 'Telefone', 'Cadastrado em', 'Origem', '']}>
            {filtered.map((c) => (
              <TR key={c.id} onClick={() => router.push(`/customers/${c.id}`)}>
                <TD>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                      {initials(c.name || c.whatsappName || '')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{c.name || <span style={{ color: 'var(--muted)' }}>Sem nome</span>}</div>
                      {c.whatsappName && c.whatsappName !== c.name && (
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.whatsappName}</div>
                      )}
                    </div>
                  </div>
                </TD>
                <TD style={{ fontFamily: 'monospace', color: 'var(--muted)', fontSize: 12 }}>{c.phone}</TD>
                <TD style={{ color: 'var(--muted)', fontSize: 12 }}>{new Date(c.createdAt).toLocaleDateString('pt-BR')}</TD>
                <TD>
                  {c.whatsappName ? <Badge color="green">WhatsApp</Badge> : <Badge color="blue">Manual</Badge>}
                </TD>
                <TD><Icon name="chevron_right" size={16} color="var(--subtle)" /></TD>
              </TR>
            ))}
          </Table>
        )}
      </Card>

      {showCreate && <CreateCustomerModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  )
}

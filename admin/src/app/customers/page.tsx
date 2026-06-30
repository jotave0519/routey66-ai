'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Card, PageHeader, Badge, Icon, Table, TR, TD, EmptyState, Input } from '@/components/ui'

interface Customer { id: string; name: string; phone: string; createdAt: string; whatsappName: string | null }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setLoading(true)
    api.get<{ data: Customer[]; total: number }>('/admin/customers?limit=200')
      .then((d) => { setCustomers(d.data); setTotal(d.total) })
      .finally(() => setLoading(false))
  }, [])

  const filtered = customers.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (c.name ?? '').toLowerCase().includes(q) || c.phone.includes(q)
  })

  function initials(name: string) {
    if (!name) return '?'
    return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <PageHeader
        title="Clientes"
        subtitle={`${total} cliente${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}`}
      />

      <div style={{ marginBottom: 16 }}>
        <Input
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nome ou telefone…"
          prefix={<Icon name="search" size={16} color="var(--muted)" />}
          style={{ maxWidth: 360 }}
        />
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
                <TD><Badge color="green">WhatsApp</Badge></TD>
                <TD><Icon name="chevron_right" size={16} color="var(--subtle)" /></TD>
              </TR>
            ))}
          </Table>
        )}
      </Card>
    </div>
  )
}

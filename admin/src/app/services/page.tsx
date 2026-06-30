'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, PageHeader, Badge, Icon, Table, TR, TD, EmptyState, Btn, Input } from '@/components/ui'

interface Service { id: string; name: string; description: string | null; active: boolean }

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setServices(await api.get<Service[]>('/admin/services'))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await api.post('/admin/services', { name, description: description || null })
    setName(''); setDescription('')
    await load()
    setSaving(false)
  }

  const toggle = async (s: Service) => {
    setToggling(s.id)
    await api.patch(`/admin/services/${s.id}`, { active: !s.active })
    await load()
    setToggling(null)
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>
      <PageHeader title="Serviços" subtitle="Gerencie os serviços oferecidos pela oficina" />

      <Card style={{ padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="add_circle" size={16} color="var(--primary)" /> Novo serviço
        </div>
        <form onSubmit={create} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Input value={name} onChange={setName} placeholder="Nome do serviço" style={{ flex: '1 1 200px', minWidth: 200 }} />
          <Input value={description} onChange={setDescription} placeholder="Descrição (opcional)" style={{ flex: '2 1 280px' }} />
          <Btn type="submit" disabled={saving || !name.trim()}>
            <Icon name="add" size={15} color="#fff" />
            {saving ? 'Adicionando…' : 'Adicionar'}
          </Btn>
        </form>
      </Card>

      <Card>
        {loading ? (
          <EmptyState message="Carregando…" icon="hourglass_empty" />
        ) : services.length === 0 ? (
          <EmptyState message="Nenhum serviço cadastrado" icon="build" />
        ) : (
          <Table headers={['Serviço', 'Descrição', 'Status', '']}>
            {services.map((s) => (
              <TR key={s.id}>
                <TD style={{ fontWeight: 500 }}>{s.name}</TD>
                <TD style={{ color: 'var(--muted)' }}>{s.description ?? '—'}</TD>
                <TD><Badge color={s.active ? 'green' : 'gray'}>{s.active ? 'Ativo' : 'Inativo'}</Badge></TD>
                <TD>
                  <button
                    onClick={() => toggle(s)}
                    disabled={toggling === s.id}
                    style={{ fontSize: 12, color: s.active ? '#dc2626' : 'var(--green)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, padding: 0, opacity: toggling === s.id ? 0.5 : 1 }}
                  >
                    {toggling === s.id ? '…' : s.active ? 'Desativar' : 'Ativar'}
                  </button>
                </TD>
              </TR>
            ))}
          </Table>
        )}
      </Card>
    </div>
  )
}

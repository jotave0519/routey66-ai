'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Card, PageHeader, Icon, Table, TR, TD, EmptyState, Input } from '@/components/ui'

interface VehicleWithOwner {
  id: string; brand: string; model: string; plate: string; year: number | null
  customerId: string; customerName: string; customerPhone: string; createdAt: string
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleWithOwner[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setLoading(true)
    api.get<{ data: VehicleWithOwner[]; total: number }>('/admin/vehicles?limit=200')
      .then((d) => { setVehicles(d.data); setTotal(d.total) })
      .finally(() => setLoading(false))
  }, [])

  const filtered = vehicles.filter((v) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.plate.toLowerCase().includes(q) ||
      (v.customerName || '').toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <PageHeader title="Veículos" subtitle={`${total} veículo${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}`} />

      <div style={{ marginBottom: 16 }}>
        <Input value={search} onChange={setSearch} placeholder="Buscar por marca, modelo, placa ou cliente…" prefix={<Icon name="search" size={16} color="var(--muted)" />} style={{ maxWidth: 400 }} />
      </div>

      <Card>
        {loading ? (
          <EmptyState message="Carregando…" icon="hourglass_empty" />
        ) : filtered.length === 0 ? (
          <EmptyState message="Nenhum veículo encontrado" icon="no_crash" />
        ) : (
          <Table headers={['Veículo', 'Placa', 'Ano', 'Proprietário', '']}>
            {filtered.map((v) => (
              <TR key={v.id} onClick={() => router.push(`/vehicles/${v.id}`)}>
                <TD>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="directions_car" size={18} color="#1d4ed8" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{v.brand} {v.model}</div>
                    </div>
                  </div>
                </TD>
                <TD style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{v.plate}</TD>
                <TD style={{ color: 'var(--muted)' }}>{v.year ?? '—'}</TD>
                <TD>
                  <div style={{ fontSize: 13 }}>{v.customerName || <span style={{ color: 'var(--muted)' }}>—</span>}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{v.customerPhone}</div>
                </TD>
                <TD><Icon name="chevron_right" size={16} color="var(--subtle)" /></TD>
              </TR>
            ))}
          </Table>
        )}
      </Card>
    </div>
  )
}

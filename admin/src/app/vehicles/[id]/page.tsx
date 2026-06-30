import { api } from '@/lib/api'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, Badge, Icon, Table, TR, TD, EmptyState } from '@/components/ui'

interface Vehicle { id: string; brand: string; model: string; plate: string; year: number | null; customerId: string; createdAt: string }

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: 'green' | 'blue' | 'gray' | 'red' | 'orange' | 'yellow' }> = {
    SCHEDULED: { label: 'Agendado', color: 'blue' },
    RESCHEDULED: { label: 'Remarcado', color: 'orange' },
    COMPLETED: { label: 'Concluído', color: 'green' },
    CANCELLED: { label: 'Cancelado', color: 'red' },
  }
  const m = map[status] ?? { label: status, color: 'gray' }
  return <Badge color={m.color}>{m.label}</Badge>
}

export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  let vehicle: Vehicle

  try {
    const data = await api.get<{ vehicle: Vehicle }>(`/admin/vehicles/${id}`)
    vehicle = data.vehicle
  } catch {
    notFound()
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13, color: 'var(--muted)' }}>
        <Link href="/vehicles" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Veículos</Link>
        <Icon name="chevron_right" size={14} />
        <span style={{ color: 'var(--text)' }}>{vehicle.brand} {vehicle.model}</span>
      </div>

      <Card style={{ padding: '28px 24px', display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: 14, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="directions_car" size={30} color="#1d4ed8" />
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{vehicle.brand} {vehicle.model}</div>
          <div style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)', marginTop: 4 }}>{vehicle.plate}</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            {vehicle.year && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                <Icon name="calendar_today" size={13} /> {vehicle.year}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
              <Icon name="person" size={13} />
              <Link href={`/customers/${vehicle.customerId}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>Ver proprietário</Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
              <Icon name="add_circle" size={13} /> Cadastrado em {new Date(vehicle.createdAt).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="build" size={16} color="var(--primary)" /> Detalhes do veículo
        </div>
        <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'Marca', value: vehicle.brand },
            { label: 'Modelo', value: vehicle.model },
            { label: 'Placa', value: vehicle.plate },
            { label: 'Ano', value: vehicle.year?.toString() ?? '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 500, fontFamily: label === 'Placa' ? 'monospace' : undefined }}>{value}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

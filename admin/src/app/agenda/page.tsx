'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, PageHeader, Badge, Icon, EmptyState } from '@/components/ui'

interface Appt {
  id: string; appointmentDate: string; status: string
  customerName: string; vehicleBrand: string; vehicleModel: string; vehiclePlate: string; serviceName: string
}

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

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })
}

function groupByDate(appts: Appt[]): Record<string, Appt[]> {
  const groups: Record<string, Appt[]> = {}
  for (const a of appts) {
    const d = new Date(a.appointmentDate)
    const key = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(a)
  }
  return groups
}

export default function AgendaPage() {
  const [appts, setAppts] = useState<Appt[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'upcoming' | 'all'>('upcoming')

  useEffect(() => {
    setLoading(true)
    api.get<{ data: Appt[] }>('/admin/appointments?limit=300')
      .then((d) => setAppts((d.data ?? []).sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())))
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const filtered = filter === 'upcoming'
    ? appts.filter((a) => new Date(a.appointmentDate) >= now && a.status !== 'CANCELLED')
    : appts

  const groups = groupByDate(filtered)
  const sortedDates = Object.keys(groups)

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>
      <PageHeader title="Agenda" subtitle="Todos os agendamentos" />

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['upcoming', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: filter === f ? 'var(--primary)' : 'var(--card)',
              color: filter === f ? '#fff' : 'var(--muted)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {f === 'upcoming' ? 'Próximos' : 'Todos'}
          </button>
        ))}
      </div>

      {loading ? (
        <Card><EmptyState message="Carregando…" icon="hourglass_empty" /></Card>
      ) : sortedDates.length === 0 ? (
        <Card><EmptyState message="Nenhum agendamento encontrado" icon="event_busy" /></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {sortedDates.map((date) => (
            <div key={date}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{date}</div>
              <Card>
                {groups[date].map((a, i) => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: i < groups[date].length - 1 ? '1px solid var(--border)' : undefined }}>
                    <div style={{ minWidth: 50, textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>{fmtTime(a.appointmentDate)}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{a.customerName}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        {a.serviceName} · {a.vehicleBrand} {a.vehicleModel}
                        <span style={{ fontFamily: 'monospace', marginLeft: 6 }}>{a.vehiclePlate}</span>
                      </div>
                    </div>
                    {statusBadge(a.status)}
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

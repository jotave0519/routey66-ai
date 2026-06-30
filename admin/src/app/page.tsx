import Link from 'next/link'
import { api } from '@/lib/api'
import { Card, PageHeader, StatCard, Badge, Icon, EmptyState } from '@/components/ui'

interface Appt {
  id: string
  appointmentDate: string
  status: string
  customerName: string
  vehicleBrand: string
  vehicleModel: string
  vehiclePlate: string
  serviceName: string
}

interface DashData {
  stats: { customers: number; appointmentsToday: number; conversationsActive: number }
  todayAppointments: Appt[]
  upcomingAppointments: Appt[]
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

async function getData(): Promise<DashData> {
  try {
    return await api.get<DashData>('/admin/dashboard')
  } catch {
    return { stats: { customers: 0, appointmentsToday: 0, conversationsActive: 0 }, todayAppointments: [], upcomingAppointments: [] }
  }
}

export default async function DashboardPage() {
  const { stats, todayAppointments, upcomingAppointments } = await getData()

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1180 }}>
      <PageHeader title="Dashboard" subtitle="Visão geral da Route'y 66" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Clientes cadastrados" value={stats.customers} icon="group" color="var(--primary)" />
        <StatCard label="Agendamentos hoje" value={stats.appointmentsToday} icon="calendar_month" color="#1d4ed8" />
        <StatCard label="Conversas ativas" value={stats.conversationsActive} icon="chat" color="var(--green)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}>
              <Icon name="today" size={17} color="var(--primary)" /> Hoje
            </div>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{todayAppointments.length} agend.</span>
          </div>
          {todayAppointments.length === 0 ? (
            <EmptyState message="Sem agendamentos hoje" icon="event_available" />
          ) : todayAppointments.map((a) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ textAlign: 'center', minWidth: 44, flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>{fmtTime(a.appointmentDate)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.customerName}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{a.serviceName} · {a.vehicleBrand} {a.vehicleModel}</div>
              </div>
              {statusBadge(a.status)}
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}>
              <Icon name="upcoming" size={17} color="#1d4ed8" /> Próximos
            </div>
            <Link href="/agenda" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none' }}>Ver agenda →</Link>
          </div>
          {upcomingAppointments.length === 0 ? (
            <EmptyState message="Sem agendamentos futuros" icon="event_busy" />
          ) : upcomingAppointments.map((a) => {
            const d = new Date(a.appointmentDate)
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'center', minWidth: 44, flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{d.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'America/Sao_Paulo' })}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{d.toLocaleDateString('pt-BR', { day: '2-digit', timeZone: 'America/Sao_Paulo' })}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{d.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' })}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.customerName}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{a.serviceName} · {fmtTime(a.appointmentDate)}</div>
                </div>
                {statusBadge(a.status)}
              </div>
            )
          })}
        </Card>
      </div>
    </div>
  )
}

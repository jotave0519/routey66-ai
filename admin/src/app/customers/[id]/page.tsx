import { api } from '@/lib/api'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, Badge, Icon, Table, TR, TD, EmptyState } from '@/components/ui'

interface Customer { id: string; name: string; phone: string; createdAt: string; whatsappName: string | null }
interface Vehicle { id: string; brand: string; model: string; plate: string; year: number | null }
interface Appt { id: string; appointmentDate: string; status: string; serviceName: string; vehicleBrand: string; vehicleModel: string; vehiclePlate: string }

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

function initials(name: string) {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  let data: { customer: Customer; vehicles: Vehicle[]; appointments: Appt[] }
  try {
    data = await api.get(`/admin/customers/${id}`)
  } catch {
    notFound()
  }
  const { customer, vehicles, appointments } = data

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13, color: 'var(--muted)' }}>
        <Link href="/customers" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Clientes</Link>
        <Icon name="chevron_right" size={14} />
        <span style={{ color: 'var(--text)' }}>{customer.name || customer.phone}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Profile card */}
        <Card style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 auto 12px' }}>
            {initials(customer.name || customer.whatsappName || '')}
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>{customer.name || <span style={{ color: 'var(--muted)' }}>Sem nome</span>}</div>
          {customer.whatsappName && customer.whatsappName !== customer.name && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{customer.whatsappName}</div>
          )}
          <div style={{ marginTop: 8 }}><Badge color="green">WhatsApp</Badge></div>

          <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="phone" size={14} color="var(--muted)" />
              <span style={{ fontSize: 12, color: 'var(--text)', fontFamily: 'monospace' }}>{customer.phone}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="calendar_today" size={14} color="var(--muted)" />
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                Desde {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="directions_car" size={14} color="var(--muted)" />
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{vehicles.length} veículo{vehicles.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="event" size={14} color="var(--muted)" />
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{appointments.length} agendamento{appointments.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </Card>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Vehicles */}
          <Card>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="directions_car" size={16} color="var(--primary)" /> Veículos
            </div>
            {vehicles.length === 0 ? (
              <EmptyState message="Nenhum veículo cadastrado" icon="no_crash" />
            ) : (
              <div style={{ padding: '12px 20px', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {vehicles.map((v) => (
                  <Link key={v.id} href={`/vehicles/${v.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', minWidth: 180, cursor: 'pointer', transition: 'border-color 0.15s', background: 'var(--bg)' }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{v.brand} {v.model}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        {v.plate}{v.year ? ` · ${v.year}` : ''}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Appointments */}
          <Card>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="event" size={16} color="#1d4ed8" /> Histórico de Agendamentos
            </div>
            {appointments.length === 0 ? (
              <EmptyState message="Nenhum agendamento registrado" icon="event_busy" />
            ) : (
              <Table headers={['Data', 'Serviço', 'Veículo', 'Status']}>
                {appointments.map((a) => (
                  <TR key={a.id}>
                    <TD style={{ whiteSpace: 'nowrap', color: 'var(--muted)', fontSize: 12 }}>
                      {new Date(a.appointmentDate).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </TD>
                    <TD style={{ fontWeight: 500 }}>{a.serviceName}</TD>
                    <TD style={{ color: 'var(--muted)', fontSize: 12 }}>{a.vehicleBrand} {a.vehicleModel} · {a.vehiclePlate}</TD>
                    <TD>{statusBadge(a.status)}</TD>
                  </TR>
                ))}
              </Table>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

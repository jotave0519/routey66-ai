'use client'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Card, Badge, Icon, Btn, EmptyState } from '@/components/ui'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Appt {
  id: string; appointmentDate: string; status: string; notes: string | null
  customerName: string; customerPhone: string; customerId: string
  vehicleBrand: string; vehicleModel: string; vehiclePlate: string; vehicleId: string
  serviceName: string; serviceId: string; googleEventId: string | null
}
interface Customer { id: string; name: string; phone: string }
interface Vehicle { id: string; brand: string; model: string; plate: string }
interface Service { id: string; name: string }
interface Slot { start: string; end: string }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BRT = 'America/Sao_Paulo'
const DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function toBRTStr(d: Date) { return d.toLocaleDateString('en-CA', { timeZone: BRT }) }
function sameDay(a: Date, b: Date) { return toBRTStr(a) === toBRTStr(b) }
function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString('pt-BR', { timeZone: BRT, hour: '2-digit', minute: '2-digit' }) }
function fmtDateLong(d: Date) { return d.toLocaleDateString('pt-BR', { timeZone: BRT, weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) }
function fmtDateShort(d: Date) { return d.toLocaleDateString('pt-BR', { timeZone: BRT, day: '2-digit', month: '2-digit' }) }

function getWeekDays(date: Date): Date[] {
  const d = new Date(date)
  const dow = d.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + diff)
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(d); x.setDate(d.getDate() + i); return x })
}

function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startDow = first.getDay() === 0 ? 6 : first.getDay() - 1
  const days: Date[] = []
  for (let i = startDow; i > 0; i--) { const d = new Date(first); d.setDate(1 - i); days.push(d) }
  for (let i = 1; i <= last.getDate(); i++) days.push(new Date(year, month, i))
  while (days.length % 7 !== 0) { const d = new Date(days[days.length - 1]); d.setDate(d.getDate() + 1); days.push(d) }
  return days
}

function statusColor(s: string): 'blue' | 'orange' | 'green' | 'red' | 'gray' {
  return ({ SCHEDULED: 'blue', RESCHEDULED: 'orange', COMPLETED: 'green', CANCELLED: 'red' } as Record<string, 'blue' | 'orange' | 'green' | 'red' | 'gray'>)[s] ?? 'gray'
}
function statusLabel(s: string) {
  return ({ SCHEDULED: 'Agendado', RESCHEDULED: 'Remarcado', COMPLETED: 'Concluído', CANCELLED: 'Cancelado' })[s] ?? s
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7) // 07–19

// ─── Appointment Card ─────────────────────────────────────────────────────────

function ApptCard({ a, onClick, compact }: { a: Appt; onClick: () => void; compact?: boolean }) {
  const cancelled = a.status === 'CANCELLED'
  return (
    <div onClick={onClick} style={{
      background: cancelled ? '#f5f5f5' : 'var(--card)', border: '1px solid var(--border)', borderRadius: 8,
      padding: compact ? '6px 10px' : '10px 14px', cursor: 'pointer', marginBottom: 4,
      opacity: cancelled ? 0.55 : 1, borderLeft: `3px solid ${cancelled ? '#ccc' : 'var(--primary)'}`,
    }}>
      <div style={{ fontWeight: 600, fontSize: compact ? 11 : 12, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {fmtTime(a.appointmentDate)} · {a.customerName}
      </div>
      {!compact && (
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
          {a.serviceName} · {a.vehicleBrand} {a.vehicleModel}
        </div>
      )}
    </div>
  )
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({ date, appts, onSelect }: { date: Date; appts: Appt[]; onSelect: (a: Appt) => void }) {
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      {appts.length === 0 ? (
        <Card><EmptyState message="Nenhum agendamento neste dia" icon="event_busy" /></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {HOURS.map((h) => {
            const hoursAppts = appts.filter((a) => {
              const brtH = Number(new Date(a.appointmentDate).toLocaleString('en-US', { timeZone: BRT, hour: 'numeric', hour12: false }))
              return brtH === h
            })
            return (
              <div key={h} style={{ display: 'flex', gap: 12, minHeight: 56, borderBottom: '1px solid var(--border)', padding: '8px 0' }}>
                <div style={{ width: 44, flexShrink: 0, fontSize: 12, color: 'var(--muted)', fontWeight: 500, paddingTop: 2 }}>
                  {String(h).padStart(2, '0')}:00
                </div>
                <div style={{ flex: 1 }}>
                  {hoursAppts.map((a) => <ApptCard key={a.id} a={a} onClick={() => onSelect(a)} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({ days, appts, onSelect, onDayClick }: { days: Date[]; appts: Appt[]; onSelect: (a: Appt) => void; onDayClick: (d: Date) => void }) {
  const today = new Date()
  return (
    <div style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
      {days.map((day, i) => {
        const isToday = sameDay(day, today)
        const dayAppts = appts.filter(a => sameDay(new Date(a.appointmentDate), day))
          .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
        return (
          <div key={i} style={{ background: 'var(--card)', border: `1px solid ${isToday ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 10, overflow: 'hidden' }}>
            <div
              onClick={() => onDayClick(day)}
              style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isToday ? 'var(--primary)' : undefined }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: isToday ? 'rgba(255,255,255,0.8)' : 'var(--muted)', textTransform: 'uppercase' }}>{DAY_NAMES[i]}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: isToday ? '#fff' : 'var(--text)', lineHeight: 1.2 }}>{day.getDate()}</div>
            </div>
            <div style={{ padding: '6px 6px', minHeight: 80 }}>
              {dayAppts.length === 0 ? (
                <div style={{ fontSize: 10, color: 'var(--subtle)', padding: '4px 2px' }}>—</div>
              ) : dayAppts.map((a) => <ApptCard key={a.id} a={a} onClick={() => onSelect(a)} compact />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({ year, month, appts, onSelect, onDayClick }: { year: number; month: number; appts: Appt[]; onSelect: (a: Appt) => void; onDayClick: (d: Date) => void }) {
  const grid = getMonthGrid(year, month)
  const today = new Date()
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {DAY_NAMES.map((d) => (
          <div key={d} style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textAlign: 'center', padding: '4px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {grid.map((day, i) => {
          const isCurrentMonth = day.getMonth() === month
          const isToday = sameDay(day, today)
          const dayAppts = appts.filter(a => sameDay(new Date(a.appointmentDate), day) && a.status !== 'CANCELLED')
          return (
            <div key={i} onClick={() => onDayClick(day)} style={{
              background: isToday ? 'var(--primary)' : isCurrentMonth ? 'var(--card)' : 'var(--bg)',
              border: `1px solid ${isToday ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 8, padding: '6px 8px', minHeight: 72, cursor: 'pointer', opacity: isCurrentMonth ? 1 : 0.4,
            }}>
              <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? '#fff' : 'var(--text)', marginBottom: 4 }}>{day.getDate()}</div>
              {dayAppts.slice(0, 3).map((a) => (
                <div key={a.id} onClick={(e) => { e.stopPropagation(); onSelect(a) }} style={{
                  fontSize: 10, fontWeight: 500, background: isToday ? 'rgba(255,255,255,0.2)' : 'var(--primary)', color: isToday ? '#fff' : '#fff',
                  borderRadius: 4, padding: '2px 5px', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {fmtTime(a.appointmentDate)} {a.customerName}
                </div>
              ))}
              {dayAppts.length > 3 && (
                <div style={{ fontSize: 10, color: isToday ? 'rgba(255,255,255,0.7)' : 'var(--muted)' }}>+{dayAppts.length - 3} mais</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Appointment Detail Modal ─────────────────────────────────────────────────

function AppointmentModal({ appt, onClose, onUpdated }: { appt: Appt; onClose: () => void; onUpdated: () => void }) {
  const [rescheduling, setRescheduling] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [loading, setLoading] = useState(false)

  async function cancel() {
    if (!confirm('Cancelar este agendamento?')) return
    setLoading(true)
    await api.patch(`/admin/appointments/${appt.id}/cancel`, {})
    onUpdated(); onClose()
  }

  async function loadSlots(date: string) {
    setNewDate(date); setSelectedSlot('')
    if (!date) return
    const r = await api.get<{ slots: Slot[] }>(`/admin/appointments/slots?date=${date}`)
    setSlots(r.slots ?? [])
  }

  async function confirmReschedule() {
    if (!selectedSlot) return
    setLoading(true)
    await api.patch(`/admin/appointments/${appt.id}/reschedule`, { appointment_date: selectedSlot })
    onUpdated(); onClose()
  }

  const isCancelled = appt.status === 'CANCELLED'

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 480 }}>
        <ModalHeader title={appt.customerName} subtitle={statusLabel(appt.status)} badge={<Badge color={statusColor(appt.status)}>{statusLabel(appt.status)}</Badge>} onClose={onClose} />
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <InfoRow icon="schedule" label="Data / Hora" value={`${fmtDateLong(new Date(appt.appointmentDate))} às ${fmtTime(appt.appointmentDate)}`} />
          <InfoRow icon="phone" label="Telefone" value={appt.customerPhone} />
          <InfoRow icon="build" label="Serviço" value={appt.serviceName} />
          <InfoRow icon="directions_car" label="Veículo" value={`${appt.vehicleBrand} ${appt.vehicleModel}`} />
          <InfoRow icon="pin" label="Placa" value={appt.vehiclePlate} mono />
          {appt.notes && <InfoRow icon="notes" label="Observações" value={appt.notes} />}
          {appt.googleEventId && <InfoRow icon="event" label="Google Calendar" value="Sincronizado" />}

          {rescheduling && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)' }}>Nova data</label>
              <input type="date" value={newDate} onChange={(e) => loadSlots(e.target.value)}
                style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', color: 'var(--text)', background: 'var(--bg)' }} />
              {slots.length > 0 && (
                <>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)' }}>Horário disponível</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {slots.map((s) => (
                      <button key={s.start} onClick={() => setSelectedSlot(s.start)} style={{
                        padding: '5px 12px', borderRadius: 6, border: `1px solid ${selectedSlot === s.start ? 'var(--primary)' : 'var(--border)'}`,
                        background: selectedSlot === s.start ? 'var(--primary)' : 'var(--card)', color: selectedSlot === s.start ? '#fff' : 'var(--text)',
                        fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                      }}>{fmtTime(s.start)}</button>
                    ))}
                  </div>
                </>
              )}
              {newDate && slots.length === 0 && <div style={{ fontSize: 12, color: 'var(--muted)' }}>Sem horários disponíveis neste dia.</div>}
            </div>
          )}
        </div>
        {!isCancelled && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            {!rescheduling ? (
              <>
                <Btn variant="secondary" onClick={() => setRescheduling(true)} disabled={loading}>
                  <Icon name="edit_calendar" size={14} color="var(--text)" /> Remarcar
                </Btn>
                <Btn variant="danger" onClick={cancel} disabled={loading}>
                  <Icon name="cancel" size={14} color="#fff" /> Cancelar
                </Btn>
              </>
            ) : (
              <>
                <Btn onClick={confirmReschedule} disabled={!selectedSlot || loading}>
                  <Icon name="check" size={14} color="#fff" /> Confirmar
                </Btn>
                <Btn variant="secondary" onClick={() => setRescheduling(false)}>Voltar</Btn>
              </>
            )}
          </div>
        )}
      </div>
    </Overlay>
  )
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [customerId, setCustomerId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  useEffect(() => {
    Promise.all([
      api.get<{ data: Customer[] }>('/admin/customers?limit=200'),
      api.get<Service[]>('/admin/services'),
    ]).then(([c, s]) => { setCustomers(c.data ?? []); setServices(Array.isArray(s) ? s : []) })
  }, [])

  async function selectCustomer(id: string) {
    setCustomerId(id); setVehicleId(''); setVehicles([])
    if (!id) return
    const r = await api.get<{ vehicles: Vehicle[] }>(`/admin/customers/${id}`)
    setVehicles(r.vehicles ?? [])
    setStep(2)
  }

  async function selectDate(d: string) {
    setDate(d); setSlot('')
    if (!d) return
    const r = await api.get<{ slots: Slot[] }>(`/admin/appointments/slots?date=${d}`)
    setSlots(r.slots ?? [])
  }

  async function confirm() {
    if (!customerId || !vehicleId || !serviceId || !slot) return
    setLoading(true)
    await api.post('/admin/appointments', { customerId, vehicleId, serviceId, appointmentDate: slot, notes: notes || undefined })
    onCreated(); onClose()
  }

  const selStyle: React.CSSProperties = {
    width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px',
    fontSize: 13, fontFamily: 'inherit', color: 'var(--text)', background: 'var(--bg)', outline: 'none',
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 480 }}>
        <ModalHeader title="Novo Agendamento" onClose={onClose} />
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Cliente</label>
            <select value={customerId} onChange={(e) => selectCustomer(e.target.value)} style={selStyle}>
              <option value="">Selecione o cliente…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name || c.phone}</option>)}
            </select>
          </div>

          {customerId && (
            <div>
              <label style={labelStyle}>Veículo</label>
              <select value={vehicleId} onChange={(e) => { setVehicleId(e.target.value); setStep(3) }} style={selStyle}>
                <option value="">Selecione o veículo…</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model} – {v.plate}</option>)}
              </select>
            </div>
          )}

          {vehicleId && (
            <div>
              <label style={labelStyle}>Serviço</label>
              <select value={serviceId} onChange={(e) => { setServiceId(e.target.value); setStep(4) }} style={selStyle}>
                <option value="">Selecione o serviço…</option>
                {services.filter((s: Service & { active?: boolean }) => s.active !== false).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {serviceId && (
            <div>
              <label style={labelStyle}>Data</label>
              <input type="date" value={date} onChange={(e) => selectDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} style={selStyle} />
            </div>
          )}

          {date && slots.length > 0 && (
            <div>
              <label style={labelStyle}>Horário disponível</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {slots.map((s) => (
                  <button key={s.start} onClick={() => setSlot(s.start)} style={{
                    padding: '6px 12px', borderRadius: 6, border: `1px solid ${slot === s.start ? 'var(--primary)' : 'var(--border)'}`,
                    background: slot === s.start ? 'var(--primary)' : 'var(--card)', color: slot === s.start ? '#fff' : 'var(--text)',
                    fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{fmtTime(s.start)}</button>
                ))}
              </div>
            </div>
          )}
          {date && slots.length === 0 && serviceId && (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Sem horários disponíveis neste dia.</div>
          )}

          {slot && (
            <div>
              <label style={labelStyle}>Observações (opcional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Cliente solicitou revisão completa…"
                style={{ ...selStyle, resize: 'vertical', minHeight: 72 }} />
            </div>
          )}
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <Btn onClick={confirm} disabled={!customerId || !vehicleId || !serviceId || !slot || loading}>
            <Icon name="check" size={14} color="#fff" /> {loading ? 'Criando…' : 'Confirmar agendamento'}
          </Btn>
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </Overlay>
  )
}

// ─── Shared modal primitives ──────────────────────────────────────────────────

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--card)', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxHeight: '90vh', overflow: 'auto', width: '100%', maxWidth: 520 }}>
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, subtitle, badge, onClose }: { title: string; subtitle?: string; badge?: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{title}</div>
        {subtitle && !badge && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{subtitle}</div>}
        {badge && <div style={{ marginTop: 6 }}>{badge}</div>}
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}>
        <Icon name="close" size={18} color="var(--muted)" />
      </button>
    </div>
  )
}

function InfoRow({ icon, label, value, mono }: { icon: string; label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <Icon name={icon} size={15} color="var(--muted)" />
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--text)', fontFamily: mono ? 'monospace' : undefined, marginTop: 1 }}>{value}</div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }

// ─── Nav button ───────────────────────────────────────────────────────────────

function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 7, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text)' }}>
      {children}
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const [view, setView] = useState<'day' | 'week' | 'month'>('week')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appts, setAppts] = useState<Appt[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppt, setSelectedAppt] = useState<Appt | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const loadAppts = useCallback(async () => {
    try {
      const d = await api.get<{ data: Appt[] }>('/admin/appointments?limit=500')
      setAppts(d.data ?? [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    loadAppts()
    const t = setInterval(loadAppts, 30_000)
    return () => clearInterval(t)
  }, [loadAppts])

  function navigate(dir: -1 | 1) {
    const d = new Date(selectedDate)
    if (view === 'day') d.setDate(d.getDate() + dir)
    else if (view === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setMonth(d.getMonth() + dir)
    setSelectedDate(d)
  }

  function headerLabel() {
    if (view === 'day') return fmtDateLong(selectedDate)
    if (view === 'week') {
      const days = getWeekDays(selectedDate)
      return `${fmtDateShort(days[0])} – ${fmtDateShort(days[6])} ${days[6].getFullYear()}`
    }
    return `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
  }

  const weekDays = getWeekDays(selectedDate)
  const dayAppts = appts.filter(a => sameDay(new Date(a.appointmentDate), selectedDate))
    .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())

  return (
    <div style={{ padding: '24px 28px', height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Agenda</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, marginTop: 2 }}>Sincronizada com Google Calendar · Atualiza a cada 30s</p>
        </div>
        <Btn onClick={() => setShowCreate(true)}>
          <Icon name="add" size={15} color="#fff" /> Agendar
        </Btn>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 2 }}>
          {(['day', 'week', 'month'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
              background: view === v ? 'var(--primary)' : 'transparent',
              color: view === v ? '#fff' : 'var(--muted)',
            }}>{{ day: 'Dia', week: 'Semana', month: 'Mês' }[v]}</button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <NavBtn onClick={() => navigate(-1)}><Icon name="chevron_left" size={18} color="var(--text)" /></NavBtn>
          <span style={{ fontSize: 13, fontWeight: 500, minWidth: 220, textAlign: 'center', color: 'var(--text)' }}>{headerLabel()}</span>
          <NavBtn onClick={() => navigate(1)}><Icon name="chevron_right" size={18} color="var(--text)" /></NavBtn>
        </div>

        <button onClick={() => setSelectedDate(new Date())} style={{
          padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)',
          fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text)',
        }}>Hoje</button>
      </div>

      {/* Calendar */}
      {loading ? (
        <Card style={{ flex: 1 }}><EmptyState message="Carregando agendamentos…" icon="hourglass_empty" /></Card>
      ) : view === 'day' ? (
        <DayView date={selectedDate} appts={dayAppts} onSelect={setSelectedAppt} />
      ) : view === 'week' ? (
        <WeekView days={weekDays} appts={appts} onSelect={setSelectedAppt} onDayClick={(d) => { setSelectedDate(d); setView('day') }} />
      ) : (
        <MonthView year={selectedDate.getFullYear()} month={selectedDate.getMonth()} appts={appts} onSelect={setSelectedAppt} onDayClick={(d) => { setSelectedDate(d); setView('day') }} />
      )}

      {selectedAppt && <AppointmentModal appt={selectedAppt} onClose={() => setSelectedAppt(null)} onUpdated={loadAppts} />}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={loadAppts} />}
    </div>
  )
}

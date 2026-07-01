'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Card, PageHeader, Icon, Btn, Table, TR, TD, EmptyState, Input } from '@/components/ui'

interface VehicleWithOwner {
  id: string; brand: string; model: string; plate: string; year: number | null
  customerId: string; customerName: string; customerPhone: string; createdAt: string
}
interface Customer { id: string; name: string; phone: string }

const inp: React.CSSProperties = {
  width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px',
  fontSize: 13, fontFamily: 'inherit', color: 'var(--text)', background: 'var(--card)', outline: 'none',
}
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 5 }

const BRANDS = ['Chevrolet', 'Fiat', 'Ford', 'Honda', 'Hyundai', 'Jeep', 'Nissan', 'Peugeot', 'Renault', 'Toyota', 'Volkswagen', 'Outro']

function CreateVehicleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [form, setForm] = useState({ customerId: '', brand: '', model: '', plate: '', year: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<{ data: Customer[] }>('/admin/customers?limit=500').then((r) => setCustomers(r.data ?? []))
  }, [])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customerId || !form.brand || !form.model || !form.plate) { setError('Preencha todos os campos obrigatórios'); return }
    setLoading(true); setError('')
    try {
      await api.post('/admin/vehicles', {
        customerId: form.customerId, brand: form.brand.trim(), model: form.model.trim(),
        plate: form.plate.trim(), year: form.year ? Number(form.year) : undefined,
      })
      onCreated(); onClose()
    } catch (e: unknown) { setError((e as Error).message ?? 'Erro ao criar veículo'); setLoading(false) }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit}
        style={{ background: 'var(--card)', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: 480 }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Novo Veículo</span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="close" size={18} color="var(--muted)" /></button>
        </div>
        <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Proprietário *</label>
            <select style={inp} value={form.customerId} onChange={(e) => set('customerId', e.target.value)} autoFocus>
              <option value="">Selecione um cliente…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Marca *</label>
            <select style={inp} value={form.brand} onChange={(e) => set('brand', e.target.value)}>
              <option value="">Selecione…</option>
              {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Modelo *</label>
            <input style={inp} value={form.model} onChange={(e) => set('model', e.target.value)} placeholder="Ex: Onix 1.0 Turbo" />
          </div>
          <div>
            <label style={lbl}>Placa *</label>
            <input style={inp} value={form.plate} onChange={(e) => set('plate', e.target.value.toUpperCase())} placeholder="ABC1D23" maxLength={8} />
          </div>
          <div>
            <label style={lbl}>Ano</label>
            <input style={inp} type="number" min="1950" max={new Date().getFullYear() + 1} value={form.year} onChange={(e) => set('year', e.target.value)} placeholder="Ex: 2022" />
          </div>
          {error && <div style={{ gridColumn: '1/-1', fontSize: 12, color: '#dc2626', background: '#fef2f2', borderRadius: 6, padding: '8px 12px' }}>{error}</div>}
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <Btn type="submit" disabled={loading}><Icon name="directions_car" size={14} color="#fff" />{loading ? 'Criando…' : 'Criar Veículo'}</Btn>
          <Btn variant="secondary" type="button" onClick={onClose}>Cancelar</Btn>
        </div>
      </form>
    </div>
  )
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleWithOwner[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const router = useRouter()

  function load() {
    setLoading(true)
    api.get<{ data: VehicleWithOwner[]; total: number }>('/admin/vehicles?limit=200')
      .then((d) => { setVehicles(d.data); setTotal(d.total) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = vehicles.filter((v) => {
    if (!search) return true
    const q = search.toLowerCase()
    return v.brand.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || v.plate.toLowerCase().includes(q) || (v.customerName || '').toLowerCase().includes(q)
  })

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <PageHeader
        title="Veículos"
        subtitle={`${total} veículo${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}`}
        actions={<Btn onClick={() => setShowCreate(true)}><Icon name="directions_car" size={15} color="#fff" />Novo Veículo</Btn>}
      />

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
                    <div style={{ fontWeight: 500 }}>{v.brand} {v.model}</div>
                  </div>
                </TD>
                <TD style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}>{v.plate}</TD>
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

      {showCreate && <CreateVehicleModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  )
}

'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { Card, PageHeader, Badge, Icon, StatCard, Btn, Table, TR, TD, EmptyState, Input } from '@/components/ui'

interface StockItem {
  id: string; name: string; category: string | null; sku: string | null
  quantity: number; minQuantity: number; unit: string
  costPrice: number | null; salePrice: number | null
  supplier: string | null; notes: string | null
}
interface Movement { id: string; type: 'IN' | 'OUT'; quantity: number; reason: string | null; createdAt: string }
interface Summary { total: number; lowStock: number; totalValue: number }

const UNITS = ['unidade', 'litro', 'ml', 'kg', 'g', 'caixa', 'par', 'metro', 'rolo', 'peça']
const CATEGORIES = ['Lubrificantes', 'Filtros', 'Freios', 'Suspensão', 'Elétrica', 'Pneus', 'Ferramentas', 'Limpeza', 'Outros']

function fmtBRL(v: number | null) {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const inp: React.CSSProperties = {
  width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px',
  fontSize: 13, fontFamily: 'inherit', color: 'var(--text)', background: 'var(--card)', outline: 'none',
}
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 5 }

// ─── Overlay ──────────────────────────────────────────────────────────────────

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--card)', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxHeight: '90vh', overflow: 'auto', minWidth: 340 }}>
        {children}
      </div>
    </div>
  )
}

function MHead({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{title}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}><Icon name="close" size={18} color="var(--muted)" /></button>
    </div>
  )
}

// ─── Item Modal ───────────────────────────────────────────────────────────────

function ItemModal({ item, onClose, onSaved }: { item?: StockItem; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: item?.name ?? '', category: item?.category ?? '', sku: item?.sku ?? '',
    quantity: String(item?.quantity ?? 0), minQuantity: String(item?.minQuantity ?? 0),
    unit: item?.unit ?? 'unidade', costPrice: item?.costPrice != null ? String(item.costPrice) : '',
    salePrice: item?.salePrice != null ? String(item.salePrice) : '', supplier: item?.supplier ?? '', notes: item?.notes ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nome é obrigatório'); return }
    setLoading(true); setError('')
    const body = {
      name: form.name.trim(), category: form.category || undefined, sku: form.sku || undefined,
      quantity: Number(form.quantity) || 0, minQuantity: Number(form.minQuantity) || 0,
      unit: form.unit, costPrice: form.costPrice ? Number(form.costPrice) : undefined,
      salePrice: form.salePrice ? Number(form.salePrice) : undefined,
      supplier: form.supplier || undefined, notes: form.notes || undefined,
    }
    try {
      if (item) await api.patch(`/admin/stock/${item.id}`, body)
      else await api.post('/admin/stock', body)
      onSaved(); onClose()
    } catch (e: unknown) { setError((e as Error).message); setLoading(false) }
  }

  return (
    <Overlay onClose={onClose}>
      <form onSubmit={submit} style={{ width: 520 }}>
        <MHead title={item ? 'Editar Produto' : 'Novo Produto'} onClose={onClose} />
        <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Nome *</label>
            <input style={inp} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Óleo Motor 5W30" />
          </div>
          <div>
            <label style={lbl}>Categoria</label>
            <select style={inp} value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Selecione…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>SKU / Código</label>
            <input style={inp} value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="OIL-5W30-1L" />
          </div>
          <div>
            <label style={lbl}>Quantidade</label>
            <input style={inp} type="number" min="0" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Estoque mínimo</label>
            <input style={inp} type="number" min="0" value={form.minQuantity} onChange={(e) => set('minQuantity', e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Unidade</label>
            <select style={inp} value={form.unit} onChange={(e) => set('unit', e.target.value)}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Fornecedor</label>
            <input style={inp} value={form.supplier} onChange={(e) => set('supplier', e.target.value)} placeholder="Nome do fornecedor" />
          </div>
          <div>
            <label style={lbl}>Valor de compra (R$)</label>
            <input style={inp} type="number" min="0" step="0.01" value={form.costPrice} onChange={(e) => set('costPrice', e.target.value)} placeholder="0,00" />
          </div>
          <div>
            <label style={lbl}>Valor de venda (R$)</label>
            <input style={inp} type="number" min="0" step="0.01" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} placeholder="0,00" />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Observações</label>
            <textarea style={{ ...inp, resize: 'vertical', minHeight: 60 }} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
          {error && <div style={{ gridColumn: '1/-1', fontSize: 12, color: '#dc2626', background: '#fef2f2', borderRadius: 6, padding: '8px 12px' }}>{error}</div>}
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <Btn type="submit" disabled={loading}><Icon name="save" size={14} color="#fff" />{loading ? 'Salvando…' : 'Salvar'}</Btn>
          <Btn variant="secondary" type="button" onClick={onClose}>Cancelar</Btn>
        </div>
      </form>
    </Overlay>
  )
}

// ─── Movement Modal ───────────────────────────────────────────────────────────

function MovModal({ item, onClose, onSaved }: { item: StockItem; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<'IN' | 'OUT'>('IN')
  const [qty, setQty] = useState('1')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [movements, setMovements] = useState<Movement[]>([])

  useEffect(() => {
    api.get<{ data: Movement[] }>(`/admin/stock/${item.id}/movements`).then((r) => setMovements(r.data ?? []))
  }, [item.id])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await api.post(`/admin/stock/${item.id}/movement`, { type, quantity: Number(qty), reason: reason || undefined })
    onSaved(); onClose()
  }

  const preview = item.quantity + (type === 'IN' ? 1 : -1) * Number(qty)

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 440 }}>
        <MHead title={`Movimentação — ${item.name}`} onClose={onClose} />
        <form onSubmit={submit}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['IN', 'OUT'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setType(t)} style={{
                  flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                  border: `2px solid ${type === t ? (t === 'IN' ? '#16a34a' : '#dc2626') : 'var(--border)'}`,
                  background: type === t ? (t === 'IN' ? '#f0fdf4' : '#fef2f2') : 'var(--card)',
                  color: type === t ? (t === 'IN' ? '#16a34a' : '#dc2626') : 'var(--muted)',
                }}>
                  {t === 'IN' ? '＋ Entrada' : '－ Saída'}
                </button>
              ))}
            </div>
            <div>
              <label style={lbl}>Quantidade ({item.unit})</label>
              <input style={inp} type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} required />
            </div>
            <div>
              <label style={lbl}>Motivo (opcional)</label>
              <input style={inp} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: compra fornecedor, uso em OS #123…" />
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--bg)', borderRadius: 6, padding: '10px 12px' }}>
              Estoque atual: <strong>{item.quantity} {item.unit}</strong>{' → '}após: <strong style={{ color: preview < 0 ? '#dc2626' : 'inherit' }}>{Math.max(0, preview)} {item.unit}</strong>
            </div>
          </div>
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <Btn type="submit" disabled={loading}><Icon name="check" size={14} color="#fff" />{loading ? 'Registrando…' : 'Registrar'}</Btn>
            <Btn variant="secondary" type="button" onClick={onClose}>Cancelar</Btn>
          </div>
        </form>
        {movements.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '14px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Histórico recente</div>
            {movements.slice(0, 6).map((m) => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: m.type === 'IN' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{m.type === 'IN' ? '+' : '−'}{m.quantity} {item.unit}</span>
                <span style={{ color: 'var(--muted)', flex: 1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{m.reason ?? '—'}</span>
                <span style={{ color: 'var(--muted)' }}>{new Date(m.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Overlay>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EstoquePage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editItem, setEditItem] = useState<StockItem | undefined>(undefined)
  const [showCreate, setShowCreate] = useState(false)
  const [movItem, setMovItem] = useState<StockItem | null>(null)

  const load = useCallback(async () => {
    setLoadError('')
    try {
      const [itemsRes, sumRes] = await Promise.all([
        api.get<{ data: StockItem[] }>('/admin/stock?limit=500'),
        api.get<Summary>('/admin/stock/summary'),
      ])
      setItems(itemsRes.data ?? [])
      setSummary(sumRes)
    } catch (e: unknown) {
      setLoadError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function deleteItem(item: StockItem) {
    if (!confirm(`Excluir "${item.name}"? Esta ação não pode ser desfeita.`)) return
    await api.delete(`/admin/stock/${item.id}`)
    load()
  }

  const knownCats = [...new Set(items.map((i) => i.category).filter(Boolean))] as string[]

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    const ok = !search || i.name.toLowerCase().includes(q) || (i.sku ?? '').toLowerCase().includes(q) || (i.supplier ?? '').toLowerCase().includes(q)
    return ok && (!catFilter || i.category === catFilter)
  })

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      <PageHeader
        title="Estoque"
        subtitle="Controle de peças e insumos"
        actions={<Btn onClick={() => setShowCreate(true)}><Icon name="add" size={15} color="#fff" />Novo Produto</Btn>}
      />

      {loadError && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{loadError}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard icon="inventory_2" label="Total de produtos" value={loading ? '…' : String(summary?.total ?? 0)} />
        <StatCard icon="warning" label="Estoque baixo" value={loading ? '…' : String(summary?.lowStock ?? 0)} color={summary?.lowStock ? '#f59e0b' : 'var(--primary)'} />
        <StatCard icon="payments" label="Valor total (custo)" value={loading ? '…' : fmtBRL(summary?.totalValue ?? 0)} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input value={search} onChange={setSearch} placeholder="Buscar produto, SKU, fornecedor…" prefix={<Icon name="search" size={16} color="var(--muted)" />} style={{ maxWidth: 340 }} />
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', color: 'var(--text)', background: 'var(--card)', outline: 'none' }}>
          <option value="">Todas as categorias</option>
          {knownCats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <Card><EmptyState message="Carregando…" icon="hourglass_empty" /></Card>
      ) : filtered.length === 0 ? (
        <Card><EmptyState message={search || catFilter ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado ainda'} icon="inventory_2" /></Card>
      ) : (
        <Card>
          <Table headers={['Produto', 'Categoria', 'Quantidade', 'Venda', 'Fornecedor', '']}>
            {filtered.map((item) => {
              const low = item.quantity <= item.minQuantity && item.minQuantity > 0
              return (
                <TR key={item.id}>
                  <TD>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {low && <Icon name="warning" size={14} color="#f59e0b" />}
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                        {item.sku && <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{item.sku}</div>}
                      </div>
                    </div>
                  </TD>
                  <TD><Badge color="gray">{item.category ?? '—'}</Badge></TD>
                  <TD>
                    <span style={{ fontWeight: 600, color: low ? '#f59e0b' : 'var(--text)' }}>{item.quantity} {item.unit}</span>
                    {item.minQuantity > 0 && <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 4 }}>/ mín {item.minQuantity}</span>}
                    {low && <span style={{ marginLeft: 6 }}><Badge color="yellow">Baixo</Badge></span>}
                  </TD>
                  <TD style={{ color: 'var(--muted)' }}>{fmtBRL(item.salePrice)}</TD>
                  <TD style={{ color: 'var(--muted)', fontSize: 12 }}>{item.supplier ?? '—'}</TD>
                  <TD>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => setMovItem(item)} title="Movimentação" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer' }}>
                        <Icon name="swap_vert" size={14} color="var(--muted)" />
                      </button>
                      <button onClick={() => setEditItem(item)} title="Editar" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer' }}>
                        <Icon name="edit" size={14} color="var(--muted)" />
                      </button>
                      <button onClick={() => deleteItem(item)} title="Excluir" style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 8px', cursor: 'pointer' }}>
                        <Icon name="delete" size={14} color="#dc2626" />
                      </button>
                    </div>
                  </TD>
                </TR>
              )
            })}
          </Table>
        </Card>
      )}

      {showCreate && <ItemModal onClose={() => setShowCreate(false)} onSaved={load} />}
      {editItem && <ItemModal item={editItem} onClose={() => setEditItem(undefined)} onSaved={load} />}
      {movItem && <MovModal item={movItem} onClose={() => setMovItem(null)} onSaved={load} />}
    </div>
  )
}

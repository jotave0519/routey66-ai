'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, PageHeader, Badge, Icon, EmptyState } from '@/components/ui'

interface ConvWithCustomer {
  id: string; status: string; startedAt: string; finishedAt: string | null
  customerName: string; customerPhone: string; lastMessage: string | null; lastMessageAt: string | null
}

interface Message { id: string; sender: string; content: string; createdAt: string }

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: 'green' | 'blue' | 'gray' | 'red' | 'orange' | 'yellow' }> = {
    ACTIVE: { label: 'Ativa', color: 'green' },
    FINISHED: { label: 'Encerrada', color: 'gray' },
    TRANSFERRED: { label: 'Transferida', color: 'orange' },
  }
  const m = map[status] ?? { label: status, color: 'gray' }
  return <Badge color={m.color}>{m.label}</Badge>
}

function initials(name: string) {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function ConversasPage() {
  const [convs, setConvs] = useState<ConvWithCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ConvWithCustomer | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [msgsLoading, setMsgsLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'ACTIVE' | 'FINISHED' | 'TRANSFERRED'>('all')

  useEffect(() => {
    setLoading(true)
    api.get<{ data: ConvWithCustomer[] }>('/admin/conversations?limit=100')
      .then((d) => setConvs(d.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  const selectConv = async (c: ConvWithCustomer) => {
    setSelected(c)
    setMessages([])
    setMsgsLoading(true)
    try {
      const data = await api.get<{ data: Message[] }>(`/admin/conversations/${c.id}/messages`)
      setMessages(data.data ?? [])
    } finally {
      setMsgsLoading(false)
    }
  }

  const filtered = filter === 'all' ? convs : convs.filter((c) => c.status === filter)

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      <PageHeader title="Conversas" subtitle="Histórico de atendimentos via WhatsApp" />

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, height: 'calc(100vh - 180px)', minHeight: 500 }}>
        {/* List */}
        <Card style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['all', 'ACTIVE', 'FINISHED', 'TRANSFERRED'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)', background: filter === f ? 'var(--primary)' : 'transparent', color: filter === f ? '#fff' : 'var(--muted)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                {f === 'all' ? 'Todas' : f === 'ACTIVE' ? 'Ativas' : f === 'FINISHED' ? 'Encerradas' : 'Transferidas'}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <EmptyState message="Carregando…" icon="hourglass_empty" />
            ) : filtered.length === 0 ? (
              <EmptyState message="Nenhuma conversa" icon="chat_bubble" />
            ) : filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => selectConv(c)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px',
                  borderBottom: '1px solid var(--border)', cursor: 'pointer',
                  background: selected?.id === c.id ? '#fef2f2' : 'transparent',
                  borderLeft: selected?.id === c.id ? '2px solid var(--primary)' : '2px solid transparent',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: c.status === 'ACTIVE' ? 'var(--green)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                  {initials(c.customerName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.customerName || c.customerPhone}</div>
                    {c.lastMessageAt && <div style={{ fontSize: 10, color: 'var(--subtle)', flexShrink: 0 }}>{timeAgo(c.lastMessageAt)}</div>}
                  </div>
                  {c.lastMessage && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                      {c.lastMessage}
                    </div>
                  )}
                  <div style={{ marginTop: 4 }}>{statusBadge(c.status)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Thread */}
        <Card style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState message="Selecione uma conversa para visualizar" icon="chat" />
            </div>
          ) : (
            <>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: selected.status === 'ACTIVE' ? 'var(--green)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                  {initials(selected.customerName)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{selected.customerName || selected.customerPhone}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{selected.customerPhone}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>{statusBadge(selected.status)}</div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {msgsLoading ? (
                  <EmptyState message="Carregando mensagens…" icon="hourglass_empty" />
                ) : messages.length === 0 ? (
                  <EmptyState message="Sem mensagens" icon="chat_bubble_outline" />
                ) : messages.filter(m => m.sender !== 'system').map((m) => (
                  <div key={m.id} style={{ display: 'flex', flexDirection: m.sender === 'customer' ? 'row' : 'row-reverse', gap: 8 }}>
                    <div
                      style={{
                        maxWidth: '72%', padding: '8px 12px', borderRadius: m.sender === 'customer' ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                        background: m.sender === 'customer' ? 'var(--card)' : 'var(--primary)',
                        border: m.sender === 'customer' ? '1px solid var(--border)' : 'none',
                        color: m.sender === 'customer' ? 'var(--text)' : '#fff',
                        fontSize: 13, lineHeight: 1.5,
                      }}
                    >
                      <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.content}</div>
                      <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6, textAlign: 'right' }}>
                        {new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

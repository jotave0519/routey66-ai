'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, PageHeader, Badge, Icon } from '@/components/ui'

interface WaStatus { status: string; instance: string }

export default function WhatsAppPage() {
  const [info, setInfo] = useState<WaStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetch = async () => {
    try {
      const data = await api.get<WaStatus>('/admin/whatsapp/status')
      setInfo(data)
    } catch {
      setInfo({ status: 'disconnected', instance: '—' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const refresh = () => { setRefreshing(true); fetch() }

  const connected = info?.status === 'open' || info?.status === 'connected'
  const statusColor = connected ? 'var(--green)' : '#e5484d'
  const statusBg = connected ? 'var(--green-bg)' : '#fef2f2'

  return (
    <div style={{ padding: '28px 32px', maxWidth: 700 }}>
      <PageHeader
        title="WhatsApp"
        subtitle="Status da conexão com o Evolution API"
        actions={
          <button onClick={refresh} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Icon name="refresh" size={15} />
            {refreshing ? 'Atualizando…' : 'Atualizar'}
          </button>
        }
      />

      {loading ? (
        <Card style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
          <Icon name="hourglass_empty" size={32} color="var(--border)" />
          <p style={{ marginTop: 10 }}>Verificando status…</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status card */}
          <Card style={{ padding: '28px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: statusBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={connected ? 'smartphone' : 'phone_disabled'} size={30} color={statusColor} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                  {connected ? 'Conectado' : 'Desconectado'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>Status: <strong style={{ color: statusColor }}>{info?.status}</strong></span>
                </div>
              </div>
            </div>
          </Card>

          {/* Instance info */}
          <Card>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="info" size={16} color="var(--muted)" /> Informações da instância
            </div>
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Nome da instância</span>
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 500 }}>{info?.instance}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Estado da conexão</span>
                <Badge color={connected ? 'green' : 'red'}>{info?.status}</Badge>
              </div>
            </div>
          </Card>

          {!connected && (
            <Card style={{ padding: '20px 24px', background: '#fef2f2', border: '1px solid #fecaca' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Icon name="warning" size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#991b1b', marginBottom: 4 }}>WhatsApp desconectado</div>
                  <div style={{ fontSize: 13, color: '#b91c1c', lineHeight: 1.6 }}>
                    O agente não está recebendo mensagens. Acesse o painel do Evolution API para reconectar usando o QR Code.
                  </div>
                  <div style={{ marginTop: 12, padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #fecaca', fontSize: 12, color: 'var(--muted)', fontFamily: 'monospace' }}>
                    {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}/manager
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

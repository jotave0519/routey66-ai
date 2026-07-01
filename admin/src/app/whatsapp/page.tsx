'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import { Card, PageHeader, Icon, Btn } from '@/components/ui'

interface WaStatus {
  connected: boolean
  status: string
  instance: string
  phone: string | null
  profileName: string | null
  profilePicUrl: string | null
  error?: string
}

interface QRData {
  connected: boolean
  qrcode: string | null
  error?: string
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Conectado',
  close: 'Desconectado',
  connecting: 'Conectando…',
  qrcode: 'Aguardando QR Code',
  not_found: 'Instância não encontrada',
  not_configured: 'API não configurada',
  error: 'Erro de conexão',
}

function fmtPhone(phone: string | null) {
  if (!phone) return null
  // 5511999998888 → +55 (11) 99999-8888
  const d = phone.replace(/\D/g, '')
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`
  if (d.length === 12) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`
  return `+${d}`
}

// ─── Connected Panel ──────────────────────────────────────────────────────────

function ConnectedPanel({ info, onRefresh, onLogout, refreshing }: {
  info: WaStatus; onRefresh: () => void; onLogout: () => void; refreshing: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Status hero */}
      <Card style={{ padding: '28px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Profile picture or avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {info.profilePicUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={info.profilePicUrl} alt="Foto" width={64} height={64}
                style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="smartphone" size={30} color="#16a34a" />
              </div>
            )}
            {/* Green connected dot */}
            <div style={{ position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: '50%', background: '#16a34a', border: '2px solid var(--card)' }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                {info.profileName ?? info.instance}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#dcfce7', color: '#16a34a', fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 100 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                Conectado
              </div>
            </div>
            {info.phone && (
              <div style={{ fontSize: 14, color: 'var(--muted)', fontFamily: 'monospace' }}>{fmtPhone(info.phone)}</div>
            )}
            <div style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 2 }}>Instância: {info.instance}</div>
          </div>
        </div>
      </Card>

      {/* Details */}
      <Card>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
          <Icon name="info" size={15} color="var(--muted)" /> Detalhes da instância
        </div>
        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Row label="Instância" value={info.instance} mono />
          <Row label="Número" value={fmtPhone(info.phone) ?? '—'} mono />
          <Row label="Nome do perfil" value={info.profileName ?? '—'} />
          <Row label="Estado" value={STATUS_LABELS[info.status] ?? info.status} color="#16a34a" />
        </div>
      </Card>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn onClick={onRefresh} disabled={refreshing} variant="secondary">
          <Icon name="refresh" size={14} color="var(--text)" />{refreshing ? 'Atualizando…' : 'Atualizar'}
        </Btn>
        <Btn onClick={onLogout} variant="danger">
          <Icon name="logout" size={14} color="#dc2626" />Desconectar
        </Btn>
      </div>
    </div>
  )
}

// ─── QR Code Panel ────────────────────────────────────────────────────────────

function QRPanel({ qrcode, status, onRefreshQR, loadingQR }: {
  qrcode: string | null; status: string; onRefreshQR: () => void; loadingQR: boolean
}) {
  const [countdown, setCountdown] = useState(30)

  // Reset countdown whenever a new QR code arrives
  useEffect(() => {
    setCountdown(30)
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [qrcode])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Status bar */}
      <Card style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14, background: '#fef9ec', border: '1px solid #fde68a' }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="qr_code_scanner" size={22} color="#b45309" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#92400e' }}>
            {STATUS_LABELS[status] ?? 'WhatsApp Desconectado'}
          </div>
          <div style={{ fontSize: 13, color: '#b45309', marginTop: 2 }}>
            Escaneie o QR Code com seu WhatsApp para conectar
          </div>
        </div>
      </Card>

      {/* QR Code */}
      <Card style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        {loadingQR ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0' }}>
            <Icon name="hourglass_empty" size={40} color="var(--border)" />
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Gerando QR Code…</div>
          </div>
        ) : qrcode ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrcode} alt="QR Code WhatsApp" width={260} height={260}
              style={{ width: 260, height: 260, borderRadius: 12, border: '2px solid var(--border)' }} />

            {/* Countdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: countdown < 8 ? '#fef2f2' : 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: countdown < 8 ? '#dc2626' : 'var(--muted)' }}>
                {countdown}
              </div>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                {countdown > 0 ? 'segundos até o QR Code expirar' : 'Atualizando QR Code…'}
              </span>
            </div>

            <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
              Abra o WhatsApp no seu celular → Menu (⋮) → Dispositivos conectados → Conectar dispositivo
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0' }}>
            <Icon name="error_outline" size={40} color="var(--border)" />
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Não foi possível obter o QR Code</div>
            <Btn onClick={onRefreshQR}>
              <Icon name="refresh" size={14} color="#fff" />Tentar novamente
            </Btn>
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Como conectar</div>
        {[
          ['looks_one', 'Abra o WhatsApp no celular da oficina'],
          ['looks_two', 'Toque nos 3 pontos (⋮) no canto superior direito'],
          ['looks_3', 'Selecione "Dispositivos conectados"'],
          ['looks_4', 'Toque em "Conectar dispositivo" e escaneie o QR Code acima'],
        ].map(([icon, text]) => (
          <div key={icon} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Icon name={icon} size={18} color="var(--primary)" />
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{text}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Row({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, fontFamily: mono ? 'monospace' : undefined, color: color ?? 'var(--text)' }}>{value}</span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WhatsAppPage() {
  const [status, setStatus] = useState<WaStatus | null>(null)
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [loadingQR, setLoadingQR] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const qrRefreshRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const statusFailCount = useRef(0)

  const clearTimers = () => {
    if (statusPollRef.current) clearInterval(statusPollRef.current)
    if (qrRefreshRef.current) clearTimeout(qrRefreshRef.current)
  }

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.get<WaStatus>('/admin/whatsapp/status')
      setStatus(data)
      statusFailCount.current = 0
      return data
    } catch {
      statusFailCount.current += 1
      if (statusFailCount.current >= 5) clearTimers()
      const fallback: WaStatus = { connected: false, status: 'error', instance: '—', phone: null, profileName: null, profilePicUrl: null }
      setStatus(fallback)
      return fallback
    } finally {
      setLoadingStatus(false)
      setRefreshing(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchQR = useCallback(async () => {
    setLoadingQR(true)
    try {
      const data = await api.get<QRData>('/admin/whatsapp/qrcode')
      setQrData(data)
    } catch {
      setQrData({ connected: false, qrcode: null, error: 'Erro ao buscar QR Code' })
    } finally {
      setLoadingQR(false)
    }
  }, [])

  // Schedule QR refresh every 28s (QR expires at 30s)
  const scheduleQRRefresh = useCallback(() => {
    if (qrRefreshRef.current) clearTimeout(qrRefreshRef.current)
    qrRefreshRef.current = setTimeout(() => {
      fetchQR().then(() => scheduleQRRefresh())
    }, 28_000)
  }, [fetchQR])

  const startPolling = useCallback((connected: boolean) => {
    clearTimers()
    if (connected) {
      // Slow poll when connected
      statusPollRef.current = setInterval(async () => {
        await fetchStatus()
      }, 15_000)
    } else {
      // Fast poll when disconnected — detect when QR is scanned
      statusPollRef.current = setInterval(async () => {
        const s = await fetchStatus()
        if (s.connected) {
          clearTimers()
          setQrData(null)
          // Switch to slow poll
          statusPollRef.current = setInterval(fetchStatus, 15_000)
        }
      }, 3_000)
    }
  }, [fetchStatus])

  useEffect(() => {
    fetchStatus().then((s) => {
      if (!s.connected) {
        fetchQR().then(scheduleQRRefresh)
      }
      startPolling(s.connected)
    })
    return clearTimers
  }, [fetchStatus, fetchQR, scheduleQRRefresh, startPolling])

  // When status switches from disconnected → connected, stop QR refresh
  useEffect(() => {
    if (status?.connected) {
      if (qrRefreshRef.current) clearTimeout(qrRefreshRef.current)
      setQrData(null)
    }
  }, [status?.connected])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchStatus()
  }

  const handleLogout = async () => {
    if (!confirm('Desconectar o WhatsApp? O agente vai parar de receber mensagens até reconectar.')) return
    await api.delete('/admin/whatsapp/logout')
    setStatus(null)
    setLoadingStatus(true)
    clearTimers()
    setTimeout(async () => {
      const s = await fetchStatus()
      if (!s.connected) {
        fetchQR().then(scheduleQRRefresh)
      }
      startPolling(s.connected)
    }, 2000)
  }

  const handleRefreshQR = () => {
    fetchQR().then(scheduleQRRefresh)
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 680 }}>
      <PageHeader
        title="WhatsApp"
        subtitle="Gerenciamento da conexão com o WhatsApp"
        actions={
          status?.connected ? (
            <Btn onClick={handleRefresh} disabled={refreshing} variant="secondary">
              <Icon name="refresh" size={14} color="var(--text)" />{refreshing ? 'Atualizando…' : 'Atualizar'}
            </Btn>
          ) : undefined
        }
      />

      {loadingStatus ? (
        <Card style={{ padding: 48, textAlign: 'center' }}>
          <Icon name="hourglass_empty" size={36} color="var(--border)" />
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--muted)' }}>Verificando conexão…</div>
        </Card>
      ) : status?.connected ? (
        <ConnectedPanel info={status} onRefresh={handleRefresh} onLogout={handleLogout} refreshing={refreshing} />
      ) : (
        <QRPanel
          qrcode={qrData?.qrcode ?? null}
          status={status?.status ?? 'close'}
          onRefreshQR={handleRefreshQR}
          loadingQR={loadingQR}
        />
      )}
    </div>
  )
}

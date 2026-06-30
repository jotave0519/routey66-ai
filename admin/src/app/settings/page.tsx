'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, PageHeader, Icon, Btn } from '@/components/ui'

interface Settings {
  companyName: string; address: string; phone: string | null
  welcomeMessage: string; slotDurationMinutes: number
}

const TABS = [
  { key: 'oficina', label: 'Oficina', icon: 'store' },
  { key: 'atendimento', label: 'Atendimento', icon: 'support_agent' },
  { key: 'horarios', label: 'Horários', icon: 'schedule' },
]

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px',
  fontSize: 13, fontFamily: 'inherit', color: 'var(--text)', background: 'var(--bg)', outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 6,
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState('oficina')

  useEffect(() => {
    api.get<Settings>('/admin/settings').then(setSettings)
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    await api.patch('/admin/settings', settings)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const set = (key: keyof Settings, value: string | number) =>
    setSettings((s) => s ? { ...s, [key]: value } : s)

  return (
    <div style={{ padding: '28px 32px', maxWidth: 800 }}>
      <PageHeader title="Configurações" subtitle="Dados da oficina e preferências do sistema" />

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Tab nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 180 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 8,
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: tab === t.key ? 500 : 400,
                background: tab === t.key ? 'var(--card)' : 'transparent',
                color: tab === t.key ? 'var(--text)' : 'var(--muted)',
                boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                border: tab === t.key ? '1px solid var(--border)' : '1px solid transparent',
                textAlign: 'left',
              } as React.CSSProperties}
            >
              <Icon name={t.icon} size={16} color={tab === t.key ? 'var(--primary)' : 'var(--muted)'} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <Card style={{ flex: 1 }}>
          {!settings ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>Carregando…</div>
          ) : (
            <form onSubmit={save}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name={TABS.find((t) => t.key === tab)?.icon ?? 'settings'} size={16} color="var(--primary)" />
                {TABS.find((t) => t.key === tab)?.label}
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                {tab === 'oficina' && (
                  <>
                    <div>
                      <label style={labelStyle}>Nome da oficina</label>
                      <input style={inputStyle} value={settings.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="Ex: Route'y 66" />
                    </div>
                    <div>
                      <label style={labelStyle}>Endereço</label>
                      <input style={inputStyle} value={settings.address} onChange={(e) => set('address', e.target.value)} placeholder="Rua, número, bairro, cidade" />
                    </div>
                    <div>
                      <label style={labelStyle}>Telefone de contato</label>
                      <input style={inputStyle} value={settings.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="(11) 99999-9999" />
                    </div>
                  </>
                )}

                {tab === 'atendimento' && (
                  <div>
                    <label style={labelStyle}>Mensagem de boas-vindas</label>
                    <p style={{ fontSize: 11, color: 'var(--subtle)', marginBottom: 8 }}>
                      Esta mensagem é exibida quando o cliente inicia uma conversa.
                    </p>
                    <textarea
                      style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
                      value={settings.welcomeMessage}
                      onChange={(e) => set('welcomeMessage', e.target.value)}
                      placeholder="Olá! Seja bem-vindo à Route'y 66…"
                    />
                  </div>
                )}

                {tab === 'horarios' && (
                  <div>
                    <label style={labelStyle}>Duração do slot de agendamento (minutos)</label>
                    <p style={{ fontSize: 11, color: 'var(--subtle)', marginBottom: 8 }}>
                      Tempo reservado por agendamento no Google Calendar.
                    </p>
                    <input
                      type="number"
                      style={{ ...inputStyle, maxWidth: 160 }}
                      value={settings.slotDurationMinutes}
                      onChange={(e) => set('slotDurationMinutes', Number(e.target.value))}
                      min={15}
                      max={480}
                      step={15}
                    />
                    <div style={{ marginTop: 6, fontSize: 11, color: 'var(--muted)' }}>
                      {settings.slotDurationMinutes} minutos por atendimento
                    </div>
                  </div>
                )}
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Btn type="submit" disabled={saving}>
                  <Icon name="save" size={15} color="#fff" />
                  {saving ? 'Salvando…' : 'Salvar alterações'}
                </Btn>
                {saved && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--green)' }}>
                    <Icon name="check_circle" size={15} color="var(--green)" />
                    Salvo com sucesso!
                  </div>
                )}
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}

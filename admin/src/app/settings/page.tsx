'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Settings {
  companyName: string; address: string; phone: string | null
  welcomeMessage: string; slotDurationMinutes: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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

  if (!settings) return <p className="text-gray-500">Carregando…</p>

  const field = (label: string, key: keyof Settings, type = 'text') => (
    <div key={key}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        className="border rounded px-3 py-2 w-full text-sm"
        value={(settings[key] as string) ?? ''}
        onChange={(e) => setSettings({ ...settings, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
      />
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      <form onSubmit={save} className="bg-white rounded-lg shadow p-6 max-w-xl space-y-5">
        {field('Nome da oficina', 'companyName')}
        {field('Endereço', 'address')}
        {field('Telefone', 'phone')}
        {field('Duração do slot (minutos)', 'slotDurationMinutes', 'number')}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem de boas-vindas</label>
          <textarea
            className="border rounded px-3 py-2 w-full text-sm resize-none"
            rows={4}
            value={settings.welcomeMessage}
            onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
          />
        </div>
        <button
          type="submit" disabled={saving}
          className="bg-orange-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? 'Salvando…' : saved ? '✓ Salvo!' : 'Salvar alterações'}
        </button>
      </form>
    </div>
  )
}

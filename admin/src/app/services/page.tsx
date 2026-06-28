'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Service {
  id: string; name: string; description: string | null; active: boolean
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setServices(await api.get<Service[]>('/admin/services'))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await api.post('/admin/services', { name, description })
    setName(''); setDescription('')
    await load()
    setSaving(false)
  }

  const toggle = async (s: Service) => {
    await api.patch(`/admin/services/${s.id}`, { active: !s.active })
    await load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Serviços</h1>

      <form onSubmit={create} className="bg-white rounded-lg shadow p-6 mb-8 flex gap-4 flex-wrap">
        <input
          className="border rounded px-3 py-2 flex-1 min-w-48 text-sm"
          placeholder="Nome do serviço"
          value={name} onChange={(e) => setName(e.target.value)} required
        />
        <input
          className="border rounded px-3 py-2 flex-1 min-w-48 text-sm"
          placeholder="Descrição (opcional)"
          value={description} onChange={(e) => setDescription(e.target.value)}
        />
        <button
          type="submit" disabled={saving}
          className="bg-orange-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Adicionar'}
        </button>
      </form>

      {loading ? <p className="text-gray-500">Carregando…</p> : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Nome', 'Descrição', 'Status', 'Ação'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.description ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggle(s)}
                      className="text-xs text-orange-600 hover:underline"
                    >
                      {s.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

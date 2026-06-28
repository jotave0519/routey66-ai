'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Faq { id: string; question: string; answer: string; active: boolean }

export default function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState(''); const [a, setA] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => { setLoading(true); setFaqs(await api.get<Faq[]>('/admin/faq')); setLoading(false) }
  useEffect(() => { load() }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    await api.post('/admin/faq', { question: q, answer: a })
    setQ(''); setA(''); await load(); setSaving(false)
  }

  const remove = async (id: string) => {
    if (!confirm('Excluir esta pergunta?')) return
    await api.delete(`/admin/faq/${id}`); await load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">FAQ</h1>
      <form onSubmit={create} className="bg-white rounded-lg shadow p-6 mb-8 space-y-3">
        <input
          className="border rounded px-3 py-2 w-full text-sm"
          placeholder="Pergunta" value={q} onChange={(e) => setQ(e.target.value)} required
        />
        <textarea
          className="border rounded px-3 py-2 w-full text-sm resize-none"
          rows={3} placeholder="Resposta" value={a} onChange={(e) => setA(e.target.value)} required
        />
        <button
          type="submit" disabled={saving}
          className="bg-orange-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Adicionar'}
        </button>
      </form>

      {loading ? <p className="text-gray-500">Carregando…</p> : (
        <div className="space-y-3">
          {faqs.map((f) => (
            <div key={f.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{f.question}</p>
                  <p className="text-sm text-gray-500 mt-1">{f.answer}</p>
                </div>
                <button onClick={() => remove(f.id)} className="text-red-500 hover:text-red-700 text-xs shrink-0">
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

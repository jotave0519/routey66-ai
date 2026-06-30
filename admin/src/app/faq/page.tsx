'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, PageHeader, Icon, EmptyState, Btn } from '@/components/ui'

interface Faq { id: string; question: string; answer: string; active: boolean }

export default function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editQ, setEditQ] = useState('')
  const [editA, setEditA] = useState('')

  const load = async () => {
    setLoading(true)
    setFaqs(await api.get<Faq[]>('/admin/faq'))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await api.post('/admin/faq', { question, answer })
    setQuestion(''); setAnswer('')
    await load()
    setSaving(false)
  }

  const remove = async (id: string) => {
    if (!confirm('Excluir esta pergunta?')) return
    await api.delete(`/admin/faq/${id}`)
    await load()
  }

  const startEdit = (f: Faq) => {
    setEditing(f.id); setEditQ(f.question); setEditA(f.answer)
  }

  const saveEdit = async (id: string) => {
    await api.patch(`/admin/faq/${id}`, { question: editQ, answer: editA })
    setEditing(null)
    await load()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px',
    fontSize: 13, fontFamily: 'inherit', color: 'var(--text)', background: 'var(--bg)', outline: 'none',
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 800 }}>
      <PageHeader title="FAQ" subtitle="Perguntas frequentes respondidas pelo agente" />

      {/* Add form */}
      <Card style={{ padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="add_circle" size={16} color="var(--primary)" /> Nova pergunta
        </div>
        <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input style={inputStyle} placeholder="Pergunta" value={question} onChange={(e) => setQuestion(e.target.value)} required />
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} placeholder="Resposta" value={answer} onChange={(e) => setAnswer(e.target.value)} required />
          <div>
            <Btn type="submit" disabled={saving || !question.trim() || !answer.trim()}>
              <Icon name="add" size={15} color="#fff" />
              {saving ? 'Salvando…' : 'Adicionar'}
            </Btn>
          </div>
        </form>
      </Card>

      {/* FAQ list */}
      {loading ? (
        <Card><EmptyState message="Carregando…" icon="hourglass_empty" /></Card>
      ) : faqs.length === 0 ? (
        <Card><EmptyState message="Nenhuma pergunta cadastrada" icon="quiz" /></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((f) => (
            <Card key={f.id} style={{ padding: '18px 20px' }}>
              {editing === f.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input style={inputStyle} value={editQ} onChange={(e) => setEditQ(e.target.value)} placeholder="Pergunta" />
                  <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} value={editA} onChange={(e) => setEditA(e.target.value)} placeholder="Resposta" />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn onClick={() => saveEdit(f.id)} disabled={!editQ.trim() || !editA.trim()}>Salvar</Btn>
                    <Btn variant="secondary" onClick={() => setEditing(null)}>Cancelar</Btn>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>Q</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{f.question}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{f.answer}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => startEdit(f)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--muted)' }}>
                      <Icon name="edit" size={13} /> Editar
                    </button>
                    <button onClick={() => remove(f.id)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#dc2626' }}>
                      <Icon name="delete" size={13} color="#dc2626" /> Excluir
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

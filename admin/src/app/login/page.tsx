'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Icon, Btn } from '@/components/ui'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push(params.get('from') ?? '/')
      router.refresh()
    } else {
      const data = await res.json() as { error?: string }
      setError(data.error ?? 'Senha incorreta')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sidebar-bg)' }}>
      <div style={{ background: 'var(--card)', borderRadius: 16, padding: '40px 36px', width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: 'var(--primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 22, fontWeight: 700, color: '#fff' }}>R</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Route&apos;y 66</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Painel Administrativo</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Senha de acesso</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 8, padding: '0 12px', background: '#f9f9fb' }}>
              <Icon name="lock" size={16} color="var(--muted)" style={{ marginRight: 8 }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
                style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 0', fontSize: 14, background: 'transparent', fontFamily: 'inherit', color: 'var(--text)' }}
              />
            </div>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#fef2f2', borderRadius: 8, fontSize: 12, color: '#dc2626' }}>
              <Icon name="error" size={14} color="#dc2626" />
              {error}
            </div>
          )}

          <Btn type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '10px 14px', fontSize: 14 }}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Btn>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

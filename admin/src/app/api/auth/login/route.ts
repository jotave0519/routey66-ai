import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, SESSION_COOKIE } from '@/lib/session'

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5

interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

function isRateLimited(ip: string): { limited: boolean; retryAfterSec: number } {
  const now = Date.now()
  const b = buckets.get(ip)
  if (!b || now > b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { limited: false, retryAfterSec: 0 }
  }
  b.count += 1
  if (b.count > MAX_ATTEMPTS) {
    return { limited: true, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) }
  }
  return { limited: false, retryAfterSec: 0 }
}

export async function POST(request: NextRequest) {
  const ip = getIp(request)
  const { limited, retryAfterSec } = isRateLimited(ip)

  if (limited) {
    return NextResponse.json(
      { error: `Muitas tentativas. Tente novamente em ${Math.ceil(retryAfterSec / 60)} minuto(s).` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
    )
  }

  const { password } = (await request.json()) as { password?: string }

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  if (!password || password !== adminPassword) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  // Clear bucket on success
  buckets.delete(ip)

  const token = await createSessionToken()

  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60,
    path: '/',
  })

  return response
}

import { createHmac, timingSafeEqual } from 'crypto'

const SESSION_COOKIE = 'admin_session'
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000 // 8 hours

function getSecret(): string {
  const secret = process.env.ADMIN_SECRET
  if (!secret) throw new Error('ADMIN_SECRET must be set')
  return secret
}

export function signToken(payload: string): string {
  const secret = getSecret()
  const sig = createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export function verifyToken(token: string): boolean {
  try {
    const lastDot = token.lastIndexOf('.')
    if (lastDot === -1) return false
    const payload = token.substring(0, lastDot)
    const expected = signToken(payload)
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}

export function createSessionToken(): string {
  const expiry = Date.now() + TOKEN_TTL_MS
  return signToken(`admin:${expiry}`)
}

export function isSessionTokenExpired(token: string): boolean {
  try {
    const lastDot = token.lastIndexOf('.')
    const payload = token.substring(0, lastDot)
    const [, expiry] = payload.split(':')
    return Date.now() > Number(expiry)
  } catch {
    return true
  }
}

export { SESSION_COOKIE }

const SESSION_COOKIE = 'admin_session'
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000 // 8 hours

function getSecret(): string {
  const secret = process.env.ADMIN_SECRET
  if (!secret) throw new Error('ADMIN_SECRET must be set')
  return secret
}

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex: string): Uint8Array {
  const pairs = hex.match(/.{2}/g)
  if (!pairs) return new Uint8Array()
  return Uint8Array.from(pairs.map((h) => parseInt(h, 16)))
}

export async function createSessionToken(): Promise<string> {
  const expiry = Date.now() + TOKEN_TTL_MS
  const payload = `admin-${expiry}`
  const key = await getKey()
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return `${payload}.${toHex(sig)}`
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const lastDot = token.lastIndexOf('.')
    if (lastDot === -1) return false
    const payload = token.substring(0, lastDot)
    const sigHex = token.substring(lastDot + 1)
    const key = await getKey()
    return await crypto.subtle.verify(
      'HMAC',
      key,
      fromHex(sigHex),
      new TextEncoder().encode(payload),
    )
  } catch {
    return false
  }
}

export function isSessionTokenExpired(token: string): boolean {
  try {
    const lastDot = token.lastIndexOf('.')
    const payload = token.substring(0, lastDot)
    const [, expiry] = payload.split('-')
    return Date.now() > Number(expiry)
  } catch {
    return true
  }
}

export { SESSION_COOKIE }

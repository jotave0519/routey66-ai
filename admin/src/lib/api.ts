async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const proxyPath = `/api/proxy${path}`
  const res = await fetch(proxyPath, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => req<T>(path),
  post: <T>(path: string, body: unknown) => req<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => req<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string) => req<void>(path, { method: 'DELETE' }),
}

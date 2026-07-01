import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'
const API_TOKEN = process.env.ADMIN_API_TOKEN ?? ''

async function handler(req: NextRequest, { params }: { params: { path: string[] } }): Promise<NextResponse> {
  const { path } = params
  const url = `${API_BASE}/${path.join('/')}${req.nextUrl.search}`

  const headers: Record<string, string> = {
    'x-admin-key': API_TOKEN,
  }
  const contentType = req.headers.get('content-type')
  if (contentType) headers['content-type'] = contentType

  const body = req.method !== 'GET' && req.method !== 'HEAD'
    ? await req.text()
    : undefined

  const upstream = await fetch(url, { method: req.method, headers, body })

  if (upstream.status === 204) return new NextResponse(null, { status: 204 })

  const data = await upstream.text()
  return new NextResponse(data, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  })
}

export const GET = handler
export const POST = handler
export const PATCH = handler
export const DELETE = handler
export const PUT = handler

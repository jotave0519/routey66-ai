'use client'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublic = pathname === '/login' || pathname.startsWith('/login')

  if (isPublic) return <>{children}</>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}

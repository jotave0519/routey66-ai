'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/',           label: 'Dashboard',     icon: 'home' },
  { href: '/customers',  label: 'Clientes',       icon: 'group' },
  { href: '/vehicles',   label: 'Veículos',       icon: 'directions_car' },
  { href: '/agenda',     label: 'Agenda',         icon: 'calendar_month' },
  { href: '/conversas',  label: 'Conversas',      icon: 'chat' },
  { href: '/whatsapp',   label: 'WhatsApp',       icon: 'smartphone' },
  { href: '/services',   label: 'Serviços',       icon: 'build' },
  { href: '/estoque',    label: 'Estoque',        icon: 'inventory_2' },
  { href: '/faq',        label: 'FAQ',            icon: 'quiz' },
  { href: '/settings',   label: 'Configurações',  icon: 'settings' },
]

const s = {
  aside: {
    width: 220,
    flexShrink: 0,
    background: 'var(--sidebar-bg)',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'sticky' as const,
    top: 0,
    height: '100vh',
    overflowY: 'auto' as const,
  },
  logo: {
    padding: '20px 20px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 32,
    height: 32,
    background: 'var(--primary)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
  },
  logoText: { fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.2 },
  logoSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 },
  nav: { flex: 1, padding: '12px 0' },
  label: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,0.3)',
    padding: '8px 20px 4px',
    textTransform: 'uppercase' as const,
  },
  link: (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 20px',
    fontSize: 13,
    fontWeight: active ? 500 : 400,
    color: active ? '#fff' : 'rgba(255,255,255,0.55)',
    background: active ? 'rgba(229,72,77,0.18)' : 'transparent',
    borderLeft: active ? '2px solid var(--primary)' : '2px solid transparent',
    textDecoration: 'none',
    transition: 'all 0.15s',
    cursor: 'pointer',
  }),
  icon: (active: boolean): React.CSSProperties => ({
    fontSize: 18,
    color: active ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
  }),
  footer: {
    padding: '12px 20px 16px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  logout: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px 0',
    width: '100%',
  },
}

export function Sidebar() {
  const path = usePathname()
  const router = useRouter()

  const isActive = (href: string) =>
    href === '/' ? path === '/' : path === href || path.startsWith(href + '/')

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const mainNav = NAV.slice(0, 6)
  const configNav = NAV.slice(6)

  return (
    <aside style={s.aside}>
      <div style={s.logo}>
        <div style={s.logoMark}>R</div>
        <div>
          <div style={s.logoText}>Route&apos;y 66</div>
          <div style={s.logoSub}>Painel Admin</div>
        </div>
      </div>

      <nav style={s.nav}>
        <div style={s.label}>Principal</div>
        {mainNav.map((l) => {
          const active = isActive(l.href)
          return (
            <Link key={l.href} href={l.href} style={s.link(active)}>
              <span className="icon" style={s.icon(active)}>{l.icon}</span>
              {l.label}
            </Link>
          )
        })}

        <div style={{ ...s.label, marginTop: 8 }}>Gestão</div>
        {configNav.map((l) => {
          const active = isActive(l.href)
          return (
            <Link key={l.href} href={l.href} style={s.link(active)}>
              <span className="icon" style={s.icon(active)}>{l.icon}</span>
              {l.label}
            </Link>
          )
        })}
      </nav>

      <div style={s.footer}>
        <button style={s.logout} onClick={logout}>
          <span className="icon" style={{ fontSize: 16 }}>logout</span>
          Sair
        </button>
      </div>
    </aside>
  )
}

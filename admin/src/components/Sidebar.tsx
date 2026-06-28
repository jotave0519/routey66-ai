'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/',              label: 'Dashboard',     icon: '📊' },
  { href: '/services',      label: 'Serviços',      icon: '🔧' },
  { href: '/appointments',  label: 'Agendamentos',  icon: '📅' },
  { href: '/customers',     label: 'Clientes',      icon: '👤' },
  { href: '/faq',           label: 'FAQ',           icon: '❓' },
  { href: '/settings',      label: 'Configurações', icon: '⚙️'  },
]

export function Sidebar() {
  const path = usePathname()
  return (
    <aside className="w-56 shrink-0 bg-gray-900 text-gray-100 min-h-screen flex flex-col">
      <div className="px-6 py-5 border-b border-gray-700">
        <span className="text-orange-400 font-bold text-lg">Route&apos;y 66</span>
        <p className="text-xs text-gray-400 mt-0.5">Painel Admin</p>
      </div>
      <nav className="flex-1 py-4">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
              path === l.href
                ? 'bg-orange-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

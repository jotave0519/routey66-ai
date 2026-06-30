import React from 'react'

export function Card({
  children,
  style,
  className,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
      }}
    >
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{subtitle}</p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  )
}

export function Badge({
  children,
  color = 'gray',
}: {
  children: React.ReactNode
  color?: 'green' | 'red' | 'blue' | 'orange' | 'gray' | 'yellow'
}) {
  const colors: Record<string, React.CSSProperties> = {
    green: { background: 'var(--green-bg)', color: 'var(--green)' },
    red: { background: '#fef2f2', color: '#dc2626' },
    blue: { background: 'var(--blue-bg)', color: 'var(--blue)' },
    orange: { background: 'var(--orange-bg)', color: 'var(--orange-c)' },
    gray: { background: '#f4f4f5', color: 'var(--muted)' },
    yellow: { background: '#fefce8', color: '#b45309' },
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 500,
        ...colors[color],
      }}
    >
      {children}
    </span>
  )
}

export function Icon({
  name,
  size = 20,
  color,
  style,
}: {
  name: string
  size?: number
  color?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      className="icon"
      style={{ fontSize: size, color, ...style }}
    >
      {name}
    </span>
  )
}

export function StatCard({
  label,
  value,
  icon,
  color = 'var(--primary)',
  sub,
}: {
  label: string
  value: string | number
  icon: string
  color?: string
  sub?: string
}) {
  return (
    <Card style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: color + '18',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 1 }}>{sub}</div>}
      </div>
    </Card>
  )
}

export function EmptyState({ message, icon = 'inbox' }: { message: string; icon?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        color: 'var(--subtle)',
        gap: 12,
      }}
    >
      <Icon name={icon} size={40} color="var(--border)" />
      <p style={{ fontSize: 13 }}>{message}</p>
    </div>
  )
}

export function Btn({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled,
  style,
}: {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  disabled?: boolean
  style?: React.CSSProperties
}) {
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--primary)', color: '#fff', border: 'none' },
    secondary: { background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' },
    danger: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
    ghost: { background: 'transparent', color: 'var(--muted)', border: 'none' },
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'inherit',
        transition: 'opacity 0.15s',
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  style,
  prefix,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  style?: React.CSSProperties
  prefix?: React.ReactNode
}) {
  if (prefix) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '0 12px',
          background: 'var(--card)',
          ...style,
        }}
      >
        {prefix}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 13,
            color: 'var(--text)',
            background: 'transparent',
            padding: '8px 0',
            fontFamily: 'inherit',
          }}
        />
      </div>
    )
  }
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 13,
        color: 'var(--text)',
        background: 'var(--card)',
        fontFamily: 'inherit',
        outline: 'none',
        width: '100%',
        ...style,
      }}
    />
  )
}

export function Table({
  headers,
  children,
  style,
}: {
  headers: string[]
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={{ overflowX: 'auto', ...style }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', background: '#f9f9fb' }}>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  padding: '10px 16px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function TR({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: '1px solid var(--border)',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { if (onClick) (e.currentTarget as HTMLElement).style.background = '#f9f9fb' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
    >
      {children}
    </tr>
  )
}

export function TD({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text)', verticalAlign: 'middle', ...style }}>
      {children}
    </td>
  )
}

'use client'
import { Card, PageHeader, Badge, Icon, EmptyState } from '@/components/ui'

export default function EstoquePage() {
  return (
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>
      <PageHeader title="Estoque" subtitle="Controle de peças e insumos" />

      <Card style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', width: 64, height: 64, borderRadius: 16, background: 'var(--orange-bg)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Icon name="inventory_2" size={30} color="var(--orange-c)" />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Módulo de Estoque</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 400, margin: '0 auto', lineHeight: 1.7 }}>
          O módulo de estoque requer uma nova tabela no banco de dados. Execute a migration <code style={{ background: 'var(--border)', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12 }}>003_stock.sql</code> e esta tela estará disponível.
        </p>
        <div style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--orange-bg)', borderRadius: 8, fontSize: 13, color: 'var(--orange-c)', border: '1px solid #fed7aa' }}>
          <Icon name="pending" size={16} color="var(--orange-c)" />
          Em desenvolvimento
        </div>
      </Card>
    </div>
  )
}

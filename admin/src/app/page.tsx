import { api } from '@/lib/api'

interface Stats {
  total: number
}

async function getStats() {
  try {
    const [customers, appointments] = await Promise.all([
      api.get<Stats>('/admin/customers?limit=1'),
      api.get<unknown[]>('/admin/appointments?limit=1'),
    ])
    return { customers: (customers as { total: number }).total }
  } catch {
    return { customers: 0 }
  }
}

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard label="Clientes cadastrados" value={stats.customers} icon="👤" />
        <StatCard label="Sistema" value="Online ✓" icon="🟢" />
        <StatCard label="Oficina" value="Route'y 66" icon="🔧" />
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold mb-3 text-gray-700">Início rápido</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Acesse <strong>Serviços</strong> para gerenciar os serviços disponíveis.</li>
          <li>• Acesse <strong>FAQ</strong> para editar perguntas frequentes.</li>
          <li>• Acesse <strong>Configurações</strong> para alterar horários e dados da oficina.</li>
          <li>• Acesse <strong>Agendamentos</strong> para visualizar e gerenciar a agenda.</li>
        </ul>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  )
}

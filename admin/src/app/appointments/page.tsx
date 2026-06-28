import { api } from '@/lib/api'

interface Appointment {
  id: string; customerName: string; serviceName: string
  vehiclePlate: string; appointmentDate: string; status: string
}

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED:   'bg-blue-100 text-blue-700',
  RESCHEDULED: 'bg-yellow-100 text-yellow-700',
  CANCELLED:   'bg-red-100 text-red-700',
  COMPLETED:   'bg-green-100 text-green-700',
}

export default async function AppointmentsPage() {
  const appointments = await api.get<Appointment[]>('/admin/appointments?limit=100')

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Agendamentos</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Cliente', 'Serviço', 'Veículo', 'Data/Hora', 'Status'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {appointments.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{a.customerName}</td>
                <td className="px-4 py-3">{a.serviceName}</td>
                <td className="px-4 py-3 text-gray-600">{a.vehiclePlate}</td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(a.appointmentDate).toLocaleString('pt-BR', {
                    dateStyle: 'short', timeStyle: 'short',
                  })}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[a.status] ?? 'bg-gray-100'}`}>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

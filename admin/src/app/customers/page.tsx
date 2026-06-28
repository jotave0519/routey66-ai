import { api } from '@/lib/api'
import Link from 'next/link'

interface Customer { id: string; name: string; phone: string; createdAt: string }

export default async function CustomersPage() {
  const data = await api.get<{ data: Customer[]; total: number }>('/admin/customers?limit=100')

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Clientes</h1>
      <p className="text-gray-500 mb-6">{data.total} cliente(s) cadastrado(s)</p>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Nome', 'Telefone', 'Cadastrado em', 'Detalhes'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.data.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/customers/${c.id}`} className="text-orange-600 hover:underline text-xs">
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EquipmentStatus } from '@/types'
import Link from 'next/link'

export default async function AdminEquipmentPage() {
  const supabase = await createClient()
  const { data: equipment } = await supabase
    .from('equipment')
    .select('*')
    .order('nom')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Inventaire</h1>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Marque / Modèle</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">S/N</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {equipment?.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-700 text-xs">{item.nom}</td>
                  <td className="px-4 py-3 text-gray-900">{item.equipement}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {[item.marque, item.modele].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                    {item.serial_number || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.status as EquipmentStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/equipment/${item.id}`}
                      className="text-purple-700 hover:text-purple-900 font-medium text-xs"
                    >
                      Modifier
                    </Link>
                  </td>
                </tr>
              ))}
              {!equipment?.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                    Aucun équipement
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

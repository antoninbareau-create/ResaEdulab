export const dynamic = 'force-dynamic'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EquipmentStatus } from '@/types'
import Link from 'next/link'

export default async function AdminEquipmentPage() {
  const supabase = createAdminClient()
  const today = new Date().toISOString()

  const [{ data: equipment }, { data: onLoanRows }] = await Promise.all([
    supabase.from('equipment').select('*').order('nom'),
    supabase
      .from('reservation_items')
      .select('equipment_id, reservations!inner(status, start_date, end_date)')
      .is('returned_at', null)
      .eq('reservations.status', 'active')
      .lte('reservations.start_date', today)
      .gte('reservations.end_date', today),
  ])

  const onLoanIds = new Set((onLoanRows ?? []).map((r: { equipment_id: string }) => r.equipment_id))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventaire</h1>
        <Link
          href="/admin/equipment/new"
          className="inline-flex items-center gap-1.5 bg-brand-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors"
        >
          <span>+</span> Ajouter du matériel
        </Link>
      </div>

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
                    <Badge variant={(onLoanIds.has(item.id) ? 'on_loan' : item.status) as EquipmentStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/equipment/${item.id}`}
                      className="text-brand-primary hover:text-brand-dark font-medium text-xs"
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

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/Card'

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()

  const [
    { count: totalEquipment },
    { count: availableEquipment },
    { count: activeReservations },
  ] = await Promise.all([
    supabase.from('equipment').select('*', { count: 'exact', head: true }),
    supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('status', 'available'),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  const onLoan = (totalEquipment || 0) - (availableEquipment || 0)

  const stats = [
    { label: 'Total équipements', value: totalEquipment || 0, color: 'bg-brand-light text-brand-primary' },
    { label: 'Disponibles', value: availableEquipment || 0, color: 'bg-green-50 text-green-700' },
    { label: 'En prêt', value: onLoan, color: 'bg-orange-50 text-orange-700' },
    { label: 'Réservations actives', value: activeReservations || 0, color: 'bg-blue-50 text-blue-700' },
  ]

  const { data: recentReservations } = await supabase
    .from('reservations')
    .select('*, profiles(full_name, email), reservation_items(id)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord admin</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className={`rounded-xl ${color}`}>
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-sm mt-1 opacity-75">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Réservations récentes actives</h2>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Utilisateur</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Équipements</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Début</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentReservations?.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">
                    {(r.profiles as any)?.full_name || (r.profiles as any)?.email}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{(r.reservation_items as any[])?.length}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(r.start_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(r.end_date).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
              {!recentReservations?.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                    Aucune réservation active
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

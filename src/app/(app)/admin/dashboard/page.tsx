/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/Card'

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()

  const now = new Date().toISOString()

  const [
    { count: totalEquipment },
    { count: availableEquipment },
    { data: onLoanRows },
    { count: activeReservations },
    { count: overdueReservations },
  ] = await Promise.all([
    supabase.from('equipment').select('*', { count: 'exact', head: true }),
    supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('status', 'available'),
    supabase
      .from('reservation_items')
      .select('equipment_id, reservations!inner(status, start_date, end_date)')
      .is('returned_at', null)
      .eq('reservations.status', 'active')
      .lte('reservations.start_date', now),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'active').lt('end_date', now),
  ])

  const onLoan = new Set((onLoanRows ?? []).map((r: any) => r.equipment_id)).size

  const stats = [
    { label: 'Total équipements', value: totalEquipment || 0, color: 'bg-brand-light text-brand-primary', href: '/admin/equipment' },
    { label: 'Disponibles', value: availableEquipment || 0, color: 'bg-green-50 text-green-700', href: '/admin/equipment?status=available' },
    { label: 'En prêt', value: onLoan, color: 'bg-orange-50 text-orange-700', href: '/admin/equipment?status=on_loan' },
    { label: 'Réservations actives', value: activeReservations || 0, color: 'bg-blue-50 text-blue-700', href: '/admin/reservations?status=active' },
    { label: 'En retard', value: overdueReservations || 0, color: 'bg-red-50 text-red-700', href: '/admin/overdue' },
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

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map(({ label, value, color, href }: any) => (
          <Card key={label}>
            <Link href={href}>
              <CardContent className={`rounded-xl ${color} hover:opacity-80 transition-opacity cursor-pointer`}>
                <p className="text-3xl font-bold">{value}</p>
                <p className="text-sm mt-1 opacity-75">{label} →</p>
              </CardContent>
            </Link>
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

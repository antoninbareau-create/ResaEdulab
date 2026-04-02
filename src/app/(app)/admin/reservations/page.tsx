/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDateRange } from '@/lib/utils'
import { ReservationStatus } from '@/types'

export default async function AdminReservationsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusFilter } = await searchParams
  const supabase = createAdminClient()

  let query = supabase
    .from('reservations')
    .select('*, profiles(full_name, email), reservation_items(id, equipment(nom, equipement))')
    .order('created_at', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data: reservations } = await query

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {statusFilter === 'active' ? 'Réservations actives' : 'Toutes les réservations'}
        </h1>
        {statusFilter && (
          <Link href="/admin/reservations" className="text-sm text-gray-400 hover:text-gray-600">
            Voir tout
          </Link>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Référence</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Utilisateur</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Période</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Items</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reservations?.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-500 text-xs">
                    {r.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {(r.profiles as any)?.full_name || (r.profiles as any)?.email}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDateRange(r.start_date, r.end_date)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {(r.reservation_items as any[])?.length}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={r.status as ReservationStatus} />
                  </td>
                </tr>
              ))}
              {!reservations?.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    Aucune réservation
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

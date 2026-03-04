import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDateRange } from '@/lib/utils'
import { ReservationStatus } from '@/types'

export default async function ReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: reservations } = await supabase
    .from('reservations')
    .select('*, reservation_items(*, equipment(*))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mes réservations</h1>

      {reservations && reservations.length > 0 ? (
        <div className="space-y-3">
          {reservations.map((r) => (
            <Link key={r.id} href={`/reservations/${r.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {r.reservation_items?.length} équipement(s)
                    </p>
                    <p className="text-sm text-gray-500">{formatDateRange(r.start_date, r.end_date)}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{r.id.slice(0, 8)}...</p>
                  </div>
                  <Badge variant={r.status as ReservationStatus} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12 text-gray-400">
            <p className="mb-4">Aucune réservation</p>
            <Link href="/equipment">
              <span className="text-purple-800 font-medium hover:underline">Parcourir les équipements →</span>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

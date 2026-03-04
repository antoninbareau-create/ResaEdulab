import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDateRange } from '@/lib/utils'
import { ReservationStatus } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  const { data: reservations } = await supabase
    .from('reservations')
    .select('*, reservation_items(*, equipment(*))')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('end_date', { ascending: true })
    .limit(5)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Bonjour, {profile?.full_name?.split(' ')[0] || 'vous'} 👋
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link href="/equipment">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Parcourir les équipements</p>
                <p className="text-sm text-gray-500">Rechercher et réserver du matériel</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reservations/new">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">➕</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Nouvelle réservation</p>
                <p className="text-sm text-gray-500">Finaliser le panier en cours</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Prêts en cours</h2>

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
                    <p className="text-sm text-gray-500">
                      {formatDateRange(r.start_date, r.end_date)}
                    </p>
                  </div>
                  <Badge variant={r.status as ReservationStatus} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8 text-gray-400">
            <p>Aucun prêt en cours</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

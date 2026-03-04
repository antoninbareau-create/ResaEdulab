import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatDateRange } from '@/lib/utils'
import { ReservationStatus } from '@/types'

export default async function ReservationDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: reservation } = await supabase
    .from('reservations')
    .select('*, reservation_items(*, equipment(*))')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!reservation) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = reservation.reservation_items as any[]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Réservation</h1>
        <Link href="/reservations" className="text-sm text-brand-primary hover:text-brand-dark">
          ← Mes réservations
        </Link>
      </div>

      <Card className="mb-4">
        <CardContent className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-500 font-mono">{reservation.id}</p>
            <p className="font-medium text-gray-900">{formatDateRange(reservation.start_date, reservation.end_date)}</p>
            <p className="text-sm text-gray-500">
              Créée le {formatDate(reservation.created_at)}
            </p>
            {reservation.notes && (
              <p className="text-sm text-gray-600 italic">{reservation.notes}</p>
            )}
          </div>
          <Badge variant={reservation.status as ReservationStatus} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">
            Équipements réservés ({items?.length ?? 0})
          </h2>
        </CardHeader>
        <div className="divide-y divide-gray-100">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {items?.map((item: any) => (
            <div key={item.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-gray-400 mr-3">{item.equipment?.nom}</span>
                <span className="text-sm text-gray-900">{item.equipment?.equipement}</span>
                {item.equipment?.marque && (
                  <span className="text-sm text-gray-500 ml-2">
                    {item.equipment.marque} {item.equipment.modele}
                  </span>
                )}
              </div>
              {item.returned_at ? (
                <span className="text-xs text-green-600 font-medium">
                  Rendu le {formatDate(item.returned_at)}
                </span>
              ) : (
                <span className="text-xs text-gray-400">Non rendu</span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

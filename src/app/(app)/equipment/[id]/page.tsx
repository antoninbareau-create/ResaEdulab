import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/Badge'
import { AddToCartButton } from '@/components/equipment/AddToCartButton'
import { FutureReservations } from '@/components/equipment/FutureReservations'
import { EquipmentStatus, Equipment } from '@/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EquipmentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()
  const today = new Date().toISOString()

  const [{ data: item }, { data: loanRows }, { data: futureRows }] = await Promise.all([
    supabase.from('equipment').select('*').eq('id', params.id).single(),
    supabase
      .from('reservation_items')
      .select('reservations!inner(status, start_date, end_date, profiles(full_name, email))')
      .eq('equipment_id', params.id)
      .is('returned_at', null)
      .eq('reservations.status', 'active')
      .lte('reservations.start_date', today)
      .limit(1),
    supabase
      .from('reservation_items')
      .select('reservations!inner(status, start_date, end_date, profiles(full_name, email))')
      .eq('equipment_id', params.id)
      .eq('reservations.status', 'active')
      .gt('reservations.start_date', today)
      .order('start_date', { referencedTable: 'reservations', ascending: true }),
  ])

  if (!item) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loan = loanRows?.[0] ? (loanRows[0].reservations as any) : null
  const borrower = loan?.profiles ?? null
  const effectiveStatus: EquipmentStatus = loan ? 'on_loan' : item.status

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const futureReservations = (futureRows ?? []).map((r: any) => ({
    startDate: new Date(r.reservations.start_date).toLocaleDateString('fr-FR'),
    endDate: new Date(r.reservations.end_date).toLocaleDateString('fr-FR'),
    borrowerName: r.reservations.profiles?.full_name || '—',
    borrowerEmail: r.reservations.profiles?.email || '—',
  }))

  const fields = [
    { label: 'Identifiant', value: item.nom },
    { label: 'Type', value: item.equipement },
    { label: 'Marque', value: item.marque || '—' },
    { label: 'Modèle', value: item.modele || '—' },
    { label: 'Numéro de série', value: item.serial_number || '—' },
    { label: "Date d'achat", value: item.purchase_date ? new Date(item.purchase_date).toLocaleDateString('fr-FR') : '—' },
  ]

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{item.equipement}</h1>
        <Link href="/equipment" className="text-sm text-brand-primary hover:text-brand-dark">
          ← Retour
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        {/* Statut */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-600">Statut</span>
          <Badge variant={effectiveStatus} />
        </div>

        {/* Champs */}
        {fields.map(({ label, value }) => (
          <div key={label} className="flex items-start justify-between">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-sm font-medium text-gray-900 text-right font-mono">{value}</span>
          </div>
        ))}

        {/* Info emprunteur si en prêt */}
        {loan && borrower && (
          <div className="mt-2 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-600 mb-2">Actuellement emprunté par</p>
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 space-y-1">
              <p className="text-sm font-semibold text-amber-900">{borrower.full_name || '—'}</p>
              <p className="text-xs text-amber-700">{borrower.email}</p>
              <div className="flex gap-4 mt-2 pt-2 border-t border-amber-200">
                <div>
                  <p className="text-xs text-amber-600">Début</p>
                  <p className="text-xs font-medium text-amber-900">{new Date(loan.start_date).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-xs text-amber-600">Fin prévue</p>
                  <p className={`text-xs font-medium ${new Date(loan.end_date) < new Date() ? 'text-red-600' : 'text-amber-900'}`}>
                    {new Date(loan.end_date).toLocaleDateString('fr-FR')}
                    {new Date(loan.end_date) < new Date() && ' (en retard)'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Planning des réservations futures */}
        <FutureReservations reservations={futureReservations} />

        {/* Action */}
        {(effectiveStatus === 'available' || effectiveStatus === 'on_loan') && (
          <div className="pt-4 border-t border-gray-100">
            <AddToCartButton
              equipment={item as Equipment}
              overdueInfo={
                loan && new Date(loan.end_date) < new Date()
                  ? {
                      borrowerName: borrower?.full_name || '—',
                      borrowerEmail: borrower?.email || '—',
                      endDate: new Date(loan.end_date).toLocaleDateString('fr-FR'),
                    }
                  : undefined
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}

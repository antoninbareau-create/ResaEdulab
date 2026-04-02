/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/Card'

export default async function AdminOverduePage() {
  const supabase = createAdminClient()

  const now = new Date().toISOString()

  const { data: overdueReservations } = await supabase
    .from('reservations')
    .select(`
      id,
      end_date,
      profiles(full_name, email),
      reservation_items(
        id,
        returned_at,
        equipment(nom, equipement)
      )
    `)
    .eq('status', 'active')
    .lt('end_date', now)
    .order('end_date', { ascending: true })

  // Aplatir : une ligne par équipement non rendu
  const rows = overdueReservations?.flatMap((r) => {
    const profile = r.profiles as any
    const items = (r.reservation_items as any[]).filter((i) => !i.returned_at)
    return items.map((item) => ({
      reservationId: r.id,
      endDate: r.end_date,
      borrowerName: profile?.full_name || profile?.email || '—',
      borrowerEmail: profile?.email || '',
      equipmentNom: item.equipment?.nom || '—',
      equipmentType: item.equipment?.equipement || '—',
    }))
  }) ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Retards</h1>
        {rows.length > 0 && (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
            {rows.length} équipement{rows.length > 1 ? 's' : ''} en retard
          </span>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Équipement</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Référence</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Emprunteur</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date de retour prévue</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Retard</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row, i) => {
                const daysLate = Math.floor(
                  (Date.now() - new Date(row.endDate).getTime()) / (1000 * 60 * 60 * 24)
                )
                const subject = encodeURIComponent(`Rappel de retour — ${row.equipmentNom}`)
                const body = encodeURIComponent(
                  `Bonjour ${row.borrowerName},\n\nNous vous rappelons que l'équipement suivant était attendu en retour le ${new Date(row.endDate).toLocaleDateString('fr-FR')} :\n\n- ${row.equipmentType} (${row.equipmentNom})\n\nMerci de le restituer dès que possible.\n\nCordialement,\nL'équipe EduLab`
                )
                const mailtoHref = `mailto:${row.borrowerEmail}?subject=${subject}&body=${body}`

                return (
                  <tr key={i} className="hover:bg-red-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{row.equipmentType}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{row.equipmentNom}</td>
                    <td className="px-4 py-3 text-gray-900">{row.borrowerName}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(row.endDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                        +{daysLate}j
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={mailtoHref}
                        className="text-xs px-3 py-1 rounded-full border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition-colors whitespace-nowrap"
                      >
                        ✉ Envoyer un rappel
                      </a>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Aucun retard en cours 🎉
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

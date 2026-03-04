export const dynamic = 'force-dynamic'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/Card'
import { EquipmentTable } from '@/components/admin/EquipmentTable'
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

  const onLoanIds = (onLoanRows ?? []).map((r: { equipment_id: string }) => r.equipment_id)

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
        <EquipmentTable equipment={equipment ?? []} onLoanIds={onLoanIds} />
      </Card>
    </div>
  )
}

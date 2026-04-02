import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/equipment/list — returns equipment with computed on_loan status + parent_id
// Uses admin client to bypass RLS and see ALL active reservations
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const adminSupabase = createAdminClient()
  const today = new Date().toISOString()

  const [{ data: equipmentData, error }, { data: onLoanRows }] = await Promise.all([
    adminSupabase.from('equipment').select('*').order('nom'),
    adminSupabase
      .from('reservation_items')
      .select('equipment_id, reservations!inner(status, start_date, end_date, profiles(full_name, email))')
      .is('returned_at', null)
      .eq('reservations.status', 'active')
      .lte('reservations.start_date', today),
  ])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onLoanIds = new Set((onLoanRows ?? []).map((r: any) => r.equipment_id))

  const overdueMap: Record<string, { borrowerName: string; borrowerEmail: string; endDate: string }> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(onLoanRows ?? []).forEach((r: any) => {
    const endDate = new Date(r.reservations.end_date)
    if (endDate < new Date()) {
      overdueMap[r.equipment_id] = {
        borrowerName: r.reservations.profiles?.full_name || '—',
        borrowerEmail: r.reservations.profiles?.email || '—',
        endDate: endDate.toLocaleDateString('fr-FR'),
      }
    }
  })

  const equipment = (equipmentData || []).map((item) => ({
    ...item,
    status: onLoanIds.has(item.id) ? 'on_loan' : item.status,
  }))

  return NextResponse.json({ equipment, overdueMap })
}

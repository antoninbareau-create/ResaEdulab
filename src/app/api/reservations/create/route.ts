import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/reservations/create — atomic availability check + reservation creation
// Uses admin client to see ALL reservations (bypass RLS) and prevent double booking
export async function POST(request: Request) {
  // Verify the user is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const { equipmentIds, startDate, endDate, notes } = body as {
    equipmentIds: string[]
    startDate: string
    endDate: string
    notes?: string
  }

  if (!equipmentIds?.length || !startDate || !endDate) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  // Check availability using admin client (bypasses RLS — sees ALL reservations)
  const { data: conflicts } = await adminSupabase
    .from('reservation_items')
    .select('equipment_id, returned_at, reservations!inner(start_date, end_date, status, profiles(full_name, email))')
    .in('equipment_id', equipmentIds)
    .eq('reservations.status', 'active')
    .is('returned_at', null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conflicting = conflicts?.filter((c: any) => {
    const resStart = new Date(c.reservations.start_date)
    const resEnd = new Date(c.reservations.end_date)
    const reqStart = new Date(startDate)
    const reqEnd = new Date(endDate)
    return reqStart <= resEnd && reqEnd >= resStart
  })

  if (conflicting && conflicting.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const details = conflicting.map((c: any) => {
      const profile = c.reservations.profiles
      const resEnd = new Date(c.reservations.end_date)
      return {
        equipmentId: c.equipment_id,
        borrowerName: profile?.full_name || '—',
        borrowerEmail: profile?.email || '—',
        startDate: new Date(c.reservations.start_date).toLocaleDateString('fr-FR'),
        endDate: resEnd.toLocaleDateString('fr-FR'),
        isOverdue: resEnd < new Date(),
      }
    })
    return NextResponse.json({ conflict: true, details }, { status: 409 })
  }

  // Create reservation atomically (still using admin client for consistency)
  const { data: reservation, error: rErr } = await adminSupabase
    .from('reservations')
    .insert({ user_id: user.id, start_date: startDate, end_date: endDate, notes: notes || null })
    .select()
    .single()

  if (rErr || !reservation) {
    return NextResponse.json({ error: 'Erreur lors de la création de la réservation.' }, { status: 500 })
  }

  const { error: iErr } = await adminSupabase.from('reservation_items').insert(
    equipmentIds.map((eqId) => ({ reservation_id: reservation.id, equipment_id: eqId }))
  )

  if (iErr) {
    // Rollback: delete the reservation if items failed
    await adminSupabase.from('reservations').delete().eq('id', reservation.id)
    return NextResponse.json({ error: 'Erreur lors de l\'ajout des équipements.' }, { status: 500 })
  }

  return NextResponse.json({ reservationId: reservation.id })
}

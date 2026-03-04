/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendReminderEmail } from '@/lib/email/resend'

export async function GET(request: Request) {
  // Basic auth check for cron security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const { data: reservations, error } = await supabase
    .from('reservations')
    .select(`
      *,
      profiles (email, full_name),
      reservation_items (equipment (nom, equipement))
    `)
    .eq('status', 'active')
    .gte('end_date', `${tomorrowStr}T00:00:00`)
    .lte('end_date', `${tomorrowStr}T23:59:59`)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = await Promise.allSettled(
    (reservations || []).map(async (r) => {
      const profile = r.profiles as any
      const items = (r.reservation_items as any[]).map((i) => i.equipment)

      await sendReminderEmail({
        to: profile.email,
        userName: profile.full_name || profile.email,
        reservationId: r.id,
        items,
        startDate: new Date(r.start_date).toLocaleDateString('fr-FR'),
        endDate: new Date(r.end_date).toLocaleDateString('fr-FR'),
      })
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: reservations?.length || 0 })
}

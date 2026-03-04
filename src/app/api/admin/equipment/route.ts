import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const adminSupabase = createAdminClient()
  const body = await request.json()
  const items: Array<{
    nom: string
    equipement: string
    marque?: string | null
    modele?: string | null
    serial_number?: string | null
    purchase_date?: string | null
    image_url?: string | null
    status: string
  }> = Array.isArray(body) ? body : [body]

  if (!items.length) {
    return NextResponse.json({ error: 'Aucun item à insérer' }, { status: 400 })
  }

  // Vérifier les doublons en base
  const noms = items.map((i) => i.nom)
  const { data: existing } = await adminSupabase
    .from('equipment')
    .select('nom')
    .in('nom', noms)

  if (existing && existing.length > 0) {
    const duplicates = existing.map((e: { nom: string }) => e.nom)
    return NextResponse.json(
      {
        error: `Les identifiants suivants existent déjà dans la base : ${duplicates.join(', ')}`,
        duplicates,
      },
      { status: 409 }
    )
  }

  const { error } = await adminSupabase.from('equipment').insert(items)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, count: items.length })
}

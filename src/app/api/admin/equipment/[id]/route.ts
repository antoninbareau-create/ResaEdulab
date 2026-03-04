import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { data, error } = await createAdminClient()
    .from('equipment').select('*').eq('id', params.id).single()

  if (error || !data) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await req.json()
  const { error } = await createAdminClient()
    .from('equipment').update(body).eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { error } = await createAdminClient()
    .from('equipment').delete().eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

async function checkAdmin() {
  const serverSupabase = await createServerClient()
  const { data: { user } } = await serverSupabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await serverSupabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const adminSupabase = await checkAdmin()
  if (!adminSupabase) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { fullName, email, role } = await request.json()

  const updates: Record<string, string> = {}
  if (fullName !== undefined) updates.full_name = fullName
  if (email !== undefined) updates.email = email
  if (role !== undefined) updates.role = role

  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update(updates)
    .eq('id', params.id)

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

  if (email) {
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(params.id, { email })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const adminSupabase = await checkAdmin()
  if (!adminSupabase) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { error } = await adminSupabase.auth.admin.deleteUser(params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div>
      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-100 p-1 shadow-sm w-fit">
        {[
          { href: '/admin/dashboard', label: 'Tableau de bord' },
          { href: '/admin/equipment', label: 'Inventaire' },
          { href: '/admin/reservations', label: 'Réservations' },
          { href: '/admin/users', label: 'Utilisateurs' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-purple-50 hover:text-purple-800 transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  )
}

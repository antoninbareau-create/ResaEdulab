import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user.email?.[0] ?? 'U').toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-purple-800 text-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + liens */}
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0v10l-8 4m0-10L4 7m8 10V7" />
                  </svg>
                </div>
                <span className="font-bold text-base tracking-tight">Edulab</span>
              </Link>

              <div className="hidden sm:flex items-center gap-1">
                <Link
                  href="/equipment"
                  className="px-3 py-1.5 text-sm text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Équipements
                </Link>
                <Link
                  href="/reservations"
                  className="px-3 py-1.5 text-sm text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Mes réservations
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    className="px-3 py-1.5 text-sm text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Admin
                  </Link>
                )}
              </div>
            </div>

            {/* Profil + déconnexion */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center text-xs font-semibold">
                  {initials}
                </div>
                <span className="hidden sm:block text-purple-200 text-sm">
                  {profile?.full_name || user.email}
                </span>
              </div>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-purple-300 hover:text-white text-sm transition-colors"
                  title="Se déconnecter"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

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
    <div className="min-h-screen bg-brand-surface">
      <nav className="bg-brand-dark text-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + liens */}
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-edulab.png" alt="EduLAB" height={44} style={{ height: '44px', width: 'auto' }} />
              </Link>

              <div className="hidden sm:flex items-center gap-1">
                <Link
                  href="/equipment"
                  className="px-3 py-1.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Équipements
                </Link>
                <Link
                  href="/reservations"
                  className="px-3 py-1.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Mes réservations
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    className="px-3 py-1.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Admin
                  </Link>
                )}
              </div>
            </div>

            {/* Profil + déconnexion */}
            <div className="flex items-center gap-3">
              <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-brand-primary/30 rounded-full flex items-center justify-center text-xs font-semibold">
                  {initials}
                </div>
                <span className="hidden sm:block text-white/70 text-sm">
                  {profile?.full_name || user.email}
                </span>
              </Link>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-white/50 hover:text-white text-sm transition-colors"
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

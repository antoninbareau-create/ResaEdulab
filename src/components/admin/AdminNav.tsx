'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Tableau de bord' },
  { href: '/admin/equipment', label: 'Inventaire' },
  { href: '/admin/reservations', label: 'Réservations' },
  { href: '/admin/users', label: 'Utilisateurs' },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-100 p-1 shadow-sm w-fit">
      {NAV_ITEMS.map(({ href, label }) => {
        const isActive = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-primary text-white'
                : 'text-brand-muted hover:bg-brand-light hover:text-brand-primary'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}

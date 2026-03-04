import { cn } from '@/lib/utils'

type BadgeVariant = 'available' | 'unavailable' | 'maintenance' | 'on_loan' | 'active' | 'returned' | 'cancelled' | 'admin' | 'user'

const variantStyles: Record<BadgeVariant, string> = {
  available: 'bg-green-100 text-green-800',
  active: 'bg-green-100 text-green-800',
  unavailable: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
  maintenance: 'bg-orange-100 text-orange-800',
  on_loan: 'bg-orange-100 text-orange-800',
  returned: 'bg-gray-100 text-gray-700',
  admin: 'bg-brand-light text-brand-primary',
  user: 'bg-blue-100 text-blue-800',
}

const variantLabels: Record<BadgeVariant, string> = {
  available: 'Disponible',
  unavailable: 'Indisponible',
  maintenance: 'Maintenance',
  on_loan: 'En prêt',
  active: 'En cours',
  returned: 'Retourné',
  cancelled: 'Annulé',
  admin: 'Admin',
  user: 'Utilisateur',
}

interface BadgeProps {
  variant: BadgeVariant
  className?: string
}

export function Badge({ variant, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {variantLabels[variant]}
    </span>
  )
}

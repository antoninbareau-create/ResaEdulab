'use client'

import { Equipment } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/hooks/useCart'
import Link from 'next/link'

interface EquipmentCardProps {
  equipment: Equipment
}

export function EquipmentCard({ equipment }: EquipmentCardProps) {
  const { addItem, removeItem, isInCart } = useCart()
  const inCart = isInCart(equipment.id)
  const available = equipment.status === 'available'

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="h-40 bg-gray-100 flex items-center justify-center">
        {equipment.image_url ? (
          <img
            src={equipment.image_url}
            alt={equipment.equipement}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-4xl">📷</span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs text-gray-500 font-mono">{equipment.nom}</p>
            <p className="font-semibold text-gray-900 text-sm">{equipment.equipement}</p>
            {equipment.marque && (
              <p className="text-xs text-gray-500">{equipment.marque} {equipment.modele}</p>
            )}
          </div>
          <Badge variant={equipment.status} />
        </div>

        <div className="flex gap-2 mt-3">
          <Link href={`/equipment/${equipment.id}`} className="flex-1">
            <Button variant="ghost" size="sm" className="w-full">
              Détails
            </Button>
          </Link>
          {available && (
            <Button
              size="sm"
              variant={inCart ? 'secondary' : 'primary'}
              onClick={() => inCart ? removeItem(equipment.id) : addItem(equipment)}
            >
              {inCart ? '✓ Ajouté' : '+ Panier'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

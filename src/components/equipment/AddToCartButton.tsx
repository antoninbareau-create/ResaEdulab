'use client'

import { useCart } from '@/hooks/useCart'
import { Equipment } from '@/types'

export function AddToCartButton({ equipment }: { equipment: Equipment }) {
  const { addItem, removeItem, isInCart } = useCart()
  const inCart = isInCart(equipment.id)

  return (
    <button
      onClick={() => inCart ? removeItem(equipment.id) : addItem(equipment)}
      className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        inCart
          ? 'bg-brand-primary text-white'
          : 'bg-brand-light text-brand-primary hover:bg-brand-primary hover:text-white'
      }`}
    >
      {inCart ? '✓ Dans le panier' : '+ Louer cet équipement'}
    </button>
  )
}

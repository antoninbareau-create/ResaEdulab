'use client'

import { useState } from 'react'
import { useCart } from '@/hooks/useCart'
import { Button } from '@/components/ui/Button'
import { Equipment } from '@/types'

interface OverdueInfo {
  borrowerName: string
  borrowerEmail: string
  endDate: string
}

export function AddToCartButton({ equipment, overdueInfo }: { equipment: Equipment; overdueInfo?: OverdueInfo }) {
  const { addItem, removeItem, isInCart } = useCart()
  const inCart = isInCart(equipment.id)
  const [showModal, setShowModal] = useState(false)

  function handleClick() {
    if (inCart) {
      removeItem(equipment.id)
    } else if (overdueInfo) {
      setShowModal(true)
    } else {
      addItem(equipment)
    }
  }

  function confirmAdd() {
    addItem(equipment)
    setShowModal(false)
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          inCart
            ? 'bg-brand-primary text-white'
            : 'bg-brand-light text-brand-primary hover:bg-brand-primary hover:text-white'
        }`}
      >
        {inCart ? '✓ Dans le panier' : '+ Louer cet équipement'}
      </button>

      {showModal && overdueInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-amber-600">Attention — retour en retard</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <p className="text-sm text-gray-700">
                Cet équipement n&apos;a pas encore été rendu. Le retour était prévu le{' '}
                <span className="font-semibold text-red-600">{overdueInfo.endDate}</span>.
              </p>
              <p className="text-sm text-gray-700">
                Nous vous conseillons de contacter l&apos;emprunteur actuel :
              </p>
              <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 space-y-1">
                <p className="text-sm font-semibold text-amber-900">{overdueInfo.borrowerName}</p>
                <a
                  href={`mailto:${overdueInfo.borrowerEmail}`}
                  className="text-sm text-brand-primary hover:underline"
                >
                  {overdueInfo.borrowerEmail}
                </a>
              </div>
              <p className="text-xs text-gray-500">
                Vous pouvez tout de même réserver cet équipement pour des dates futures.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button className="flex-1" onClick={confirmAdd}>
                Réserver quand même
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

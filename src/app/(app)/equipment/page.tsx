'use client'

import { useState } from 'react'
import { useEquipment } from '@/hooks/useEquipment'
import { useCart } from '@/hooks/useCart'
import { EquipmentCard } from '@/components/equipment/EquipmentCard'
import { Button } from '@/components/ui/Button'
import { EquipmentStatus } from '@/types'
import Link from 'next/link'

export default function EquipmentPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<EquipmentStatus | 'all'>('all')
  const { equipment, loading } = useEquipment({ search, status })
  const { items } = useCart()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Équipements</h1>
        {items.length > 0 && (
          <Link href="/reservations/new">
            <Button>
              Panier ({items.length}) →
            </Button>
          </Link>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Rechercher un équipement..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as EquipmentStatus | 'all')}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
        >
          <option value="all">Tous les statuts</option>
          <option value="available">Disponibles</option>
          <option value="unavailable">Indisponibles</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : equipment.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Aucun équipement trouvé</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {equipment.map((item) => (
            <EquipmentCard key={item.id} equipment={item} />
          ))}
        </div>
      )}
    </div>
  )
}

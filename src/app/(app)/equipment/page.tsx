'use client'

import { useState, useMemo } from 'react'
import { useEquipment } from '@/hooks/useEquipment'
import { useCart } from '@/hooks/useCart'
import { Badge } from '@/components/ui/Badge'
import { EquipmentStatus } from '@/types'
import Link from 'next/link'

export default function EquipmentPage() {
  const { equipment, loading } = useEquipment()
  const { addItem, removeItem, isInCart, items } = useCart()

  const types = useMemo(
    () => Array.from(new Set(equipment.map((e) => e.equipement))).sort(),
    [equipment]
  )
  const marques = useMemo(
    () => Array.from(new Set(equipment.map((e) => e.marque).filter(Boolean) as string[])).sort(),
    [equipment]
  )

  const [filterType, setFilterType] = useState('')
  const [filterMarque, setFilterMarque] = useState('')
  const [filterStatut, setFilterStatut] = useState('')

  const filtered = useMemo(() => {
    return equipment.filter((item) => {
      if (filterType && item.equipement !== filterType) return false
      if (filterMarque && item.marque !== filterMarque) return false
      if (filterStatut && item.status !== filterStatut) return false
      return true
    })
  }, [equipment, filterType, filterMarque, filterStatut])

  const selectClass =
    'text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Équipements</h1>
        {items.length > 0 && (
          <Link
            href="/reservations/new"
            className="inline-flex items-center gap-1.5 bg-brand-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors"
          >
            Panier ({items.length}) →
          </Link>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectClass}>
          <option value="">Tous les types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={filterMarque} onChange={(e) => setFilterMarque(e.target.value)} className={selectClass}>
          <option value="">Toutes les marques</option>
          {marques.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className={selectClass}>
          <option value="">Tous les statuts</option>
          <option value="available">Disponible</option>
          <option value="on_loan">En prêt</option>
          <option value="unavailable">Indisponible</option>
          <option value="maintenance">Maintenance</option>
        </select>

        {(filterType || filterMarque || filterStatut) && (
          <button
            onClick={() => { setFilterType(''); setFilterMarque(''); setFilterStatut('') }}
            className="text-sm text-gray-400 hover:text-gray-600 px-2"
          >
            Réinitialiser
          </button>
        )}

        {!loading && (
          <span className="text-sm text-gray-400 self-center ml-auto">
            {filtered.length} / {equipment.length} équipements
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Marque / Modèle</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item) => {
                const inCart = isInCart(item.id)
                const available = item.status === 'available'
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-700 text-xs">{item.nom}</td>
                    <td className="px-4 py-3 text-gray-900">{item.equipement}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {[item.marque, item.modele].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={item.status as EquipmentStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/equipment/${item.id}`}
                          className="text-brand-primary hover:text-brand-dark font-medium text-xs"
                        >
                          Fiche
                        </Link>
                        {available && (
                          <button
                            onClick={() => inCart ? removeItem(item.id) : addItem(item)}
                            className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                              inCart
                                ? 'bg-brand-primary text-white'
                                : 'bg-brand-light text-brand-primary hover:bg-brand-primary hover:text-white'
                            }`}
                          >
                            {inCart ? '✓ Ajouté' : '+ Louer'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Aucun équipement trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

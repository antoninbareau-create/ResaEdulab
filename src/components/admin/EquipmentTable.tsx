'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Equipment, EquipmentStatus } from '@/types'

interface Props {
  equipment: Equipment[]
  onLoanIds: string[]
}

export function EquipmentTable({ equipment, onLoanIds }: Props) {
  const onLoanSet = new Set(onLoanIds)

  const types = useMemo(() => {
    const vals = equipment.map((e) => e.equipement).filter(Boolean)
    return Array.from(new Set(vals)).sort()
  }, [equipment])

  const marques = useMemo(() => {
    const vals = equipment.map((e) => e.marque).filter(Boolean) as string[]
    return Array.from(new Set(vals)).sort()
  }, [equipment])

  const [filterType, setFilterType] = useState('')
  const [filterMarque, setFilterMarque] = useState('')
  const [filterStatut, setFilterStatut] = useState('')

  const filtered = useMemo(() => {
    return equipment.filter((item) => {
      const effectiveStatus = onLoanSet.has(item.id) ? 'on_loan' : item.status
      if (filterType && item.equipement !== filterType) return false
      if (filterMarque && item.marque !== filterMarque) return false
      if (filterStatut && effectiveStatus !== filterStatut) return false
      return true
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipment, filterType, filterMarque, filterStatut, onLoanIds, onLoanSet])

  const selectClass = "text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary"

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
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

        <span className="text-sm text-gray-400 self-center ml-auto">
          {filtered.length} / {equipment.length} équipements
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Marque / Modèle</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">S/N</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-gray-700 text-xs">{item.nom}</td>
                <td className="px-4 py-3 text-gray-900">{item.equipement}</td>
                <td className="px-4 py-3 text-gray-500">
                  {[item.marque, item.modele].filter(Boolean).join(' ') || '—'}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                  {item.serial_number || '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={(onLoanSet.has(item.id) ? 'on_loan' : item.status) as EquipmentStatus} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/equipment/${item.id}`}
                    className="text-brand-primary hover:text-brand-dark font-medium text-xs"
                  >
                    Modifier
                  </Link>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Aucun équipement
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

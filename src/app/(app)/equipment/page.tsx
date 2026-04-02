'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEquipment, OverdueInfo } from '@/hooks/useEquipment'
import { useCart } from '@/hooks/useCart'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EquipmentStatus, Equipment } from '@/types'
import Link from 'next/link'

type SortKey = 'nom' | 'equipement' | 'marque' | 'status'
type SortDir = 'asc' | 'desc'

const SORT_LABELS: Record<SortKey, string> = {
  nom: 'ID',
  equipement: 'Type',
  marque: 'Marque / Modèle',
  status: 'Statut',
}

export default function EquipmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { equipment, overdueMap, loading } = useEquipment()
  const { addItem, removeItem, isInCart, items } = useCart()

  // Filters from URL
  const filterType = searchParams.get('type') ?? ''
  const filterMarque = searchParams.get('marque') ?? ''
  const filterStatut = searchParams.get('statut') ?? ''
  const sortKey = (searchParams.get('sort') as SortKey) || 'nom'
  const sortDir = (searchParams.get('dir') as SortDir) || 'asc'

  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Cascade: reset marque when changing type if incompatible
    if (key === 'type') {
      const currentMarque = params.get('marque')
      if (currentMarque && value) {
        const marquesForType = Array.from(new Set(
          equipment.filter((e) => e.equipement === value).map((e) => e.marque).filter(Boolean)
        ))
        if (!marquesForType.includes(currentMarque)) params.delete('marque')
      }
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router, equipment])

  const clearFilters = useCallback(() => {
    router.replace('?', { scroll: false })
  }, [router])

  function toggleSort(key: SortKey) {
    const params = new URLSearchParams(searchParams.toString())
    if (sortKey === key) {
      params.set('dir', sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      params.set('sort', key)
      params.set('dir', 'asc')
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  // Cascading dropdown options
  const types = useMemo(() => {
    let source = equipment
    if (filterMarque) source = source.filter((e) => e.marque === filterMarque)
    return Array.from(new Set(source.map((e) => e.equipement))).sort()
  }, [equipment, filterMarque])

  const marques = useMemo(() => {
    let source = equipment
    if (filterType) source = source.filter((e) => e.equipement === filterType)
    return Array.from(new Set(source.map((e) => e.marque).filter(Boolean) as string[])).sort()
  }, [equipment, filterType])

  const [overdueModal, setOverdueModal] = useOverdueModal()

  function handleAddToCart(item: Equipment) {
    const overdue = overdueMap[item.id]
    if (overdue) {
      setOverdueModal({ item, info: overdue })
    } else {
      addItem(item)
      // Auto-add accessories (e.g. transport case)
      item.accessories?.forEach((acc) => {
        if (acc.status === 'available' || acc.status === 'on_loan') addItem(acc)
      })
    }
  }

  function handleRemoveFromCart(item: Equipment) {
    removeItem(item.id)
    // Auto-remove accessories
    item.accessories?.forEach((acc) => removeItem(acc.id))
  }

  function confirmOverdueAdd() {
    if (overdueModal) {
      addItem(overdueModal.item)
      overdueModal.item.accessories?.forEach((acc) => {
        if (acc.status === 'available' || acc.status === 'on_loan') addItem(acc)
      })
      setOverdueModal(null)
    }
  }

  // Group: attach children (parent_id != null) as accessories of their parent
  const grouped = useMemo(() => {
    const childrenByParent = new Map<string, Equipment[]>()
    const childIds = new Set<string>()

    for (const item of equipment) {
      if (item.parent_id) {
        childIds.add(item.id)
        const list = childrenByParent.get(item.parent_id) || []
        list.push(item)
        childrenByParent.set(item.parent_id, list)
      }
    }

    return equipment
      .filter((item) => !childIds.has(item.id))
      .map((item) => ({
        ...item,
        accessories: childrenByParent.get(item.id) ?? [],
      }))
  }, [equipment])

  // Filter + sort
  const filtered = useMemo(() => {
    const result = grouped.filter((item) => {
      if (filterType && item.equipement !== filterType) return false
      if (filterMarque && item.marque !== filterMarque) return false
      if (filterStatut && item.status !== filterStatut) return false
      return true
    })

    result.sort((a, b) => {
      let valA: string
      let valB: string
      if (sortKey === 'marque') {
        valA = [a.marque, a.modele].filter(Boolean).join(' ').toLowerCase()
        valB = [b.marque, b.modele].filter(Boolean).join(' ').toLowerCase()
      } else {
        valA = (a[sortKey] ?? '').toLowerCase()
        valB = (b[sortKey] ?? '').toLowerCase()
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [grouped, filterType, filterMarque, filterStatut, sortKey, sortDir])

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

      {/* Filtres — sticky below nav (nav = h-16 = 4rem) */}
      <div className="sticky top-16 z-[5] bg-brand-surface pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap gap-3">
          <select value={filterType} onChange={(e) => setParam('type', e.target.value)} className={selectClass}>
            <option value="">Tous les types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <select value={filterMarque} onChange={(e) => setParam('marque', e.target.value)} className={selectClass}>
            <option value="">Toutes les marques</option>
            {marques.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>

          <select value={filterStatut} onChange={(e) => setParam('statut', e.target.value)} className={selectClass}>
            <option value="">Tous les statuts</option>
            <option value="available">Disponible</option>
            <option value="on_loan">En prêt</option>
            <option value="unavailable">Indisponible</option>
            <option value="maintenance">Maintenance</option>
          </select>

          {(filterType || filterMarque || filterStatut) && (
            <button onClick={clearFilters} className="text-sm text-gray-400 hover:text-gray-600 px-2">
              Réinitialiser
            </button>
          )}

          {!loading && (
            <span className="text-sm text-gray-400 self-center ml-auto">
              {filtered.length} / {grouped.length} équipements
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto max-h-[calc(100vh-13rem)] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-[4]">
              <tr>
                {(['nom', 'equipement', 'marque', 'status'] as SortKey[]).map((key) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer select-none hover:text-gray-900 transition-colors"
                  >
                    <span className="inline-flex items-center gap-1">
                      {SORT_LABELS[key]}
                      <SortIndicator active={sortKey === key} dir={sortDir} />
                    </span>
                  </th>
                ))}
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item) => {
                const inCart = isInCart(item.id)
                const bookable = item.status === 'available' || item.status === 'on_loan'
                const hasAccessories = item.accessories && item.accessories.length > 0
                return (
                  <EquipmentRow
                    key={item.id}
                    item={item}
                    inCart={inCart}
                    bookable={bookable}
                    hasAccessories={hasAccessories}
                    onAdd={() => handleAddToCart(item)}
                    onRemove={() => handleRemoveFromCart(item)}
                    isInCart={isInCart}
                  />
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

      {/* Modale avertissement retard */}
      {overdueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOverdueModal(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-amber-600">Attention — retour en retard</h2>
              <button onClick={() => setOverdueModal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <p className="text-sm text-gray-700">
                L&apos;équipement <span className="font-semibold">{overdueModal.item.equipement}</span>{' '}
                <span className="font-mono text-xs text-gray-500">({overdueModal.item.nom})</span>{' '}
                n&apos;a pas encore été rendu. Le retour était prévu le{' '}
                <span className="font-semibold text-red-600">{overdueModal.info.endDate}</span>.
              </p>
              <p className="text-sm text-gray-700">
                Nous vous conseillons de contacter l&apos;emprunteur actuel :
              </p>
              <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 space-y-1">
                <p className="text-sm font-semibold text-amber-900">{overdueModal.info.borrowerName}</p>
                <a
                  href={`mailto:${overdueModal.info.borrowerEmail}`}
                  className="text-sm text-brand-primary hover:underline"
                >
                  {overdueModal.info.borrowerEmail}
                </a>
              </div>
              <p className="text-xs text-gray-500">
                Vous pouvez tout de même réserver cet équipement pour des dates futures.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setOverdueModal(null)}>
                Annuler
              </Button>
              <Button className="flex-1" onClick={confirmOverdueAdd}>
                Réserver quand même
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Sort indicator arrow ── */
function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) {
    return (
      <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    )
  }
  return (
    <svg className="w-3 h-3 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      {dir === 'asc' ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      )}
    </svg>
  )
}

/* ── Equipment row with nested accessories ── */
function EquipmentRow({
  item,
  inCart,
  bookable,
  hasAccessories,
  onAdd,
  onRemove,
  isInCart,
}: {
  item: Equipment & { accessories?: Equipment[] }
  inCart: boolean
  bookable: boolean
  hasAccessories: boolean | undefined
  onAdd: () => void
  onRemove: () => void
  isInCart: (id: string) => boolean
}) {
  return (
    <>
      <tr className="hover:bg-gray-50">
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
            {bookable && (
              <button
                onClick={() => inCart ? onRemove() : onAdd()}
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
      {/* Nested accessories (e.g. transport case) */}
      {hasAccessories && item.accessories?.map((acc) => {
        const accInCart = isInCart(acc.id)
        return (
          <tr key={acc.id} className="bg-gray-50/50">
            <td className="px-4 py-2 font-mono text-gray-400 text-xs pl-8">
              ↳ {acc.nom}
            </td>
            <td className="px-4 py-2 text-gray-500 text-xs italic">{acc.equipement}</td>
            <td className="px-4 py-2 text-gray-400 text-xs">
              {[acc.marque, acc.modele].filter(Boolean).join(' ') || '—'}
            </td>
            <td className="px-4 py-2">
              <Badge variant={acc.status as EquipmentStatus} />
            </td>
            <td className="px-4 py-2">
              <div className="flex items-center gap-2">
                <Link
                  href={`/equipment/${acc.id}`}
                  className="text-brand-primary hover:text-brand-dark font-medium text-xs"
                >
                  Fiche
                </Link>
                {accInCart && (
                  <span className="text-xs text-gray-400">incl. auto</span>
                )}
              </div>
            </td>
          </tr>
        )
      })}
    </>
  )
}

// Small hook to manage the overdue modal state
function useOverdueModal() {
  return useState<{ item: Equipment; info: OverdueInfo } | null>(null)
}

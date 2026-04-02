'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Link from 'next/link'

interface ConflictDetail {
  equipmentNom: string
  equipmentType: string
  borrowerName: string
  borrowerEmail: string
  startDate: string
  endDate: string
  isOverdue: boolean
}

export default function NewReservationPage() {
  const router = useRouter()
  const { items, clearCart } = useCart()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflictDetails, setConflictDetails] = useState<ConflictDetail[]>([])
  const [showConflictModal, setShowConflictModal] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) return
    setError(null)
    setConflictDetails([])
    setShowConflictModal(false)
    setLoading(true)

    try {
      const res = await fetch('/api/reservations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentIds: items.map((i) => i.equipment.id),
          startDate,
          endDate,
          notes,
        }),
      })

      if (res.status === 401) {
        router.push('/login')
        return
      }

      const data = await res.json()

      if (res.status === 409 && data.conflict) {
        // Server detected conflicts — map them to our UI format
        const details: ConflictDetail[] = data.details.map((c: { equipmentId: string; borrowerName: string; borrowerEmail: string; startDate: string; endDate: string; isOverdue: boolean }) => {
          const equip = items.find((i) => i.equipment.id === c.equipmentId)
          return {
            equipmentNom: equip?.equipment.nom ?? c.equipmentId,
            equipmentType: equip?.equipment.equipement ?? '',
            borrowerName: c.borrowerName,
            borrowerEmail: c.borrowerEmail,
            startDate: c.startDate,
            endDate: c.endDate,
            isOverdue: c.isOverdue,
          }
        })
        setConflictDetails(details)
        setShowConflictModal(true)
        setLoading(false)
        return
      }

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la création de la réservation.')
        setLoading(false)
        return
      }

      clearCart()
      router.push(`/reservations/${data.reservationId}`)
    } catch {
      setError('Erreur de connexion au serveur.')
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Votre panier est vide.</p>
        <Link href="/equipment">
          <Button>Parcourir les équipements</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nouvelle réservation</h1>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Équipements sélectionnés ({items.length})</h2>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100">
          {items.map(({ equipment }) => (
            <div key={equipment.id} className="py-3 flex justify-between text-sm">
              <span className="font-mono text-gray-500">{equipment.nom}</span>
              <span className="text-gray-900">{equipment.equipement}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                <input
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                placeholder="Contexte, projet, remarques..."
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="flex gap-3">
              <Link href="/equipment" className="flex-1">
                <Button variant="secondary" className="w-full">← Modifier le panier</Button>
              </Link>
              <Button type="submit" loading={loading} className="flex-1">
                Confirmer la réservation
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modale de conflit de disponibilité */}
      {showConflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowConflictModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-red-600">Conflit de disponibilité</h2>
              <button onClick={() => setShowConflictModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-gray-600">
                Les équipements suivants sont déjà réservés pour les dates demandées :
              </p>
              {conflictDetails.map((c, i) => (
                <div key={i} className="bg-red-50 border border-red-100 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">{c.equipmentType}</span>
                    <span className="text-xs font-mono text-gray-500">{c.equipmentNom}</span>
                  </div>
                  <div className="border-t border-red-100 pt-2 space-y-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Emprunteur :</span> {c.borrowerName}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Email :</span>{' '}
                      <a href={`mailto:${c.borrowerEmail}`} className="text-brand-primary hover:underline">{c.borrowerEmail}</a>
                    </p>
                    <div className="flex gap-4 text-sm text-gray-700">
                      <span><span className="font-medium">Du</span> {c.startDate}</span>
                      <span>
                        <span className="font-medium">au</span>{' '}
                        <span className={c.isOverdue ? 'text-red-600 font-semibold' : ''}>
                          {c.endDate}{c.isOverdue && ' (en retard)'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <Button variant="secondary" className="w-full" onClick={() => setShowConflictModal(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

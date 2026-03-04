/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function NewReservationPage() {
  const router = useRouter()
  const { items, clearCart } = useCart()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) return
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Check availability for each item in the date range
    const equipmentIds = items.map((i) => i.equipment.id)
    const { data: conflicts } = await supabase
      .from('reservation_items')
      .select('equipment_id, reservations!inner(start_date, end_date, status)')
      .in('equipment_id', equipmentIds)
      .eq('reservations.status', 'active')

    const conflicting = conflicts?.filter((c: any) => {
      const resStart = new Date(c.reservations.start_date)
      const resEnd = new Date(c.reservations.end_date)
      const reqStart = new Date(startDate)
      const reqEnd = new Date(endDate)
      return reqStart <= resEnd && reqEnd >= resStart
    })

    if (conflicting && conflicting.length > 0) {
      const conflictIds = conflicting.map((c: any) => c.equipment_id)
      const conflictNames = items
        .filter((i) => conflictIds.includes(i.equipment.id))
        .map((i) => i.equipment.nom)
        .join(', ')
      setError(`Conflit de disponibilité pour : ${conflictNames}`)
      setLoading(false)
      return
    }

    // Create reservation
    const { data: reservation, error: rErr } = await supabase
      .from('reservations')
      .insert({ user_id: user.id, start_date: startDate, end_date: endDate, notes })
      .select()
      .single()

    if (rErr || !reservation) {
      setError('Erreur lors de la création de la réservation.')
      setLoading(false)
      return
    }

    // Create reservation items
    const { error: iErr } = await supabase.from('reservation_items').insert(
      items.map((i) => ({ reservation_id: reservation.id, equipment_id: i.equipment.id }))
    )

    if (iErr) {
      setError('Erreur lors de l\'ajout des équipements.')
      setLoading(false)
      return
    }

    clearCart()
    router.push(`/reservations/${reservation.id}`)
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
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
    </div>
  )
}

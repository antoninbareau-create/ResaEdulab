'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Reservation } from '@/types'

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchReservations() {
      setLoading(true)
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          reservation_items (
            *,
            equipment (*)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setReservations(data || [])
      }
      setLoading(false)
    }

    fetchReservations()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { reservations, loading, error }
}

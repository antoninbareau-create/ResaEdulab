'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Equipment, EquipmentStatus } from '@/types'

interface UseEquipmentOptions {
  search?: string
  status?: EquipmentStatus | 'all'
}

export function useEquipment({ search = '', status = 'all' }: UseEquipmentOptions = {}) {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchEquipment() {
      setLoading(true)
      const today = new Date().toISOString()

      let query = supabase.from('equipment').select('*').order('nom')

      if (status !== 'all' && status !== 'on_loan') {
        query = query.eq('status', status)
      }

      if (search) {
        query = query.or(
          `nom.ilike.%${search}%,equipement.ilike.%${search}%,marque.ilike.%${search}%,modele.ilike.%${search}%`
        )
      }

      const [{ data, error }, { data: onLoanRows }] = await Promise.all([
        query,
        supabase
          .from('reservation_items')
          .select('equipment_id, reservations!inner(status, start_date, end_date)')
          .is('returned_at', null)
          .eq('reservations.status', 'active')
          .lte('reservations.start_date', today)
          .gte('reservations.end_date', today),
      ])

      if (error) {
        setError(error.message)
      } else {
        const onLoanIds = new Set((onLoanRows ?? []).map((r: { equipment_id: string }) => r.equipment_id))
        let result = (data || []).map((item) => ({
          ...item,
          status: onLoanIds.has(item.id) ? 'on_loan' : item.status,
        })) as Equipment[]

        if (status === 'on_loan') {
          result = result.filter((item) => item.status === 'on_loan')
        }

        setEquipment(result)
      }
      setLoading(false)
    }

    fetchEquipment()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status])

  return { equipment, loading, error }
}

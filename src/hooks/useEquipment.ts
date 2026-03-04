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
      let query = supabase.from('equipment').select('*').order('nom')

      if (status !== 'all') {
        query = query.eq('status', status)
      }

      if (search) {
        query = query.or(
          `nom.ilike.%${search}%,equipement.ilike.%${search}%,marque.ilike.%${search}%,modele.ilike.%${search}%`
        )
      }

      const { data, error } = await query

      if (error) {
        setError(error.message)
      } else {
        setEquipment(data || [])
      }
      setLoading(false)
    }

    fetchEquipment()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status])

  return { equipment, loading, error }
}

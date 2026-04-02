'use client'

import { useState, useEffect } from 'react'
import { Equipment } from '@/types'

export interface OverdueInfo {
  borrowerName: string
  borrowerEmail: string
  endDate: string
}

export function useEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [overdueMap, setOverdueMap] = useState<Record<string, OverdueInfo>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEquipment() {
      setLoading(true)
      try {
        const res = await fetch('/api/equipment/list')
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Erreur de chargement')
          setLoading(false)
          return
        }
        const data = await res.json()
        setEquipment(data.equipment as Equipment[])
        setOverdueMap(data.overdueMap)
      } catch {
        setError('Erreur de chargement')
      }
      setLoading(false)
    }

    fetchEquipment()
  }, [])

  return { equipment, overdueMap, loading, error }
}

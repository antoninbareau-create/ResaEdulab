'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Equipment, EquipmentStatus } from '@/types'

interface UseEquipmentOptions {
  search?: string
  status?: EquipmentStatus | 'all'
}

export interface OverdueInfo {
  borrowerName: string
  borrowerEmail: string
  endDate: string
}

export function useEquipment({ search = '', status = 'all' }: UseEquipmentOptions = {}) {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [overdueMap, setOverdueMap] = useState<Record<string, OverdueInfo>>({})
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
          .select('equipment_id, reservations!inner(status, start_date, end_date, profiles(full_name, email))')
          .is('returned_at', null)
          .eq('reservations.status', 'active')
          .lte('reservations.start_date', today),
      ])

      if (error) {
        setError(error.message)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const onLoanIds = new Set((onLoanRows ?? []).map((r: any) => r.equipment_id))

        // Build overdue map for items past their end_date
        const newOverdueMap: Record<string, OverdueInfo> = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(onLoanRows ?? []).forEach((r: any) => {
          const endDate = new Date(r.reservations.end_date)
          if (endDate < new Date()) {
            newOverdueMap[r.equipment_id] = {
              borrowerName: r.reservations.profiles?.full_name || '—',
              borrowerEmail: r.reservations.profiles?.email || '—',
              endDate: endDate.toLocaleDateString('fr-FR'),
            }
          }
        })
        setOverdueMap(newOverdueMap)

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

  return { equipment, overdueMap, loading, error }
}

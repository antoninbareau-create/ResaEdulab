'use client'

import { useState } from 'react'

interface Reservation {
  startDate: string
  endDate: string
  borrowerName: string
  borrowerEmail: string
}

export function FutureReservations({ reservations }: { reservations: Reservation[] }) {
  const [open, setOpen] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  if (reservations.length === 0) {
    return (
      <div className="pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-400 italic">Aucune réservation à venir</p>
      </div>
    )
  }

  return (
    <div className="pt-4 border-t border-gray-100">
      <button
        onClick={() => { setOpen(!open); if (open) setExpandedIndex(null) }}
        className="flex items-center justify-between w-full text-left group"
      >
        <span className="text-sm font-medium text-gray-600 group-hover:text-brand-primary transition-colors">
          Réservations à venir ({reservations.length})
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {reservations.map((r, i) => (
            <div key={i}>
              <button
                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  expandedIndex === i
                    ? 'bg-brand-light border-brand-primary/30'
                    : 'bg-gray-50 border-gray-100 hover:border-brand-primary/20 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-3 text-sm">
                    <span className="text-gray-500">Du</span>
                    <span className="font-medium text-gray-900">{r.startDate}</span>
                    <span className="text-gray-500">au</span>
                    <span className="font-medium text-gray-900">{r.endDate}</span>
                  </div>
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expandedIndex === i ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expandedIndex === i && (
                <div className="ml-4 mt-1 px-4 py-3 bg-white border border-gray-100 rounded-lg space-y-1">
                  <p className="text-sm text-gray-900 font-medium">{r.borrowerName}</p>
                  <a
                    href={`mailto:${r.borrowerEmail}`}
                    className="text-sm text-brand-primary hover:underline"
                  >
                    {r.borrowerEmail}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

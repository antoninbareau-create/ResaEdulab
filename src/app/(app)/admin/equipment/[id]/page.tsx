'use client'

import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

type EquipmentForm = {
  nom: string
  equipement: string
  marque: string
  modele: string
  serial_number: string
  purchase_date: string
  image_url: string
  status: string
}

export default function EditEquipmentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [form, setForm] = useState<EquipmentForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/equipment/${params.id}`)
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      setForm({
        nom: data.nom ?? '',
        equipement: data.equipement ?? '',
        marque: data.marque ?? '',
        modele: data.modele ?? '',
        serial_number: data.serial_number ?? '',
        purchase_date: data.purchase_date ?? '',
        image_url: data.image_url ?? '',
        status: data.status ?? 'available',
      })
      setLoading(false)
    }
    load()
  }, [params.id])

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => prev ? { ...prev, [e.target.name]: e.target.value } : prev)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setFeedback(null)

    const res = await fetch(`/api/admin/equipment/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        marque: form.marque || null,
        modele: form.modele || null,
        serial_number: form.serial_number || null,
        purchase_date: form.purchase_date || null,
        image_url: form.image_url || null,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setFeedback({ type: 'error', message: data.error ?? 'Erreur inconnue' })
    } else {
      setFeedback({ type: 'success', message: 'Modifications enregistrées.' })
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Chargement...</div>
  }

  if (!form) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="mb-4">Équipement introuvable.</p>
        <Link href="/admin/equipment" className="text-brand-primary hover:underline">← Retour à l&apos;inventaire</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Modifier l&apos;équipement</h1>
        <Link href="/admin/equipment" className="text-sm text-brand-primary hover:text-brand-dark">
          ← Retour à l&apos;inventaire
        </Link>
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm text-gray-500 font-mono">{form.nom}</p>
        </CardHeader>
        <CardContent>
          {feedback && (
            <div className={`mb-5 rounded-lg px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identifiant (Nom) <span className="text-red-500">*</span>
              </label>
              <input
                name="nom"
                value={form.nom}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type d&apos;équipement <span className="text-red-500">*</span>
              </label>
              <input
                name="equipement"
                value={form.equipement}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
              <input
                name="marque"
                value={form.marque}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
              <input
                name="modele"
                value={form.modele}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de série</label>
              <input
                name="serial_number"
                value={form.serial_number}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;achat</label>
              <input
                name="purchase_date"
                type="date"
                value={form.purchase_date}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="available">Disponible</option>
                <option value="unavailable">Indisponible</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex justify-between pt-2">
              <Button
                type="button"
                variant="danger"
                onClick={async () => {
                  if (!confirm('Supprimer cet équipement définitivement ?')) return
                  const res = await fetch(`/api/admin/equipment/${params.id}`, { method: 'DELETE' })
                  if (res.ok) router.push('/admin/equipment')
                  else setFeedback({ type: 'error', message: 'Erreur lors de la suppression.' })
                }}
              >
                Supprimer
              </Button>
              <Button type="submit" loading={saving}>
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

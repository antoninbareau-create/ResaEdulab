'use client'

import { useState, useRef, ChangeEvent, FormEvent } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

type EquipmentRow = {
  nom: string
  equipement: string
  marque: string | null
  modele: string | null
  serial_number: string | null
  purchase_date: string | null
  image_url: string | null
  status: string
}

type Tab = 'manual' | 'csv'

const EMPTY_FORM: EquipmentRow = {
  nom: '',
  equipement: '',
  marque: '',
  modele: '',
  serial_number: '',
  purchase_date: '',
  image_url: '',
  status: 'available',
}

// Convertit DD/MM/YY ou DD/MM/YYYY → YYYY-MM-DD
function parseFrenchDate(raw: string): string | null {
  if (!raw) return null
  const parts = raw.trim().split('/')
  if (parts.length !== 3) return null
  const [day, month, year] = parts
  const fullYear = year.length === 2 ? 2000 + parseInt(year, 10) : parseInt(year, 10)
  if (isNaN(fullYear)) return null
  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

// Parse un CSV au format français (séparateur ;)
// En-têtes attendus : Nom, Equipement, Marque, Modèle, S/N, Date d'achat
function parseCsv(text: string): { rows: EquipmentRow[]; error: string | null } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { rows: [], error: 'Le fichier est vide ou ne contient pas de données.' }

  const headers = lines[0].split(';').map((h) => h.trim().replace(/^"|"$/g, ''))

  const COL = {
    nom: headers.findIndex((h) => h.toLowerCase() === 'nom'),
    equipement: headers.findIndex((h) =>
      ['equipement', 'équipement'].includes(h.toLowerCase())
    ),
    marque: headers.findIndex((h) => h.toLowerCase() === 'marque'),
    modele: headers.findIndex((h) => ['modele', 'modèle'].includes(h.toLowerCase())),
    serial_number: headers.findIndex((h) => ['s/n', 'serial'].includes(h.toLowerCase())),
    purchase_date: headers.findIndex((h) => h.toLowerCase() === "date d'achat"),
  }

  if (COL.nom === -1 || COL.equipement === -1) {
    return {
      rows: [],
      error: 'Colonnes "Nom" et "Equipement" obligatoires introuvables. Vérifiez les en-têtes.',
    }
  }

  const rows: EquipmentRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';').map((c) => c.trim().replace(/^"|"$/g, ''))
    const nom = cols[COL.nom] ?? ''
    const equipement = cols[COL.equipement] ?? ''
    if (!nom || !equipement) continue

    rows.push({
      nom,
      equipement,
      marque: COL.marque !== -1 ? cols[COL.marque] || null : null,
      modele: COL.modele !== -1 ? cols[COL.modele] || null : null,
      serial_number: COL.serial_number !== -1 ? cols[COL.serial_number] || null : null,
      purchase_date: COL.purchase_date !== -1 ? parseFrenchDate(cols[COL.purchase_date]) : null,
      image_url: null,
      status: 'available',
    })
  }

  if (!rows.length) return { rows: [], error: 'Aucune ligne valide trouvée dans le fichier.' }
  return { rows, error: null }
}

async function submitItems(items: EquipmentRow[]): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/admin/equipment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items.length === 1 ? items[0] : items),
  })
  const data = await res.json()
  if (!res.ok) return { success: false, message: data.error ?? 'Erreur inconnue' }
  return {
    success: true,
    message:
      items.length === 1
        ? `Équipement "${items[0].nom}" ajouté avec succès.`
        : `${data.count} équipement(s) importé(s) avec succès.`,
  }
}

export default function NewEquipmentPage() {
  const [tab, setTab] = useState<Tab>('manual')

  // --- Formulaire manuel ---
  const [form, setForm] = useState<EquipmentRow>(EMPTY_FORM)
  const [manualLoading, setManualLoading] = useState(false)
  const [manualFeedback, setManualFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function handleFormChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleManualSubmit(e: FormEvent) {
    e.preventDefault()
    setManualLoading(true)
    setManualFeedback(null)
    const result = await submitItems([
      {
        ...form,
        marque: form.marque || null,
        modele: form.modele || null,
        serial_number: form.serial_number || null,
        purchase_date: form.purchase_date || null,
        image_url: form.image_url || null,
      },
    ])
    setManualLoading(false)
    setManualFeedback({ type: result.success ? 'success' : 'error', message: result.message })
    if (result.success) setForm(EMPTY_FORM)
  }

  // --- Import CSV ---
  const fileRef = useRef<HTMLInputElement>(null)
  const [csvRows, setCsvRows] = useState<EquipmentRow[] | null>(null)
  const [csvParseError, setCsvParseError] = useState<string | null>(null)
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvFeedback, setCsvFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvRows(null)
    setCsvParseError(null)
    setCsvFeedback(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const { rows, error } = parseCsv(text)
      if (error) setCsvParseError(error)
      else setCsvRows(rows)
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function handleCsvImport() {
    if (!csvRows) return
    setCsvLoading(true)
    setCsvFeedback(null)
    const result = await submitItems(csvRows)
    setCsvLoading(false)
    setCsvFeedback({ type: result.success ? 'success' : 'error', message: result.message })
    if (result.success) {
      setCsvRows(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ajouter du matériel</h1>
        <Link href="/admin/equipment" className="text-sm text-brand-primary hover:text-brand-dark">
          ← Retour à l&apos;inventaire
        </Link>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-100 p-1 shadow-sm w-fit">
        {(['manual', 'csv'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-brand-primary text-white'
                : 'text-gray-600 hover:bg-brand-light hover:text-brand-primary'
            }`}
          >
            {t === 'manual' ? 'Ajout manuel' : 'Import CSV'}
          </button>
        ))}
      </div>

      {/* --- Onglet Ajout manuel --- */}
      {tab === 'manual' && (
        <Card>
          <CardHeader>
            <p className="text-sm text-gray-500">
              Remplissez les champs ci-dessous pour ajouter un équipement. Les champs marqués{' '}
              <span className="text-red-500">*</span> sont obligatoires.
            </p>
          </CardHeader>
          <CardContent>
            {manualFeedback && (
              <div
                className={`mb-5 rounded-lg px-4 py-3 text-sm ${
                  manualFeedback.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {manualFeedback.message}
              </div>
            )}
            <form onSubmit={handleManualSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Identifiant (Nom) <span className="text-red-500">*</span>
                </label>
                <input
                  name="nom"
                  value={form.nom}
                  onChange={handleFormChange}
                  required
                  placeholder="ex: AUD21001"
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
                  onChange={handleFormChange}
                  required
                  placeholder="ex: micro cravate"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
                <input
                  name="marque"
                  value={form.marque ?? ''}
                  onChange={handleFormChange}
                  placeholder="ex: Sony"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
                <input
                  name="modele"
                  value={form.modele ?? ''}
                  onChange={handleFormChange}
                  placeholder="ex: ECM-AW4"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de série</label>
                <input
                  name="serial_number"
                  value={form.serial_number ?? ''}
                  onChange={handleFormChange}
                  placeholder="ex: SN123456"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;achat</label>
                <input
                  name="purchase_date"
                  type="date"
                  value={form.purchase_date ?? ''}
                  onChange={handleFormChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="available">Disponible</option>
                  <option value="unavailable">Indisponible</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex justify-end pt-2">
                <Button type="submit" loading={manualLoading}>
                  Ajouter l&apos;équipement
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* --- Onglet Import CSV --- */}
      {tab === 'csv' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <p className="text-sm text-gray-500">
                Importez un fichier CSV au format Excel français (séparateur{' '}
                <code className="bg-gray-100 px-1 rounded">;</code>). En-têtes attendus :{' '}
                <code className="bg-gray-100 px-1 rounded text-xs">
                  Nom;Equipement;Marque;Modèle;S/N;Date d&apos;achat
                </code>
              </p>
            </CardHeader>
            <CardContent>
              {csvFeedback && (
                <div
                  className={`mb-5 rounded-lg px-4 py-3 text-sm ${
                    csvFeedback.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {csvFeedback.message}
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="block text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-light file:text-brand-primary hover:file:bg-brand-light cursor-pointer"
              />
              {csvParseError && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {csvParseError}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Aperçu */}
          {csvRows && csvRows.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    Aperçu —{' '}
                    <span className="text-brand-primary">{csvRows.length} équipement(s)</span> à importer
                  </span>
                  <Button onClick={handleCsvImport} loading={csvLoading} size="sm">
                    Confirmer l&apos;import
                  </Button>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['ID', 'Type', 'Marque', 'Modèle', 'S/N', "Date d\u0027achat"].map((h) => (
                        <th key={h} className="text-left px-4 py-2 font-medium text-gray-600 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {csvRows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-xs text-gray-700">{row.nom}</td>
                        <td className="px-4 py-2 text-gray-900">{row.equipement}</td>
                        <td className="px-4 py-2 text-gray-500">{row.marque || '—'}</td>
                        <td className="px-4 py-2 text-gray-500">{row.modele || '—'}</td>
                        <td className="px-4 py-2 font-mono text-xs text-gray-400">{row.serial_number || '—'}</td>
                        <td className="px-4 py-2 text-gray-400 text-xs">{row.purchase_date || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

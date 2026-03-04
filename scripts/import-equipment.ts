import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function importEquipment() {
  const filePath = path.resolve(__dirname, '../Listing_stock_Edulab.xlsx')
  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[]

  const equipment = rows.map((row) => ({
    nom: String(row['Nom'] || row['NOM'] || '').trim(),
    equipement: String(row['Equipement'] || row['EQUIPEMENT'] || row['Équipement'] || '').trim(),
    marque: String(row['Marque'] || row['MARQUE'] || '').trim() || null,
    modele: String(row['Modèle'] || row['Modele'] || row['MODELE'] || '').trim() || null,
    serial_number: String(row['S/N'] || row['Serial'] || '').trim() || null,
    purchase_date: row["Date d'achat"] ? new Date(row["Date d'achat"]).toISOString().split('T')[0] : null,
    status: 'available',
  })).filter((e) => e.nom && e.equipement)

  console.log(`Importing ${equipment.length} items...`)

  const { data, error } = await supabase
    .from('equipment')
    .upsert(equipment, { onConflict: 'nom' })

  if (error) {
    console.error('Import error:', error)
    process.exit(1)
  }

  console.log('Import successful!')
}

importEquipment()

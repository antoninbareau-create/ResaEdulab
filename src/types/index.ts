export type EquipmentStatus = 'available' | 'unavailable' | 'maintenance'
export type ReservationStatus = 'active' | 'returned' | 'cancelled'
export type UserRole = 'user' | 'admin'

export interface Equipment {
  id: string
  nom: string
  equipement: string
  marque: string | null
  modele: string | null
  serial_number: string | null
  purchase_date: string | null
  status: EquipmentStatus
  image_url: string | null
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
}

export interface Reservation {
  id: string
  user_id: string
  start_date: string
  end_date: string
  status: ReservationStatus
  notes: string | null
  created_at: string
  profiles?: Profile
  reservation_items?: ReservationItem[]
}

export interface ReservationItem {
  id: string
  reservation_id: string
  equipment_id: string
  returned_at: string | null
  equipment?: Equipment
}

export interface CartItem {
  equipment: Equipment
}

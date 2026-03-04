import { create } from 'zustand'
import { Equipment, CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  addItem: (equipment: Equipment) => void
  removeItem: (equipmentId: string) => void
  clearCart: () => void
  isInCart: (equipmentId: string) => boolean
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],

  addItem: (equipment) => {
    if (!get().isInCart(equipment.id)) {
      set((state) => ({ items: [...state.items, { equipment }] }))
    }
  },

  removeItem: (equipmentId) => {
    set((state) => ({
      items: state.items.filter((item) => item.equipment.id !== equipmentId),
    }))
  },

  clearCart: () => set({ items: [] }),

  isInCart: (equipmentId) => {
    return get().items.some((item) => item.equipment.id === equipmentId)
  },
}))

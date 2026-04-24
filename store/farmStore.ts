import { create } from 'zustand'

export type TileType = 'EMPTY' | 'PREPARED' | 'PLANTED' | 'BUILDING' | 'WATER'

export interface TileData {
  x: number
  z: number
  type: TileType
}

interface FarmStore {
  // Tiles
  tiles: Record<string, TileData>
  selectedTile: { x: number; z: number } | null

  // Ações
  selectTile: (x: number, z: number) => void
  clearSelection: () => void
  setTileType: (x: number, z: number, type: TileType) => void

  // Economia
  energy: number
  balance: number
  useEnergy: (amount: number) => boolean
  addBalance: (amount: number) => void
}

export const useFarmStore = create<FarmStore>((set, get) => ({
  tiles: {},
  selectedTile: null,
  energy: 0,
  balance: 0,

  selectTile: (x, z) => {
    set({ selectedTile: { x, z } })
  },

  clearSelection: () => {
    set({ selectedTile: null })
  },

  setTileType: (x, z, type) => {
    const key = `${x}-${z}`
    set((state) => ({
      tiles: {
        ...state.tiles,
        [key]: { x, z, type },
      },
    }))
  },

  useEnergy: (amount) => {
    const { energy } = get()
    if (energy < amount) return false
    set((state) => ({ energy: state.energy - amount }))
    return true
  },

  addBalance: (amount) => {
    set((state) => ({ balance: state.balance + amount }))
  },
}))
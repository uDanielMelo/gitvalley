import { create } from 'zustand'

export type TileType = 'EMPTY' | 'PREPARED' | 'PLANTED' | 'BUILDING' | 'WATER'

export interface TileData {
  x: number
  z: number
  type: TileType
}

interface FarmStore {
  tiles: Record<string, TileData>
  selectedTile: { x: number; z: number } | null
  balance: number

  selectTile: (x: number, z: number) => void
  clearSelection: () => void
  setTileType: (x: number, z: number, type: TileType) => void
  addBalance: (amount: number) => void
}

export const useFarmStore = create<FarmStore>((set) => ({
  tiles: {},
  selectedTile: null,
  balance: 0,

  selectTile: (x, z) => set({ selectedTile: { x, z } }),
  clearSelection: () => set({ selectedTile: null }),

  setTileType: (x, z, type) => {
    const key = `${x}-${z}`
    set((state) => ({
      tiles: {
        ...state.tiles,
        [key]: { x, z, type },
      },
    }))
  },

  addBalance: (amount) => set((state) => ({ balance: state.balance + amount })),
}))
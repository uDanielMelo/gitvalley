'use client'

import { useFarmStore } from '@/store/farmStore'

async function saveTile(posX: number, posY: number, type: string, crop?: string) {
  await fetch('/api/farm/tiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ posX, posY, type, crop }),
  })
}

export default function TileMenu() {
  const { selectedTile, clearSelection, setTileType, tiles } = useFarmStore()

  if (!selectedTile) return null

  const key = `${selectedTile.x}-${selectedTile.z}`
  const currentType = tiles[key]?.type ?? 'EMPTY'

  const actions = {
    EMPTY: [
      {
        label: '⛏ Preparar Solo',
        action: async () => {
          setTileType(selectedTile.x, selectedTile.z, 'PREPARED')
          await saveTile(selectedTile.x, selectedTile.z, 'PREPARED')
          clearSelection()
        },
      },
      {
        label: '💧 Criar Lago',
        action: async () => {
          setTileType(selectedTile.x, selectedTile.z, 'WATER')
          await saveTile(selectedTile.x, selectedTile.z, 'WATER')
          clearSelection()
        },
      },
    ],
    PREPARED: [
      {
        label: '🌱 Plantar Trigo',
        action: async () => {
          setTileType(selectedTile.x, selectedTile.z, 'PLANTED')
          await saveTile(selectedTile.x, selectedTile.z, 'PLANTED', 'TRIGO')
          clearSelection()
        },
      },
    ],
    PLANTED: [
      {
        label: '🌾 Colher',
        action: async () => {
          setTileType(selectedTile.x, selectedTile.z, 'EMPTY')
          await saveTile(selectedTile.x, selectedTile.z, 'EMPTY')
          clearSelection()
        },
      },
    ],
    BUILDING: [],
    WATER: [],
  }

  const currentActions = actions[currentType] ?? []

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
      <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-6 py-4 flex flex-col items-center gap-3 min-w-64">
        <div className="flex items-center gap-2">
          <span className="text-[#a0a0b0] text-sm">
            Tile ({selectedTile.x}, {selectedTile.z})
          </span>
          <span className="bg-[#2d6a4f] text-white text-xs px-2 py-0.5 rounded-full">
            {currentType}
          </span>
        </div>

        {currentActions.length > 0 ? (
          <div className="flex gap-2 flex-wrap justify-center">
            {currentActions.map((action) => (
              <button
                key={action.label}
                onClick={action.action}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#2d6a4f] hover:bg-[#3a8a65] text-white transition-all"
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[#a0a0b0] text-sm">Nenhuma ação disponível</p>
        )}

        <button
          onClick={clearSelection}
          className="text-[#a0a0b0] text-xs hover:text-white transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
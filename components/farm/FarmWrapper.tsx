'use client'

import dynamic from 'next/dynamic'

const FarmCanvas = dynamic(() => import('./FarmCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <p className="text-[#a0a0b0]">Carregando fazenda...</p>
    </div>
  ),
})

interface FarmWrapperProps {
  gridSizeX: number
  gridSizeY: number
  biome: Record<string, number>
}

export default function FarmWrapper({ gridSizeX, gridSizeY, biome }: FarmWrapperProps) {
  return <FarmCanvas gridSizeX={gridSizeX} gridSizeY={gridSizeY} biome={biome} />
}
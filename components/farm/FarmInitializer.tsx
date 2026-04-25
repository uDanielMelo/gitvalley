'use client'

import { useEffect } from 'react'
import { useFarmStore } from '@/store/farmStore'

interface FarmInitializerProps {
  balance: number
  tiles: Array<{
    posX: number
    posY: number
    type: string
  }>
}

export default function FarmInitializer({ balance, tiles }: FarmInitializerProps) {
  const { setTileType } = useFarmStore()

useEffect(() => {
  console.log('Tiles recebidos:', tiles)
  useFarmStore.setState({ balance })
  tiles.forEach((tile) => {
    setTileType(tile.posX, tile.posY, tile.type as any)
  })
}, [balance, tiles, setTileType])

  return null
}
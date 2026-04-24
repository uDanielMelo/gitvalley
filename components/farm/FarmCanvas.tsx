'use client'

import { Canvas, ThreeEvent } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo, useState } from 'react'
import { useFarmStore, TileType } from '@/store/farmStore'

const BIOME_COLORS: Record<string, { ground: string; accent: string }> = {
  JavaScript: { ground: '#4a7c3f', accent: '#2d5a27' },
  TypeScript: { ground: '#3d6b8a', accent: '#2a4f6e' },
  Python:     { ground: '#7a8c3f', accent: '#5a6b2a' },
  HTML:       { ground: '#8a5c3f', accent: '#6b3f2a' },
  CSS:        { ground: '#3f6b8a', accent: '#2a4f6e' },
  Rust:       { ground: '#6b4a3f', accent: '#4e3228' },
  Go:         { ground: '#3f7a6b', accent: '#2a5a4f' },
  Ruby:       { ground: '#7a3f5c', accent: '#5a2a3f' },
  Java:       { ground: '#7a6b3f', accent: '#5a4f2a' },
  default:    { ground: '#5a7a4a', accent: '#3f5a32' },
}

const TILE_TYPE_COLORS: Record<TileType, string> = {
  EMPTY:    '',
  PREPARED: '#c4a35a',
  PLANTED:  '#2d8a3e',
  BUILDING: '#8a8a8a',
  WATER:    '#3a7abf',
}

function getBiomeColor(languages: Record<string, number>) {
  const dominant = Object.entries(languages).sort((a, b) => b[1] - a[1])[0]
  if (!dominant) return BIOME_COLORS.default
  return BIOME_COLORS[dominant[0]] ?? BIOME_COLORS.default
}

interface TileProps {
  position: [number, number, number]
  color: string
  isSelected: boolean
  tileType: TileType
  onClick: (e: ThreeEvent<MouseEvent>) => void
}

function Tile({ position, color, isSelected, tileType, onClick }: TileProps) {
  const [hovered, setHovered] = useState(false)

  const displayColor = tileType !== 'EMPTY'
    ? TILE_TYPE_COLORS[tileType]
    : isSelected
      ? '#f0c040'
      : hovered
        ? '#ffffff'
        : color

  const height = tileType === 'PREPARED' ? 0.22 : 0.18

  return (
    <group
      position={position}
      onClick={onClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, isSelected ? 0.06 : 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.92, height, 0.92]} />
        <meshLambertMaterial color={displayColor} />
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[0.94, 0.02, 0.94]} />
        <meshLambertMaterial color="#1a1a1a" />
      </mesh>
    </group>
  )
}

interface FarmCanvasProps {
  gridSizeX: number
  gridSizeY: number
  biome: Record<string, number>
}

export default function FarmCanvas({ gridSizeX, gridSizeY, biome }: FarmCanvasProps) {
  const colors = getBiomeColor(biome)
  const { selectedTile, selectTile, tiles } = useFarmStore()

  const tileList = useMemo(() => {
    const result = []
    for (let x = 0; x < gridSizeX; x++) {
      for (let z = 0; z < gridSizeY; z++) {
        const isAccent = (x + z) % 7 === 0
        result.push({ x, z, color: isAccent ? colors.accent : colors.ground })
      }
    }
    return result
  }, [gridSizeX, gridSizeY, colors])

  const offsetX = (gridSizeX - 1) / 2
  const offsetZ = (gridSizeY - 1) / 2
  const camDist = Math.max(gridSizeX, gridSizeY) * 0.9

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{
          position: [camDist, camDist * 0.8, camDist],
          fov: 45,
        }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[15, 25, 15]} intensity={1.0} castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[-10, 10, -10]} intensity={0.3} color="#b0c4ff" />

        {tileList.map(({ x, z, color }) => {
          const key = `${x}-${z}`
          const tileData = tiles[key]
          const isSelected = selectedTile?.x === x && selectedTile?.z === z

          return (
            <Tile
              key={key}
              position={[x - offsetX, 0, z - offsetZ]}
              color={color}
              isSelected={isSelected}
              tileType={tileData?.type ?? 'EMPTY'}
              onClick={(e) => {
                e.stopPropagation()
                selectTile(x, z)
              }}
            />
          )
        })}

        <mesh position={[0, -0.15, 0]} receiveShadow>
          <boxGeometry args={[gridSizeX + 2, 0.1, gridSizeY + 2]} />
          <meshLambertMaterial color="#111111" />
        </mesh>

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.5}
          minDistance={5}
          maxDistance={camDist * 2}
        />
      </Canvas>
    </div>
  )
}
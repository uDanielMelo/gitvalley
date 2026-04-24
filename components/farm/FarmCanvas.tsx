'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo } from 'react'

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

function getBiomeColor(languages: Record<string, number>) {
  const dominant = Object.entries(languages).sort((a, b) => b[1] - a[1])[0]
  if (!dominant) return BIOME_COLORS.default
  return BIOME_COLORS[dominant[0]] ?? BIOME_COLORS.default
}

interface TileProps {
  position: [number, number, number]
  color: string
  onClick: () => void
}

function Tile({ position, color, onClick }: TileProps) {
  return (
    <group position={position} onClick={onClick}>
      {/* Base do tile */}
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.92, 0.18, 0.92]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Borda do tile */}
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

  const tiles = useMemo(() => {
    const result = []
    for (let x = 0; x < gridSizeX; x++) {
      for (let z = 0; z < gridSizeY; z++) {
        // Variação sutil de cor para dar textura ao terreno
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
        {/* Iluminação */}
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[15, 25, 15]}
          intensity={1.0}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight
          position={[-10, 10, -10]}
          intensity={0.3}
          color="#b0c4ff"
        />

        {/* Tiles */}
        {tiles.map(({ x, z, color }) => (
          <Tile
            key={`${x}-${z}`}
            position={[x - offsetX, 0, z - offsetZ]}
            color={color}
            onClick={() => console.log(`Tile clicado: ${x}, ${z}`)}
          />
        ))}

        {/* Chão base */}
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
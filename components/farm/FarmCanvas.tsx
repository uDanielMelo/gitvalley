'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo } from 'react'

interface TileProps {
  position: [number, number, number]
  type: 'empty' | 'dirt'
}

function Tile({ position, type }: TileProps) {
  const color = type === 'dirt' ? '#8B6914' : '#4a7c3f'

  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={[0.95, 0.2, 0.95]} />
      <meshLambertMaterial color={color} />
    </mesh>
  )
}

interface FarmCanvasProps {
  gridSizeX: number
  gridSizeY: number
}

export default function FarmCanvas({ gridSizeX, gridSizeY }: FarmCanvasProps) {
  const tiles = useMemo(() => {
    const result = []
    for (let x = 0; x < gridSizeX; x++) {
      for (let z = 0; z < gridSizeY; z++) {
        result.push({ x, z })
      }
    }
    return result
  }, [gridSizeX, gridSizeY])

  const offsetX = (gridSizeX - 1) / 2
  const offsetZ = (gridSizeY - 1) / 2

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{
          position: [gridSizeX * 0.8, gridSizeX * 0.6, gridSizeY * 0.8],
          fov: 50,
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.2}
          castShadow
        />

        {tiles.map(({ x, z }) => (
          <Tile
            key={`${x}-${z}`}
            position={[x - offsetX, 0, z - offsetZ]}
            type="empty"
          />
        ))}

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.5}
        />
      </Canvas>
    </div>
  )
}
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const farm = await prisma.farm.findUnique({
    where: { userId: session.user.id },
    include: { tiles: true },
  })

  if (!farm) {
    return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
  }

  return NextResponse.json({ tiles: farm.tiles })
}

export async function POST(req: Request) {
  const session = await auth()
  console.log('Session na API:', session?.user?.id)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { posX, posY, type, crop } = await req.json()

  const farm = await prisma.farm.findUnique({
    where: { userId: session.user.id },
  })

  if (!farm) {
    return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
  }

  const tile = await prisma.tile.upsert({
    where: {
      farmId_posX_posY: {
        farmId: farm.id,
        posX,
        posY,
      },
    },
    update: {
      type,
      crop: crop ?? null,
    },
    create: {
      farmId: farm.id,
      posX,
      posY,
      type,
      crop: crop ?? null,
    },
  })

  return NextResponse.json({ tile })
}
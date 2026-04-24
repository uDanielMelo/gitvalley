import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getGitHubData } from '@/lib/github'
import { NextResponse } from 'next/server'

export async function POST() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { gitStats: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Verifica cooldown de 24h
  if (user.gitStats?.lastSyncAt) {
    const lastSync = new Date(user.gitStats.lastSyncAt)
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / 1000 / 60 / 60
    if (hoursSinceSync < 24) {
      return NextResponse.json({
        message: 'Already synced recently',
        nextSyncIn: Math.ceil(24 - hoursSinceSync),
      })
    }
  }

  // Busca o token de acesso da sessão
  const token = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!token) {
    return NextResponse.json({ error: 'Token not found' }, { status: 401 })
  }

  // Busca dados do GitHub
  const githubData = await getGitHubData(session.accessToken as string)

  // Calcula tamanho do terreno baseado em repos
  const gridSize = calculateGridSize(githubData.totalRepos)

  // Salva GitStats
  await prisma.gitStats.upsert({
    where: { userId: user.id },
    update: {
      totalCommits: githubData.totalCommits,
      totalRepos: githubData.totalRepos,
      totalStars: githubData.totalStars,
      totalFollowers: githubData.totalFollowers,
      totalFollowing: githubData.totalFollowing,
      streak: githubData.streak,
      languages: githubData.languages,
      dailyEnergy: githubData.dailyEnergy,
      energyUsedToday: 0,
      lastSyncAt: new Date(),
    },
    create: {
      userId: user.id,
      totalCommits: githubData.totalCommits,
      totalRepos: githubData.totalRepos,
      totalStars: githubData.totalStars,
      totalFollowers: githubData.totalFollowers,
      totalFollowing: githubData.totalFollowing,
      streak: githubData.streak,
      languages: githubData.languages,
      dailyEnergy: githubData.dailyEnergy,
      energyUsedToday: 0,
      lastSyncAt: new Date(),
    },
  })

  // Cria fazenda se não existir
  await prisma.farm.upsert({
    where: { userId: user.id },
    update: {
      gridSizeX: gridSize,
      gridSizeY: gridSize,
      biome: githubData.languages,
    },
    create: {
      userId: user.id,
      gridSizeX: gridSize,
      gridSizeY: gridSize,
      biome: githubData.languages,
    },
  })

  return NextResponse.json({
    success: true,
    data: {
      ...githubData,
      gridSize,
    },
  })
}

function calculateGridSize(totalRepos: number): number {
  if (totalRepos <= 2) return 10
  if (totalRepos <= 5) return 15
  if (totalRepos <= 10) return 20
  if (totalRepos <= 20) return 30
  if (totalRepos <= 50) return 50
  return 80
}
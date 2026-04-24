import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getGitHubData } from '@/lib/github'
import FarmWrapper from '@/components/farm/FarmWrapper'
import TileMenu from '@/components/ui/TileMenu'

function calculateGridSize(totalRepos: number): number {
  if (totalRepos <= 2) return 10
  if (totalRepos <= 5) return 15
  if (totalRepos <= 10) return 20
  if (totalRepos <= 20) return 30
  if (totalRepos <= 50) return 50
  return 80
}

export default async function FarmPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { gitStats: true, farm: true },
  })

  if (!user) {
    redirect('/')
  }

  const needsSync = !user.gitStats || (() => {
    const lastSync = new Date(user.gitStats.lastSyncAt)
    const hoursSince = (Date.now() - lastSync.getTime()) / 1000 / 60 / 60
    return hoursSince >= 24
  })()

  if (needsSync) {
    const githubData = await getGitHubData(session.accessToken)
    const gridSize = calculateGridSize(githubData.totalRepos)

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
  }

  const farm = await prisma.farm.findUnique({ where: { userId: user.id } })
  const stats = await prisma.gitStats.findUnique({ where: { userId: user.id } })

  return (
    <main className="w-screen h-screen bg-[#1a1a2e] relative overflow-hidden">

      {/* Grid 3D */}
      <div className="absolute inset-0">
        <FarmWrapper
          gridSizeX={farm?.gridSizeX ?? 10}
          gridSizeY={farm?.gridSizeY ?? 10}
          biome={(farm?.biome as Record<string, number>) ?? {}}
        />
      </div>

      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2">
          <p className="text-[#e8c97a] font-bold text-lg">{user.username}</p>
          <p className="text-[#a0a0b0] text-sm">{farm?.gridSizeX}x{farm?.gridSizeY} tiles</p>
        </div>

        <div className="flex gap-3">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
            <p className="text-[#a0a0b0] text-xs">Energia</p>
            <p className="text-[#e8c97a] font-bold">{stats?.dailyEnergy ?? 0}</p>
          </div>
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
            <p className="text-[#a0a0b0] text-xs">Streak</p>
            <p className="text-[#e8c97a] font-bold">{stats?.streak ?? 0} dias</p>
          </div>
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
            <p className="text-[#a0a0b0] text-xs">G$</p>
            <p className="text-[#e8c97a] font-bold">{farm?.balance ?? 0}</p>
          </div>
        </div>
      </div>
      {/* Menu de tile */}
      <div className="absolute inset-0 pointer-events-none">
        <TileMenu energy={stats?.dailyEnergy ?? 0} />
      </div>
    </main>
  )
}
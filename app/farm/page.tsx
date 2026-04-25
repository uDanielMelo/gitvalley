import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getGitHubData } from '@/lib/github'
import FarmWrapper from '@/components/farm/FarmWrapper'
import TileMenu from '@/components/ui/TileMenu'
import FarmInitializer from '@/components/farm/FarmInitializer'

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
    return hoursSince >= 168
  })()

  if (needsSync) {
    console.log('=== NEEDS SYNC, criando fazenda ===')
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

    const existingFarm = await prisma.farm.findUnique({
      where: { userId: user.id },
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
        balance: 5000,
        houseX: Math.floor(gridSize / 2),
        houseY: Math.floor(gridSize / 2),
      },
    })

    if (!existingFarm) {
      const newFarm = await prisma.farm.findUnique({
        where: { userId: user.id },
      })
      if (newFarm) {
        await prisma.peon.createMany({
          data: [
            { farmId: newFarm.id, name: 'Peão 1' },
            { farmId: newFarm.id, name: 'Peão 2' },
            { farmId: newFarm.id, name: 'Peão 3' },
          ],
        })

        const cx = Math.floor(gridSize / 2)
        const cy = Math.floor(gridSize / 2)
        await prisma.tile.createMany({
          data: [
            { farmId: newFarm.id, posX: cx, posY: cy, type: 'BUILDING', data: { building: 'HOUSE' } },
            { farmId: newFarm.id, posX: cx + 1, posY: cy, type: 'BUILDING', data: { building: 'HOUSE' } },
            { farmId: newFarm.id, posX: cx, posY: cy + 1, type: 'BUILDING', data: { building: 'HOUSE' } },
            { farmId: newFarm.id, posX: cx + 1, posY: cy + 1, type: 'BUILDING', data: { building: 'HOUSE' } },
          ],
        })
      }
    }
  }

  const farm = await prisma.farm.findUnique({
    where: { userId: user.id },
    include: { tiles: true },
  })
  const stats = await prisma.gitStats.findUnique({ where: { userId: user.id } })

  return (
    <main className="w-screen h-screen bg-[#1a1a2e] relative overflow-hidden">
      <FarmInitializer
        balance={farm?.balance ?? 0}
        tiles={farm?.tiles ?? []}
      />
      <div className="absolute inset-0">
        <FarmWrapper
          gridSizeX={farm?.gridSizeX ?? 10}
          gridSizeY={farm?.gridSizeY ?? 10}
          biome={(farm?.biome as Record<string, number>) ?? {}}
          houseX={farm?.houseX ?? 0}
          houseY={farm?.houseY ?? 0}
        />
      </div>

      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2">
          <p className="text-[#e8c97a] font-bold text-lg">{user.username}</p>
          <p className="text-[#a0a0b0] text-sm">{farm?.gridSizeX}x{farm?.gridSizeY} tiles</p>
        </div>

        <div className="flex gap-3">
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

      <div className="absolute inset-0 pointer-events-none">
        <TileMenu />
      </div>
    </main>
  )
}
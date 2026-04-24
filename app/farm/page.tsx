import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getGitHubData } from '@/lib/github'

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
    <main className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center">
      <div className="text-center space-y-4 max-w-2xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-[#e8c97a]">
          Bem vindo, {user.username}!
        </h1>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-[#0d0d1a] p-4 rounded-xl">
            <p className="text-[#a0a0b0] text-sm">Terreno</p>
            <p className="text-[#e8c97a] text-2xl font-bold">{farm?.gridSizeX}x{farm?.gridSizeY}</p>
          </div>
          <div className="bg-[#0d0d1a] p-4 rounded-xl">
            <p className="text-[#a0a0b0] text-sm">Energia</p>
            <p className="text-[#e8c97a] text-2xl font-bold">{stats?.dailyEnergy}</p>
          </div>
          <div className="bg-[#0d0d1a] p-4 rounded-xl">
            <p className="text-[#a0a0b0] text-sm">Streak</p>
            <p className="text-[#e8c97a] text-2xl font-bold">{stats?.streak} dias</p>
          </div>
        </div>
        <div className="bg-[#0d0d1a] p-4 rounded-xl mt-4">
          <p className="text-[#a0a0b0] text-sm mb-2">Bioma</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {stats && Object.entries(stats.languages as Record<string, number>).map(([lang]) => (
              <span key={lang} className="bg-[#2d6a4f] text-white text-sm px-3 py-1 rounded-full">
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
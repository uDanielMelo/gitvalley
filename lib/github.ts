export async function getGitHubData(accessToken: string) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
  }

  // Perfil do usuário
  const profileRes = await fetch('https://api.github.com/user', { headers })
  const profile = await profileRes.json()

  // Repositórios
  const reposRes = await fetch('https://api.github.com/user/repos?per_page=100&sort=pushed', { headers })
  const repos = await reposRes.json()

  // Eventos dos últimos 30 dias
  const eventsRes = await fetch(`https://api.github.com/users/${profile.login}/events?per_page=100`, { headers })
  const events = await eventsRes.json()

  // Followers
  const followersRes = await fetch('https://api.github.com/user/followers?per_page=100', { headers })
  const followers = await followersRes.json()

  // Following
  const followingRes = await fetch('https://api.github.com/user/following?per_page=100', { headers })
  const following = await followingRes.json()

  // Calcular commits dos últimos 30 dias via eventos
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentCommits = events.filter((e: any) =>
    e.type === 'PushEvent' &&
    new Date(e.created_at) > thirtyDaysAgo
  ).reduce((acc: number, e: any) => acc + (e.payload?.commits?.length ?? 0), 0)

  // Calcular streak
  const pushDays = new Set(
    events
      .filter((e: any) => e.type === 'PushEvent')
      .map((e: any) => new Date(e.created_at).toDateString())
  )

  let streak = 0
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    const day = new Date(today)
    day.setDate(today.getDate() - i)
    if (pushDays.has(day.toDateString())) {
      streak++
    } else {
      break
    }
  }

  // Calcular stars totais
  const totalStars = Array.isArray(repos)
    ? repos.reduce((acc: number, repo: any) => acc + repo.stargazers_count, 0)
    : 0

  // Calcular linguagens
  const languages: Record<string, number> = {}
  if (Array.isArray(repos)) {
    repos.forEach((repo: any) => {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] ?? 0) + 1
      }
    })
  }

  // Mutual follows
  const followerLogins = new Set(
    Array.isArray(followers) ? followers.map((f: any) => f.login) : []
  )
  const mutualFollows = Array.isArray(following)
    ? following.filter((f: any) => followerLogins.has(f.login)).length
    : 0

  return {
    totalRepos: profile.public_repos ?? 0,
    totalFollowers: profile.followers ?? 0,
    totalFollowing: profile.following ?? 0,
    totalStars,
    totalCommits: recentCommits,
    streak,
    languages,
    mutualFollows,
    dailyEnergy: Math.min(recentCommits, 25),
  }
}
import { auth, signIn } from '@/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect('/farm')
  }

  return (
    <main className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-[#e8c97a]">
          GitValley
        </h1>
        <p className="text-xl text-[#a0a0b0]">
          Transforme seu historico no GitHub em uma fazenda viva
        </p>
        <form action={async () => {
          'use server'
          await signIn('github', { redirectTo: '/farm' })
        }}>
          <button type="submit" className="bg-[#2d6a4f] text-white font-semibold px-8 py-4 rounded-xl text-lg">
            Conectar com GitHub
          </button>
        </form>
      </div>
    </main>
  )
}
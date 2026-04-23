import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function FarmPage() {
  const session = await auth()

  if (!session) {
    redirect('/')
  }

  return (
    <main className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-[#e8c97a]">
          Bem vindo!
        </h1>
        <p className="text-[#a0a0b0]">
          Sua fazenda esta sendo preparada...
        </p>
      </div>
    </main>
  )
}
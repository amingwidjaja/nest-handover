// app/dashboard/page.tsx
import { Card, Badge } from '@/components/ui'
import Link from 'next/link'

export default async function Dashboard() {

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/handover/list`, {
    cache: "no-store"
  })

  const handovers = await res.json()

  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50 p-4 pb-24">
      <header className="flex justify-between items-center mb-8 pt-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">NEST76</h1>
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">JD</div>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-slate-500 ml-1">Riwayat Serah Terima</h2>

        {handovers.map((item: any) => (
          <Link href={`/handover/${item.id}`} key={item.id}>
            <Card className="flex justify-between items-center active:scale-[0.98] transition-transform mb-3">
              <div>
                <p className="font-semibold text-slate-900">{item.receiver_target_name}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(item.created_at).toLocaleTimeString()} • Hari ini
                </p>
              </div>
              <Badge status={item.status} />
            </Card>
          </Link>
        ))}

      </section>

      <div className="fixed bottom-6 left-0 right-0 px-4 max-w-md mx-auto">
        <Link href="/create">
          <button className="w-full bg-slate-900 text-white py-4 rounded-2xl shadow-xl font-bold flex items-center justify-center gap-2">
            <span>+</span> Buat Serah Terima
          </button>
        </Link>
      </div>
    </main>
  )
}
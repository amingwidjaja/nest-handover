// app/handover/[id]/page.tsx
import { Card, Badge } from '@/components/ui'
import QRCode from 'react-qr-code'

export default async function HandoverDetail({ params }: { params: { id: string } }) {

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/handover/${params.id}`, {
    cache: "no-store"
  })

  const data = await res.json()

  const token = data.token
  const items = data.items || []

  return (
    <div className="max-w-md mx-auto p-6 text-center">

      <Badge status={data.status} />

      <h1 className="text-3xl font-black mt-4 mb-2">
        Siap Diserahkan
      </h1>

      <p className="text-slate-500 mb-8">
        Minta penerima untuk scan QR di bawah ini
      </p>

      <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100 inline-block mb-8">
        <QRCode
          value={`${process.env.NEXT_PUBLIC_BASE_URL}/r/${token}`}
          size={220}
          level="H"
        />
      </div>

      <Card className="text-left bg-indigo-50 border-none">

        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">
          Penerima
        </p>

        <p className="text-xl font-bold text-indigo-900">
          {data.receiver_target_name}
        </p>

        <hr className="my-3 border-indigo-100" />

        <ul className="text-indigo-800 space-y-1">
          {items.map((item: any, i: number) => (
            <li key={i}>• {item.description}</li>
          ))}
        </ul>

      </Card>

    </div>
  )
}
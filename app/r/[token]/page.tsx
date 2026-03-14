// app/r/[token]/page.tsx
'use client'

import { Button, Card } from '@/components/ui'
import { useState } from 'react'

export default function ReceivePage({ params }: { params: { token: string } }) {

  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleTerima = async () => {

    setLoading(true)

    const res = await fetch("/api/handover/receive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token: params.token
      })
    })

    if (res.ok) {
      setDone(true)
    }

    setLoading(false)
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center bg-emerald-600 text-white text-center p-6">
        <div>
          <h1 className="text-4xl font-bold mb-4">✅ Diterima</h1>
          <p>Barang sudah berhasil dikonfirmasi.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col p-6 bg-indigo-600 text-white">

      <div className="flex-1 flex flex-col justify-center">

        <div className="mb-8">
          <p className="text-indigo-200 font-medium mb-1">Konfirmasi Penerimaan</p>
          <h1 className="text-4xl font-bold">Konfirmasi Barang</h1>
        </div>

        <Card className="text-slate-900 mb-8">
          <p className="font-bold text-lg mb-4">Tekan tombol di bawah jika barang sudah diterima.</p>
        </Card>

      </div>

      <div className="pb-8">

        <Button
          onClick={handleTerima}
          disabled={loading}
          className="bg-white text-indigo-600 hover:bg-slate-50 h-20 text-2xl shadow-2xl"
        >
          {loading ? "Memproses..." : "TERIMA SEKARANG"}
        </Button>

        <p className="text-center mt-4 text-indigo-200 text-sm">
          Dengan menekan tombol, Anda menyatakan barang telah diterima dalam kondisi baik.
        </p>

      </div>

    </div>
  )
}
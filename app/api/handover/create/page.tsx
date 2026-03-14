// app/create/page.tsx
'use client'

import { useState } from 'react'
import { Button, Card } from '@/components/ui'
import { useRouter } from 'next/navigation'

export default function CreateHandover() {

  const router = useRouter()

  const [receiverName, setReceiverName] = useState("")
  const [receiverPhone, setReceiverPhone] = useState("")
  const [items, setItems] = useState([{ description: "" }])

  const addItem = () => setItems([...items, { description: "" }])

  const updateItem = (index: number, value: string) => {
    const newItems = [...items]
    newItems[index].description = value
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch("/api/handover/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sender_name: "Sender",
        receiver_target_name: receiverName,
        receiver_target_contact: receiverPhone,
        items
      })
    })

    const data = await res.json()

    router.push(`/handover/${data.token}`)
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-white min-h-screen">

      <nav className="mb-8">
        <button onClick={() => router.back()} className="text-slate-500">← Kembali</button>
        <h1 className="text-2xl font-bold mt-2">Kirim Barang</h1>
      </nav>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nama Penerima"
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 text-lg"
            required
          />

          <input
            type="tel"
            placeholder="Nomor WhatsApp (628...)"
            value={receiverPhone}
            onChange={(e) => setReceiverPhone(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 text-lg"
          />
        </div>

        <div className="space-y-3">

          <p className="font-medium text-slate-700">Daftar Barang</p>

          {items.map((item, idx) => (
            <Card key={idx} className="flex items-center gap-3">

              <input
                type="text"
                placeholder="Contoh: Paket Dokumen"
                value={item.description}
                onChange={(e) => updateItem(idx, e.target.value)}
                className="flex-1 border-none focus:ring-0 p-0 text-slate-700"
              />

              <button type="button" className="text-slate-300">📷</button>

            </Card>
          ))}

          <Button
            type="button"
            variant="secondary"
            onClick={addItem}
            className="py-2 text-sm"
          >
            + Tambah Barang Lain
          </Button>

        </div>

        <Button type="submit" className="mt-8">
          Konfirmasi & Buat QR
        </Button>

      </form>

    </div>
  )
}
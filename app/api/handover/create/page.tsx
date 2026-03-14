'use client'

import { useState } from 'react'
import { Button, Card } from '@/components/ui'
import { useRouter } from 'next/navigation'

export default function CreateHandover() {

  const router = useRouter()
  const [items, setItems] = useState([{ description: '' }])

  const addItem = () => setItems([...items, { description: '' }])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch("/api/handover/create", {
      method: "POST"
    })

    const data = await res.json()

    router.push(`/handover/${data.id}`)
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-white min-h-screen">

      <nav className="mb-8">
        <h1 className="text-2xl font-bold mt-2">Kirim Barang</h1>
      </nav>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nama Penerima"
            className="w-full p-4 bg-slate-50 rounded-xl"
            required
          />
        </div>

        <div className="space-y-3">
          <p className="font-medium text-slate-700">Daftar Barang</p>

          {items.map((item, idx) => (
            <Card key={idx}>
              <input
                type="text"
                placeholder="Contoh: Paket Dokumen"
                className="w-full"
              />
            </Card>
          ))}

          <Button type="button" variant="secondary" onClick={addItem}>
            + Tambah Barang
          </Button>

        </div>

        <Button type="submit">
          Buat QR
        </Button>

      </form>

    </div>
  )
}
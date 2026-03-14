'use client'

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

export default function ReceivePage() {

  const params = useParams()
  const token = params.token as string

  const [handover, setHandover] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const load = async () => {

      const res = await fetch(`/api/handover/by-token?token=${token}`)
      const data = await res.json()

      setHandover(data)
      setLoading(false)

    }

    load()

  }, [token])


  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!handover) {
    return <div className="p-8">Token tidak valid</div>
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] p-8">

      <h1 className="text-xl mb-6">
        Paket untuk <b>{handover.receiver_target_name}</b>
      </h1>

      <p className="mb-12 opacity-60">
        Kiriman dari {handover.sender_name || "pengirim"}
      </p>

      <button
        className="w-full py-4 bg-[#3E2723] text-white"
        onClick={async () => {

          const device_id = navigator.userAgent

          await fetch("/api/handover/receive", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              handover_id: handover.id,
              receive_method: "direct_qr",
              device_id
            })
          })

          alert("Paket berhasil diterima")

        }}
      >
        Terima Paket
      </button>

    </div>
  )
}
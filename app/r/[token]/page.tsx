"use client"

import { useEffect, useState } from "react"

export default function ReceivePage({ params }: any) {
  const token = params.token

  const [handover, setHandover] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/handover/token?token=${token}`)
  }, [])

  async function receive() {
    await fetch("/api/handover/receive", {
      method: "POST",
      body: JSON.stringify({
        token,
        receive_method: "direct_qr"
      })
    })

    alert("Barang diterima")
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>NEST76</h1>

      <p>Token: {token}</p>

      <button onClick={receive}>
        TERIMA
      </button>
    </div>
  )
}
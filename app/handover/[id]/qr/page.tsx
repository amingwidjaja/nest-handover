'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

export default function QRPage() {
  const params = useParams()
  const router = useRouter()

  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id) ? params.id[0] : ""

  const [qr, setQr] = useState<string>("")
  const [shareToken, setShareToken] = useState<string>("")

  useEffect(() => {
    if (!id) return
    async function load() {
      // Fetch share_token
      const tokenRes = await fetch(`/api/handover/by-token?id=${id}`)
      const tokenData = await tokenRes.json()
      if (!tokenData.share_token) return
      setShareToken(tokenData.share_token)

      // Read meta set by [id]/page before navigating here
      let meta: Record<string, string> = {}
      try {
        const raw = sessionStorage.getItem(`handover_${id}_meta`)
        if (raw) meta = JSON.parse(raw)
      } catch { /* ignore */ }

      // Build QR URL — pass receiver_type and delegate info as query params
      // so receive/[token] can pre-fill and skip redundant input
      const params = new URLSearchParams()
      params.set("rt", meta.mode === "delegate" ? "proxy" : "direct")
      if (meta.mode === "delegate" && meta.delegateName) {
        params.set("rn", meta.delegateName)
        params.set("rr", meta.relation || "")
      }
      if (meta.notes) params.set("notes", meta.notes)

      const qrRes = await fetch(
        `/api/handover/qr?token=${tokenData.share_token}&${params.toString()}`
      )
      const qrData = await qrRes.json()
      setQr(qrData.qr)
    }
    load()
  }, [id])

  // Poll status — redirect to /success when received/accepted
  useEffect(() => {
    if (!id) return
    let interval: ReturnType<typeof setInterval>

    async function check() {
      const res = await fetch(`/api/handover/status?id=${id}`)
      const data = await res.json()
      if (data.status === "received" || data.status === "accepted") {
        clearInterval(interval)
        router.replace(`/handover/${id}/success`)
      }
    }

    interval = setInterval(check, 2000)
    return () => clearInterval(interval)
  }, [id, router])

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">
      <main className="p-8 pt-12 text-center">
        <h2 className="text-xl font-light mb-2">Tunjukkan QR ini</h2>
        <p className="text-[11px] text-[#A1887F] mb-10">
          Minta penerima scan untuk konfirmasi
        </p>

        {qr ? (
          <img src={qr} alt="QR Code" className="mx-auto w-64 h-64" />
        ) : (
          <div className="w-64 h-64 mx-auto border border-[#E0DED7] flex items-center justify-center">
            <span className="text-xs opacity-40 animate-pulse">Memuat QR…</span>
          </div>
        )}

        <p className="text-[10px] text-[#A1887F] mt-8 leading-relaxed max-w-xs mx-auto">
          Halaman ini otomatis berpindah setelah penerima mengkonfirmasi.
        </p>
      </main>

      <div className="px-8 pb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm opacity-40"
        >
          <ChevronLeft size={16} />
          Kembali
        </button>
      </div>
    </div>
  )
}

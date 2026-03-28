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
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      const tokenRes = await fetch(`/api/handover/by-token?id=${id}`)
      const tokenData = await tokenRes.json()
      if (!tokenData.share_token) { setLoadError(true); return }
      setShareToken(tokenData.share_token)

      let meta: Record<string, string> = {}
      try {
        const raw = sessionStorage.getItem(`handover_${id}_meta`)
        if (raw) meta = JSON.parse(raw)
      } catch { /* ignore */ }

      const qrParams = new URLSearchParams()
      qrParams.set("rt", meta.mode === "delegate" ? "proxy" : "direct")
      if (meta.mode === "delegate" && meta.delegateName) {
        qrParams.set("rn", meta.delegateName)
        qrParams.set("rr", meta.relation || "")
      }
      if (meta.notes) qrParams.set("notes", meta.notes)

      const qrRes = await fetch(`/api/handover/qr?token=${tokenData.share_token}&${qrParams.toString()}`)
      const qrData = await qrRes.json()
      setQr(qrData.qr)
    }
    load()
  }, [id])

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
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center">

        {/* Label */}
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A1887F] mb-3">
          NEST76 PAKET
        </p>

        <h2 className="text-2xl font-light tracking-tight mb-2">
          Tunjukkan QR ini
        </h2>
        <p className="text-[12px] text-[#A1887F] mb-10 leading-relaxed">
          Minta penerima scan untuk konfirmasi penerimaan
        </p>

        {/* QR Box */}
        <div className="w-64 h-64 mx-auto border border-[#E0DED7] rounded-sm overflow-hidden flex items-center justify-center bg-white">
          {loadError ? (
            <span className="text-[11px] text-red-800 text-center px-6 leading-relaxed">
              Dokumen tidak ditemukan atau sudah kadaluarsa.
            </span>
          ) : qr ? (
            <img src={qr} alt="QR Code" className="w-full h-full object-contain p-3" />
          ) : (
            <span className="text-[11px] text-[#A1887F] animate-pulse">Memuat QR…</span>
          )}
        </div>

        <p className="text-[10px] text-[#A1887F] mt-8 leading-relaxed max-w-[240px]">
          Halaman ini otomatis berpindah setelah penerima mengkonfirmasi.
        </p>

      </main>

      {/* Footer nav */}
      <div className="px-8 pb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[12px] text-[#A1887F] active:scale-[0.97] transition-transform"
        >
          <ChevronLeft size={14} strokeWidth={2} />
          Kembali
        </button>
      </div>
    </div>
  )
}

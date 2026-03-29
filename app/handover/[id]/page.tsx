'use client'

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { QrCode, Camera } from "lucide-react"
import { compressEvidenceWebpUnder100kb } from "@/lib/image-evidence"
import { resolveEvidencePhotoUrl } from "@/lib/nest-evidence-upload"
import { PhotoPreviewModal } from "@/components/nest/photo-preview-modal"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { StudioHeader } from "@/components/nest/studio-header"
import { StudioFooter } from "@/components/nest/studio-footer"

interface GpsCoords {
  lat: number
  lng: number
  accuracy: number
}

export default function HandoverPage() {
  const params = useParams()
  const router = useRouter()

  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id) ? params.id[0] : ""

  const [mode, setMode] = useState("direct")
  const [delegateName, setDelegateName] = useState("")
  const [relation, setRelation] = useState("")
  const [notes, setNotes] = useState("")
  const [processingCapture, setProcessingCapture] = useState(false)
  const [handover, setHandover] = useState<any>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null)

  const gpsRef = useRef<GpsCoords | null>(null)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    load()
    startSilentGps()
    return () => stopSilentGps()
  }, [])

  async function load() {
    const res = await fetch(`/api/handover/detail?id=${id}`)
    const data = await res.json()
    setHandover(data)
  }

  function startSilentGps() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        gpsRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }
        try { sessionStorage.setItem(`handover_${id}_gps`, JSON.stringify(gpsRef.current)) } catch { /* ignore */ }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  function stopSilentGps() {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
  }

  function handleQR() {
    if (mode === "delegate") {
      if (!delegateName.trim() || !relation.trim()) {
        alert("Nama wakil & hubungan wajib diisi sebelum menampilkan QR")
        return
      }
    }
    sessionStorage.setItem(`handover_${id}_meta`, JSON.stringify({ mode, delegateName, relation, notes }))
    router.push(`/handover/${id}/qr`)
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    const file = e.target.files[0]
    e.target.value = ""
    if (mode === "delegate" && (!delegateName.trim() || !relation.trim())) {
      alert("Nama wakil & hubungan wajib diisi")
      return
    }
    const rawUrl = URL.createObjectURL(file)
    setPendingFile(file)
    setPendingPreviewUrl(rawUrl)
  }

  async function confirmPhoto() {
    if (!pendingFile) return
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl)
    setPendingPreviewUrl(null)
    const file = pendingFile
    setPendingFile(null)
    setProcessingCapture(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push(`/login?redirect=${encodeURIComponent(`/handover/${id}`)}`); return }

      const compressed = await compressEvidenceWebpUnder100kb(file)
      const ext = compressed.type.includes("webp") ? "webp" : "jpg"
      const proofFile = new File([compressed], `bukti.${ext}`, { type: compressed.type })
      const storagePath = await uploadWithProgress(proofFile, id, session.access_token)

      const receiver_type = mode === "direct" ? "direct" : "proxy"
      let gps: GpsCoords | null = null
      try { const raw = sessionStorage.getItem(`handover_${id}_gps`); if (raw) gps = JSON.parse(raw) } catch { /* ignore */ }

      const res = await fetch("/api/handover/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handover_id: id,
          receive_method: mode === "direct" ? "direct_photo" : "proxy_photo",
          receiver_type,
          receiver_name: mode === "direct" ? "" : delegateName,
          receiver_relation: mode === "direct" ? "" : relation,
          notes: notes || "",
          photo_url: storagePath,
          gps_lat: gps?.lat ?? null,
          gps_lng: gps?.lng ?? null,
          gps_accuracy: gps?.accuracy ?? null,
        }),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.error || "Gagal menyimpan")
      sessionStorage.removeItem(`handover_${id}_gps`)
      router.replace(`/handover/${id}/success`)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memproses foto")
    } finally {
      setProcessingCapture(false)
    }
  }

  async function uploadWithProgress(file: File, handoverId: string, accessToken: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const fd = new FormData()
      fd.set("handover_id", handoverId)
      fd.set("mode", "proof_only")
      fd.set("file", file)
      const xhr = new XMLHttpRequest()
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText)
            if (json.storagePath) resolve(json.storagePath)
            else reject(new Error(json.error || "Upload gagal"))
          } catch { reject(new Error("Respons server tidak valid")) }
        } else { reject(new Error(`Upload gagal (${xhr.status})`)) }
      })
      xhr.addEventListener("error", () => reject(new Error("Koneksi terputus")))
      xhr.timeout = 30000
      xhr.open("POST", "/api/handover/upload-photo")
      xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`)
      xhr.send(fd)
    })
  }

  function retakePhoto() {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl)
    setPendingPreviewUrl(null)
    setPendingFile(null)
    document.getElementById("handoverCameraInput")?.click()
  }

  // Foto hanya dari item pertama
  const firstItemPhoto = handover?.handover_items?.[0]?.photo_url
    ? resolveEvidencePhotoUrl(handover.handover_items[0].photo_url)
    : null

  // Alamat lengkap
  const addrParts = [
    handover?.destination_address,
    handover?.destination_district,
    handover?.destination_city,
    handover?.destination_postal_code,
  ].map((s: any) => String(s ?? "").trim()).filter(Boolean)
  const fullAddress = addrParts.join(", ")

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col">
      <StudioHeader />

      <style jsx global>{`
        input, textarea { font-size: 16px !important; }
      `}</style>

      {processingCapture && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#FAF9F6]/80 backdrop-blur-[1px]">
          <span className="text-sm font-medium text-[#3E2723] animate-pulse">Memproses foto…</span>
        </div>
      )}

      <main className="mx-auto w-full max-w-lg flex-1 px-6 pt-24 pb-44 sm:px-8 space-y-8">

        {/* Judul */}
        <div className="space-y-0.5">
          <h1 className="text-2xl font-light tracking-tight">Tanda Terima</h1>
          {handover?.serial_number && (
            <p className="text-[11px] font-mono text-[#A1887F] tracking-tight">{handover.serial_number}</p>
          )}
        </div>

        {/* Pengirim & Penerima */}
        {handover && (
          <section className="space-y-4">
            {/* Pengirim */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A1887F]">Pengirim</p>
              <p className="text-base font-medium">{handover.sender_name || "-"}</p>
              {handover.sender_whatsapp && (
                <p className="text-sm text-[#7D6E68]">{handover.sender_whatsapp}</p>
              )}
            </div>

            <div className="border-t border-[#E0DED7]" />

            {/* Penerima */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A1887F]">Penerima</p>
              <p className="text-base font-medium">{handover.receiver_target_name || "-"}</p>
              {handover.receiver_whatsapp && (
                <p className="text-sm text-[#7D6E68]">{handover.receiver_whatsapp}</p>
              )}
              {fullAddress && (
                <p className="text-sm text-[#7D6E68] leading-relaxed">{fullAddress}</p>
              )}
            </div>
          </section>
        )}

        {/* Daftar Barang */}
        {handover?.handover_items?.length > 0 && (
          <section className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A1887F]">Daftar Barang</p>

            {/* Foto barang — hanya 1 dari item pertama */}
            {firstItemPhoto && (
              <div className="w-full aspect-square rounded-xl overflow-hidden border border-[#E0DED7]">
                <img src={firstItemPhoto} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            {/* List nama barang */}
            <div className="space-y-0">
              {handover.handover_items.map((item: any, i: number) => (
                <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-[#E0DED7]">
                  <span className="text-[12px] tabular-nums text-[#A1887F] w-5 text-right shrink-0">{i + 1}.</span>
                  <span className="text-sm">{item.description || "-"}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {handover?.notes && (
          <section className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A1887F]">Catatan</p>
            <p className="text-sm leading-relaxed text-[#5D4037]">{handover.notes}</p>
          </section>
        )}

        {/* Mode serah terima */}
        <section className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A1887F]">Cara Serah Terima</p>

          <div className="flex border-b border-[#E0DED7]">
            {(["direct", "delegate"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 pb-2.5 text-sm font-medium transition-colors
                  ${mode === m ? "border-b-2 border-[#3E2723] text-[#3E2723] -mb-px" : "text-[#A1887F]"}`}
              >
                {m === "direct" ? "Langsung" : "Diwakilkan"}
              </button>
            ))}
          </div>

          {mode === "delegate" && (
            <div className="space-y-4">
              <input
                placeholder="Nama wakil"
                value={delegateName}
                onChange={(e) => setDelegateName(e.target.value)}
                className="w-full border-b border-[#E0DED7] py-2 outline-none text-sm bg-transparent"
              />
              <input
                placeholder="Hubungan dengan penerima"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="w-full border-b border-[#E0DED7] py-2 outline-none text-sm bg-transparent"
              />
            </div>
          )}

          <textarea
            placeholder="Catatan serah terima (opsional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border-b border-[#E0DED7] py-2 outline-none text-sm bg-transparent resize-none"
            rows={2}
          />
        </section>

        {/* QR + Foto */}
        <section className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A1887F]">Konfirmasi Penerimaan</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleQR}
              className="aspect-square border border-[#E0DED7] flex flex-col items-center justify-center rounded-xl active:scale-[0.97] transition-transform gap-2"
            >
              <QrCode size={28} strokeWidth={1.5} />
              <span className="text-[11px] font-medium">QR Code</span>
            </button>

            <label className="aspect-square border border-[#E0DED7] flex flex-col items-center justify-center rounded-xl cursor-pointer active:scale-[0.97] transition-transform gap-2">
              <Camera size={28} strokeWidth={1.5} />
              <span className="text-[11px] font-medium">Foto Bukti</span>
              <input
                id="handoverCameraInput"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                disabled={processingCapture}
                onChange={handlePhoto}
              />
            </label>
          </div>
        </section>

        <button
          onClick={() => router.back()}
          className="w-full py-3 rounded-xl border border-[#E0DED7] text-sm text-[#A1887F] active:scale-[0.97] transition-transform"
        >
          ← Kembali
        </button>
      </main>

      <StudioFooter />

      {pendingPreviewUrl && (
        <PhotoPreviewModal
          previewUrl={pendingPreviewUrl}
          onConfirm={confirmPhoto}
          onRetake={retakePhoto}
        />
      )}
    </div>
  )
}

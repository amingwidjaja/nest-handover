'use client'

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { QrCode, Camera } from "lucide-react"
import {
  blobToDataUrl,
  compressEvidenceWebpUnder100kb
} from "@/lib/image-evidence"
import { resolveEvidencePhotoUrl } from "@/lib/nest-evidence-upload"
import { PhotoPreviewModal } from "@/components/nest/photo-preview-modal"

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

  // GPS silent background
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
        gpsRef.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }
        try {
          sessionStorage.setItem(
            `handover_${id}_gps`,
            JSON.stringify(gpsRef.current)
          )
        } catch { /* ignore */ }
      },
      () => { /* silent */ },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  function stopSilentGps() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }

  // Save meta to sessionStorage then navigate to QR page
  function handleQR() {
    if (mode === "delegate") {
      if (!delegateName.trim() || !relation.trim()) {
        alert("Nama wakil & hubungan wajib diisi sebelum menampilkan QR")
        return
      }
    }

    sessionStorage.setItem(
      `handover_${id}_meta`,
      JSON.stringify({ mode, delegateName, relation, notes })
    )

    router.push(`/handover/${id}/qr`)
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    const file = e.target.files[0]
    e.target.value = ""

    if (mode === "delegate") {
      if (!delegateName.trim() || !relation.trim()) {
        alert("Nama wakil & hubungan wajib diisi")
        return
      }
    }

    // Tampilkan preview dulu
    const rawUrl = URL.createObjectURL(file)
    setPendingFile(file)
    setPendingPreviewUrl(rawUrl)
  }

  async function confirmPhoto() {
    if (!pendingFile) return
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl)
    setPendingPreviewUrl(null)
    setPendingFile(null)

    setProcessingCapture(true)
    await new Promise<void>((r) => setTimeout(r, 0))

    try {
      const compressed = await compressEvidenceWebpUnder100kb(pendingFile)
      const dataUrl = await blobToDataUrl(compressed)

      sessionStorage.setItem(`handover_${id}_photo`, dataUrl)
      sessionStorage.setItem(
        `handover_${id}_meta`,
        JSON.stringify({ mode, delegateName, relation, notes })
      )

      router.replace(`/handover/${id}/preview`)
    } catch (err) {
      console.error(err)
      alert("Gagal memproses foto")
    } finally {
      setProcessingCapture(false)
    }
  }

  function retakePhoto() {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl)
    setPendingPreviewUrl(null)
    setPendingFile(null)
    document.getElementById("handoverCameraInput")?.click()
  }

  return (
    <div className="min-h-full bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between relative">

      {processingCapture && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#FAF9F6]/80 backdrop-blur-[1px]">
          <span className="text-sm font-medium text-[#3E2723] animate-pulse">
            Memproses foto…
          </span>
        </div>
      )}

      <main className="p-6 pt-6">
        <h2 className="text-2xl font-medium mb-1">Tanda Terima</h2>

        {handover?.serial_number && (
          <p className="text-sm font-mono text-[#5D4037] mb-4 tracking-tight">
            No. Tanda Terima Digital:{" "}
            <span className="font-semibold">{handover.serial_number}</span>
          </p>
        )}

        {handover && (
          <div className="space-y-1 mb-6 text-base">
            <div>
              <span className="opacity-50">Pengirim paket: </span>
              <span className="font-medium">{handover.sender_name || "-"}</span>
            </div>
            <div>
              <span className="opacity-50">Penerima paket: </span>
              <span className="font-medium">{handover.receiver_target_name || "-"}</span>
            </div>
          </div>
        )}

        {handover?.handover_items?.length > 0 && (
          <div className="space-y-3 mb-8">
            {handover.handover_items.map((item: any) => (
              <div key={item.id} className="flex gap-3 items-stretch">
                <div className="aspect-square w-26 border border-[#E0DED7] rounded-sm overflow-hidden flex-shrink-0">
                  {(() => {
                    const src = resolveEvidencePhotoUrl(item.photo_url)
                    return src ? (
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    ) : null
                  })()}
                </div>
                <div className="flex-1 border border-[#E0DED7] rounded-sm px-3 py-2">
                  <span className="text-sm opacity-50 mb-1 block">Detail paket:</span>
                  <span className="text-base">{item.description || "-"}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mode tabs */}
        <div className="flex gap-6 mb-6 border-b border-[#E0DED7] pb-3">
          <button
            onClick={() => setMode("direct")}
            className={`text-base pb-3 -mb-[14px] ${
              mode === "direct" ? "font-medium border-b-2 border-[#3E2723]" : "opacity-40"
            }`}
          >
            Penerima Langsung
          </button>
          <button
            onClick={() => setMode("delegate")}
            className={`text-base pb-3 -mb-[14px] ${
              mode === "delegate" ? "font-medium border-b-2 border-[#3E2723]" : "opacity-40"
            }`}
          >
            Diwakilkan
          </button>
        </div>

        {mode === "delegate" && (
          <div className="space-y-4 mb-6">
            <input
              placeholder="Nama wakil:"
              value={delegateName}
              onChange={(e) => setDelegateName(e.target.value)}
              className="w-full border-b border-[#E0DED7] py-2 outline-none"
            />
            <input
              placeholder="Hubungan:"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="w-full border-b border-[#E0DED7] py-2 outline-none"
            />
          </div>
        )}

        <textarea
          placeholder="Catatan (opsional):"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border-b border-[#E0DED7] py-2 outline-none mb-6 text-base"
        />

        {/* QR + Photo — both save meta first */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={handleQR}
            className="w-[85%] aspect-square border border-[#E0DED7] flex flex-col items-center justify-center rounded-xl shadow-md active:scale-[0.97] transition-transform"
          >
            <QrCode size={26} className="mb-2" />
            <span className="text-[10px]">QR</span>
          </button>

          <label className="w-[85%] aspect-square border border-[#E0DED7] flex flex-col items-center justify-center rounded-xl shadow-md cursor-pointer active:scale-[0.97] transition-transform">
            <Camera size={26} className="mb-2" />
            <span className="text-[10px]">Foto</span>
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
      </main>

      <div className="px-6 pb-6">
        <button
          onClick={() => router.back()}
          className="w-full py-3 rounded-xl border border-[#E0DED7] shadow-md"
        >
          Kembali
        </button>
      </div>

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

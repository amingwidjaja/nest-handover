'use client'

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Camera, Home, ChevronRight, ChevronLeft, User } from "lucide-react"
import Link from "next/link"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { compressEvidenceWebpUnder100kb } from "@/lib/image-evidence"
import { NEST_EVIDENCE_BUCKET } from "@/lib/nest-evidence-upload"

export default function PackagePage() {
  const router = useRouter()

// FORCE DISABLE ZOOM (Pemicu Utama Safari)
  useEffect(() => {
    // Cari meta viewport yang sudah ada
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      // Tambahkan user-scalable=no secara paksa
      meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
    }
  }, []);

  /** Exactly 4 baris = 4 tipe barang (boleh kosong kecuali minimal satu terisi). */
  const [items, setItems] = useState(["", "", "", ""])
  /** Compressed binary for upload — no base64 in multipart body. */
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const [photoProcessing, setPhotoProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [limitHint, setLimitHint] = useState<string | null>(null)

  useEffect(() => {
    async function loadLimits() {
      const res = await fetch("/api/handover/limits")
      if (!res.ok) return
      const j = await res.json()
      if (j.authenticated && typeof j.remaining === "number") {
        setLimitHint(`${j.remaining}/${j.limit} paket aktif`)
      }
    }
    loadLimits()
  }, [])

  function handleItemChange(index: number, value: string) {
    const copy = [...items]
    copy[index] = value
    setItems(copy)
  }

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  async function handlePhoto(file: File) {
    setPhotoProcessing(true)
    await new Promise<void>((r) => setTimeout(r, 0))
    try {
      const cropped = await compressEvidenceWebpUnder100kb(file)
      setPhotoBlob(cropped)
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
      const url = URL.createObjectURL(cropped)
      previewUrlRef.current = url
      setPreviewUrl(url)
    } catch (err) {
      console.error("UPLOAD_DEBUG:", err)
      alert("Gagal memproses foto")
    } finally {
      setPhotoProcessing(false)
    }
  }

  async function createHandover(mode: "save" | "handover") {
    if (!items[0].trim()) {
      alert("Minimal isi 1 barang")
      return
    }
    if (saving) return
    setSaving(true)

    const supabase = createBrowserSupabaseClient()
    const {
      data: { session }
    } = await supabase.auth.getSession()
    if (!session) {
      setSaving(false)
      router.push("/login?redirect=/package")
      return
    }

    const lim = await fetch("/api/handover/limits")
    const limJson = await lim.json()
    if (limJson.authenticated && limJson.at_limit) {
      setSaving(false)
      alert(limJson.error || "Batas paket aktif tercapai.")
      return
    }

    const sender_name = localStorage.getItem("draft_sender_name") || ""
    const receiver_target_name = localStorage.getItem("draft_receiver_name") || ""
    const receiver_target_phone = localStorage.getItem("draft_receiver_contact") || ""

    if (!sender_name || !receiver_target_name) {
      alert("Data belum lengkap. Mulai dari awal.")
      router.push("/handover/create")
      return
    }

    const destination_address = localStorage.getItem("draft_destination_address") || ""
    const destLatRaw = localStorage.getItem("draft_destination_lat")
    const destLngRaw = localStorage.getItem("draft_destination_lng")
    const draftCity = localStorage.getItem("draft_destination_city") || ""
    const draftPostcode = localStorage.getItem("draft_destination_postcode") || ""

    const descriptions = items.map((i) => i.trim()).filter(Boolean)
    const itemRows = descriptions.map((description) => ({
      description,
      photo_url: null as string | null
    }))

    const payload: Record<string, unknown> = {
      sender_name,
      receiver_target_name,
      receiver_target_phone,
      receiver_target_email: "",
      items: itemRows
    }

    if (destination_address.trim()) {
      payload.destination_address = destination_address
    }
    if (destLatRaw != null && destLatRaw !== "" && destLngRaw != null && destLngRaw !== "") {
      const dlat = Number(destLatRaw)
      const dlng = Number(destLngRaw)
      if (Number.isFinite(dlat) && Number.isFinite(dlng)) {
        payload.destination_lat = dlat
        payload.destination_lng = dlng
      }
    }
    if (draftCity.trim()) {
      payload.destination_city = draftCity.trim()
    }
    if (draftPostcode.trim()) {
      payload.destination_postal_code = draftPostcode.trim()
    }

    try {
      const res = await fetch("/api/handover/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.status === 401) {
        setSaving(false)
        router.push("/login?redirect=/package")
        return
      }
      if (res.status === 429) {
        setSaving(false)
        alert(data.error || "Batas paket tercapai")
        return
      }
      if (!data.success) {
        setSaving(false)
        alert(data.error || "Gagal membuat Tanda Terima Digital")
        return
      }

      if (photoBlob && data.handover_id && session.access_token) {
        try {
          const ext = photoBlob.type.includes("webp") ? "webp" : "jpg"
          const uploadFile = new File([photoBlob], `package.${ext}`, {
            type: photoBlob.type || "image/webp"
          })
          const fd = new FormData()
          fd.set("handover_id", data.handover_id)
          fd.set("mode", "package_first_item")
          fd.set("file", uploadFile, `package.${ext}`)

          const up = await fetch("/api/handover/upload-photo", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`
            },
            body: fd
          })
          const upJson = (await up.json().catch(() => ({}))) as {
            error?: string
            detail?: string
          }
          if (!up.ok) {
            console.error("UPLOAD_DEBUG:", upJson)
            throw new Error(
              upJson.error || upJson.detail || `Upload HTTP ${up.status}`
            )
          }
        } catch (err) {
          console.error("UPLOAD_DEBUG:", err)
          setSaving(false)
          alert(
            `Gagal mengunggah foto paket (bucket: ${NEST_EVIDENCE_BUCKET}). ${
              err instanceof Error ? err.message : ""
            }`
          )
          return
        }
      }

      localStorage.removeItem("draft_sender_name")
      localStorage.removeItem("draft_sender_contact")
      localStorage.removeItem("draft_receiver_name")
      localStorage.removeItem("draft_receiver_contact")
      localStorage.removeItem("draft_destination_address")
      localStorage.removeItem("draft_destination_lat")
      localStorage.removeItem("draft_destination_lng")
      localStorage.removeItem("draft_destination_city")
      localStorage.removeItem("draft_destination_postcode")

      const sn = typeof data.serial_number === "string" ? data.serial_number : ""
      router.push(
        mode === "save"
          ? sn
            ? `/paket?sn=${encodeURIComponent(sn)}`
            : "/paket"
          : `/handover/${data.handover_id}`
      )
    } catch (err) {
      console.error("UPLOAD_DEBUG:", err)
      setSaving(false)
      alert("Terjadi kesalahan koneksi")
    }
  }

  return (
    <div className="h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col overflow-hidden font-sans">
      
      {/* ANTI-ZOOM FIX: Kita tambahkan style global khusus di page ini */}
      <style jsx global>{`
        /* Mencegah zoom otomatis di iOS Safari tapi tetap menjaga visual font kecil */
        input, textarea {
          font-size: 16px !important;
        }
        @media screen and (max-width: 768px) {
          .line-input {
            font-size: 14px !important; /* Visual tetap 14px, tapi sistem 'dibohongi' */
            transform: scale(1);
          }
        }
      `}</style>

      <main className="px-8 py-6 flex-1 flex flex-col max-w-md mx-auto w-full">
        
        {/* HEADER */}
        <div className="flex justify-between items-start mb-4 gap-2">
          <div>
            <h2 className="text-lg font-medium uppercase tracking-[0.2em] opacity-60">
              Daftar Barang
            </h2>
            {limitHint && (
              <p className="text-[9px] text-[#A1887F] mt-1 tracking-wide">{limitHint}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/profile" className="p-1 active:scale-90 transition-transform" title="Profil">
              <User size={20} strokeWidth={1.5} className="opacity-60" />
            </Link>
            <Link href="/paket" className="p-1 active:scale-90 transition-transform">
              <Home size={20} strokeWidth={1.5} className="opacity-60" />
            </Link>
          </div>
        </div>

        {/* ITEMS — tepat 4 baris, 1 baris = 1 tipe barang */}
        <div className="space-y-2 mb-4">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span
                className="shrink-0 w-5 pt-2 text-[13px] opacity-45 font-medium tabular-nums text-right"
                aria-hidden
              >
                {i + 1}.
              </span>
              <textarea
                value={item}
                onChange={(e) => handleItemChange(i, e.target.value)}
                className="min-h-0 flex-1 w-full bg-transparent border-b border-[#E0DED7] focus:border-[#3E2723] outline-none py-2 text-[14px] resize-none placeholder:opacity-35 transition-all leading-tight line-input"
                rows={1}
                placeholder={i === 0 ? "Contoh: Sepatu" : `Barang ${i + 1}`}
              />
            </div>
          ))}
        </div>

        {/* PHOTO AREA */}
        <div className="flex-1 flex flex-col min-h-0 mb-6">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#9A8F88] mb-2">
            Photo Produk
          </p>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            id="cameraInput"
            className="hidden"
            disabled={photoProcessing}
            onChange={(e) => {
              if (!e.target.files) return
              handlePhoto(e.target.files[0])
            }}
          />

          {!previewUrl ? (
            <div className="relative w-full flex-1 min-h-[140px]">
              <label
                htmlFor="cameraInput"
                className={`w-full h-full min-h-[140px] border border-dashed border-[#E0DED7] flex flex-col items-center justify-center rounded-sm bg-white/30 active:bg-[#F2F1ED] transition-colors ${photoProcessing ? "pointer-events-none opacity-60" : ""}`}
              >
                <Camera className="text-[#A1887F] mb-2" size={24} strokeWidth={1.5} />
                <span className="text-[9px] text-[#A1887F] uppercase tracking-[0.3em] font-bold">
                  Ambil Foto Paket
                </span>
              </label>
              {photoProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-sm bg-[#FAF9F6]/80 backdrop-blur-[1px]">
                  <span className="text-[10px] font-medium tracking-wide text-[#3E2723] animate-pulse">
                    Memproses…
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="relative flex-1 min-h-0 group">
              <img
                src={previewUrl}
                alt=""
                className="w-full h-full object-cover rounded-sm border border-[#E0DED7] shadow-sm"
              />
              {photoProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-sm bg-[#FAF9F6]/75 backdrop-blur-[2px]">
                  <span className="text-[10px] font-medium tracking-wide text-[#3E2723] animate-pulse">
                    Memproses…
                  </span>
                </div>
              )}
              <label
                htmlFor="cameraInput"
                className={`absolute bottom-3 right-3 bg-white/90 backdrop-blur px-3 py-2 rounded-sm text-[8px] uppercase tracking-[0.2em] font-bold shadow-sm border border-[#E0DED7] active:scale-95 transition-transform ${photoProcessing ? "pointer-events-none opacity-50" : ""}`}
              >
                Ganti Foto
              </label>
            </div>
          )}
        </div>

        {/* BALANCED ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-3 mb-2">
          
          <button
            onClick={() => createHandover("save")}
            disabled={saving || photoProcessing}
            className="border border-[#E0DED7] text-[#3E2723] py-4 px-5 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] flex justify-between items-center active:bg-zinc-50 transition-all disabled:opacity-30"
          >
            <ChevronLeft size={14} />
            <span>Simpan Draft</span>
          </button>

          <button
            onClick={() => createHandover("handover")}
            disabled={saving || photoProcessing}
            className="bg-[#3E2723] text-[#FAF9F6] py-4 px-5 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] flex justify-between items-center shadow-md active:scale-[0.97] transition-all disabled:opacity-50"
          >
            <span>Tanda Terima</span>
            <ChevronRight size={14} />
          </button>

        </div>

      </main>
    </div>
  )
}
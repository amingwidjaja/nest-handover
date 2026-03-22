'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Home, ArrowRight, Save, Loader2 } from "lucide-react"
import imageCompression from "browser-image-compression"
import Link from "next/link"

export default function PackagePage() {
  const router = useRouter()
  
  // Kita kurangi baris barang menjadi 2 agar lebih compact
  const [items, setItems] = useState(["", ""])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function handleItemChange(index: number, value: string) {
    const copy = [...items]
    copy[index] = value
    setItems(copy)
  }

  async function handlePhoto(file: File) {
    const options = {
      maxSizeMB: 0.6,
      maxWidthOrHeight: 1600,
      useWebWorker: true
    }
    try {
      const compressed = await imageCompression(file, options)
      if (preview) URL.revokeObjectURL(preview)
      setPhotoFile(compressed)
      setPreview(URL.createObjectURL(compressed))
    } catch (err) {
      console.error("Gagal kompres foto")
    }
  }

  async function createHandover(mode: "save" | "handover") {
    if (!items[0].trim()) {
      alert("Mohon isi deskripsi barang utama.")
      return
    }

    if (saving) return
    setSaving(true)

    const sender_name = localStorage.getItem("draft_sender_name") || ""
    const receiver_target_name = localStorage.getItem("draft_receiver_name") || ""
    const receiver_target_phone = localStorage.getItem("draft_receiver_contact") || ""

    if (!sender_name || !receiver_target_name) {
      alert("Data pengirim/penerima hilang. Kembali ke awal.")
      router.push("/create")
      return
    }

    const payload = {
      sender_name,
      receiver_target_name,
      receiver_target_phone,
      receiver_target_email: "",
      items: items
        .filter(i => i.trim() !== "")
        .map(i => ({ description: i }))
    }

    try {
      const res = await fetch("/api/handover/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!data.success) {
        setSaving(false)
        alert("Gagal memproses.")
        return
      }

      localStorage.removeItem("draft_sender_name")
      localStorage.removeItem("draft_sender_contact")
      localStorage.removeItem("draft_receiver_name")
      localStorage.removeItem("draft_receiver_contact")

      router.push(mode === "save" ? "/paket" : `/handover/${data.handover_id}`)
    } catch {
      setSaving(false)
      alert("Gangguan koneksi")
    }
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col font-sans">
      <main className="p-8 max-w-md mx-auto w-full flex-1 flex flex-col">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <div className="space-y-1">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--accent-light)]">
              Step 02 / Barang
            </h2>
            <h1 className="text-xl font-light italic uppercase tracking-tighter">Isi Paket</h1>
          </div>
          <Link href="/paket" className="p-2 bg-white rounded-full border border-[var(--line)] shadow-sm active:scale-90 transition-transform">
            <Home size={18} strokeWidth={1.5} />
          </Link>
        </div>

        {/* ITEMS INPUT (Refined to 2 Rows) */}
        <div className="space-y-4 mb-10">
          {items.map((item, i) => (
            <div key={i} className="relative group">
               <span className="absolute -left-4 top-2 text-[8px] font-mono opacity-30 italic">0{i+1}</span>
               <textarea
                value={item}
                onChange={(e) => handleItemChange(i, e.target.value)}
                className="w-full bg-transparent border-b border-[var(--line)] focus:border-[var(--ink)] outline-none py-2 text-sm resize-none placeholder:text-[var(--accent-light)] placeholder:opacity-50 transition-colors"
                rows={2}
                placeholder={i === 0 ? "Deskripsi barang utama..." : "Tambahan (opsional)..."}
              />
            </div>
          ))}
        </div>

        {/* PHOTO AREA */}
        <div className="flex-1">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            id="cameraInput"
            className="hidden"
            onChange={(e) => {
              if (!e.target.files?.[0]) return
              handlePhoto(e.target.files[0])
            }}
          />

          {!preview ? (
            <label
              htmlFor="cameraInput"
              className="w-full aspect-[4/3] border border-dashed border-[var(--line)] flex flex-col items-center justify-center rounded-sm bg-white/50 active:bg-[#F2F1ED] transition-colors cursor-pointer group"
            >
              <div className="p-4 bg-[var(--paper)] rounded-full border border-[var(--line)] group-active:scale-90 transition-transform mb-3">
                <Camera className="text-[var(--accent-light)]" size={24} strokeWidth={1.5} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-light)]">Ambil Foto Paket</span>
            </label>
          ) : (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-sm border border-[var(--line)] shadow-sm">
                <img src={preview} className="w-full object-cover max-h-[300px]" alt="Preview" />
              </div>
              <label htmlFor="cameraInput" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-light)] cursor-pointer active:opacity-50">
                <RotateCcw size={12} /> Ambil Ulang
              </label>
            </div>
          )}
        </div>

        {/* NEW ACTION BUTTONS (Muji Style Blocking) */}
        <div className="mt-12 space-y-3">
          <button
            onClick={() => createHandover("handover")}
            disabled={saving}
            className="w-full bg-[var(--ink)] text-[var(--paper)] py-5 text-[10px] font-bold uppercase tracking-[0.3em] flex justify-between items-center px-8 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="animate-spin mx-auto" size={16} />
            ) : (
              <>
                Lanjut Serah Terima
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <button
            onClick={() => createHandover("save")}
            disabled={saving}
            className="w-full border border-[var(--line)] text-[var(--ink)] py-4 text-[10px] font-bold uppercase tracking-[0.3em] flex justify-center items-center gap-2 active:bg-zinc-50 transition-colors"
          >
            <Save size={14} />
            Simpan Draft
          </button>
        </div>

      </main>
    </div>
  )
}

// Icon helper for "Ambil Ulang"
function RotateCcw({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}
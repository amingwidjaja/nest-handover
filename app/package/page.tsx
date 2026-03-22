'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Home, ChevronRight, ChevronLeft } from "lucide-react"
import imageCompression from "browser-image-compression"
import Link from "next/link"

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

  // Ditambah jadi 3 baris sesuai request
  const [items, setItems] = useState(["", "", ""])
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
      maxWidthOrHeight: 1200,
      useWebWorker: true
    }
    const compressed = await imageCompression(file, options)
    if (preview) URL.revokeObjectURL(preview)
    setPhotoFile(compressed)
    setPreview(URL.createObjectURL(compressed))
  }

  async function createHandover(mode: "save" | "handover") {
    if (!items[0].trim()) {
      alert("Minimal isi 1 barang")
      return
    }
    if (saving) return
    setSaving(true)

    const sender_name = localStorage.getItem("draft_sender_name") || ""
    const receiver_target_name = localStorage.getItem("draft_receiver_name") || ""
    const receiver_target_phone = localStorage.getItem("draft_receiver_contact") || ""

    if (!sender_name || !receiver_target_name) {
      alert("Data belum lengkap. Mulai dari awal.")
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
        alert("Gagal membuat handover")
        return
      }
      localStorage.removeItem("draft_sender_name")
      localStorage.removeItem("draft_sender_contact")
      localStorage.removeItem("draft_receiver_name")
      localStorage.removeItem("draft_receiver_contact")

      router.push(mode === "save" ? "/paket" : `/handover/${data.handover_id}`)
    } catch {
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
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-medium uppercase tracking-[0.2em] opacity-60">
            Daftar Barang
          </h2>
          <Link href="/paket" className="p-1 active:scale-90 transition-transform">
            <Home size={20} strokeWidth={1.5} className="opacity-60" />
          </Link>
        </div>

        {/* ITEMS - 3 Rows Compact */}
        <div className="space-y-0 mb-4">
          {items.map((item, i) => (
            <textarea
              key={i}
              value={item}
              onChange={(e) => handleItemChange(i, e.target.value)}
              className="w-full bg-transparent border-b border-[#E0DED7] focus:border-[#3E2723] outline-none py-2 text-[14px] resize-none placeholder:opacity-20 transition-all leading-tight line-input"
              rows={1}
              placeholder={i === 0 ? "Ketik nama barang utama..." : `Barang tambahan ${i+1}`}
            />
          ))}
        </div>

        {/* PHOTO AREA */}
        <div className="flex-1 flex flex-col min-h-0 mb-6">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            id="cameraInput"
            className="hidden"
            onChange={(e) => {
              if (!e.target.files) return
              handlePhoto(e.target.files[0])
            }}
          />

          {!preview ? (
            <label
              htmlFor="cameraInput"
              className="w-full flex-1 border border-dashed border-[#E0DED7] flex flex-col items-center justify-center rounded-sm bg-white/30 active:bg-[#F2F1ED] transition-colors"
            >
              <Camera className="text-[#A1887F] mb-2" size={24} strokeWidth={1.5} />
              <span className="text-[9px] text-[#A1887F] uppercase tracking-[0.3em] font-bold">
                Ambil Foto Paket
              </span>
            </label>
          ) : (
            <div className="relative flex-1 min-h-0 group">
              <img
                src={preview}
                className="w-full h-full object-cover rounded-sm border border-[#E0DED7] shadow-sm"
              />
              <label
                htmlFor="cameraInput"
                className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-3 py-2 rounded-sm text-[8px] uppercase tracking-[0.2em] font-bold shadow-sm border border-[#E0DED7] active:scale-95 transition-transform"
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
            disabled={saving}
            className="border border-[#E0DED7] text-[#3E2723] py-4 px-5 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] flex justify-between items-center active:bg-zinc-50 transition-all disabled:opacity-30"
          >
            <ChevronLeft size={14} />
            <span>Simpan Draft</span>
          </button>

          <button
            onClick={() => createHandover("handover")}
            disabled={saving}
            className="bg-[#3E2723] text-[#FAF9F6] py-4 px-5 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] flex justify-between items-center shadow-md active:scale-[0.97] transition-all disabled:opacity-50"
          >
            <span>Serah Terima</span>
            <ChevronRight size={14} />
          </button>

        </div>

      </main>
    </div>
  )
}
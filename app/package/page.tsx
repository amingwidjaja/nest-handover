'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Home, ChevronRight } from "lucide-react"
import imageCompression from "browser-image-compression"
import Link from "next/link"

export default function PackagePage() {
  const router = useRouter()

  // Dikurangi menjadi 2 baris agar hemat ruang (anti-scroll)
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
      maxWidthOrHeight: 1200, // Ukuran di-reduce sedikit untuk efisiensi
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
      alert("Data belum lengkap. Mulai dari halaman awal.")
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
    <div className="h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col overflow-hidden">
      <main className="px-8 py-8 flex-1 flex flex-col max-w-md mx-auto w-full">
        
        {/* HEADER */}
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-lg font-medium uppercase tracking-[0.2em] opacity-60">
            Daftar Barang
          </h2>
          <Link href="/paket">
            <Home size={20} strokeWidth={1.5} className="opacity-60" />
          </Link>
        </div>

        {/* ITEMS - Dirapatkan (Line-input style) */}
        <div className="space-y-1 mb-6">
          {items.map((item, i) => (
            <textarea
              key={i}
              value={item}
              onChange={(e) => handleItemChange(i, e.target.value)}
              className="w-full bg-transparent border-b border-[#E0DED7] focus:border-[#3E2723] outline-none py-2 text-sm resize-none placeholder:opacity-30 transition-all"
              rows={1}
              placeholder={i === 0 ? "Ketik nama barang utama..." : "Barang tambahan (opsional)"}
            />
          ))}
        </div>

        {/* PHOTO - Ukuran diperkecil agar tidak scroll */}
        <div className="flex-1 flex flex-col min-h-0">
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
              className="w-full flex-1 border border-dashed border-[#E0DED7] flex flex-col items-center justify-center rounded-sm active:bg-[#F2F1ED] transition-colors"
            >
              <Camera className="text-[#A1887F] mb-2" size={24} strokeWidth={1.5} />
              <span className="text-[10px] text-[#A1887F] uppercase tracking-widest font-bold">
                Ambil Foto Paket
              </span>
            </label>
          ) : (
            <div className="relative flex-1 min-h-0">
              <img
                src={preview}
                className="w-full h-full object-cover rounded-sm border border-[#E0DED7]"
              />
              <label
                htmlFor="cameraInput"
                className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[9px] uppercase tracking-widest font-bold shadow-sm border border-[#E0DED7]"
              >
                Ganti Foto
              </label>
            </div>
          )}
        </div>

        {/* ACTION BUTTONS - UI dipertegas */}
        <div className="mt-8 grid grid-cols-2 gap-4 items-center">
          <button
            onClick={() => createHandover("save")}
            className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity text-left"
          >
            Simpan Draft
          </button>

          <button
            onClick={() => createHandover("handover")}
            disabled={saving}
            className="bg-[#3E2723] text-[#FAF9F6] py-4 px-6 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] flex justify-between items-center shadow-md active:scale-95 transition-all"
          >
            {saving ? "..." : "Serah Terima"}
            <ChevronRight size={14} />
          </button>
        </div>

      </main>
    </div>
  )
}
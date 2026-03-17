'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Home } from "lucide-react"
import imageCompression from "browser-image-compression"
import Link from "next/link"

export default function PackagePage() {

  const router = useRouter()

  const [items, setItems] = useState(["", "", "", ""])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const [saving,setSaving] = useState(false)

  function handleItemChange(index:number,value:string){
    const copy = [...items]
    copy[index] = value
    setItems(copy)
  }

  async function handlePhoto(file:File){

    const options = {
      maxSizeMB: 0.6,
      maxWidthOrHeight: 1600,
      useWebWorker: true
    }

    const compressed = await imageCompression(file, options)

    if(preview) URL.revokeObjectURL(preview)

    setPhotoFile(compressed)
    setPreview(URL.createObjectURL(compressed))
  }

  async function createHandover(mode:"save"|"handover"){

    // 🔥 VALIDASI ITEM
    if(!items[0].trim()){
      alert("Minimal isi 1 barang")
      return
    }

    if(saving) return
    setSaving(true)

    // 🔥 AMBIL DRAFT DARI LOCAL STORAGE
    const sender_name = localStorage.getItem("draft_sender_name") || ""
    const receiver_target_name = localStorage.getItem("draft_receiver_name") || ""
    const receiver_target_phone = localStorage.getItem("draft_receiver_contact") || ""
    const receiver_target_email = ""

    // 🔥 GUARD (INI YANG LU TANYA TADI)
    if(!sender_name || !receiver_target_name){
      alert("Data belum lengkap. Mulai dari halaman awal.")
      router.push("/create")
      return
    }

    const payload = {
      sender_name,
      receiver_target_name,
      receiver_target_phone,
      receiver_target_email,
      items: items
        .filter(i => i.trim() !== "")
        .map(i => ({
          description: i
        }))
    }

    try{

      const res = await fetch("/api/handover/create",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if(!data.success){
        setSaving(false)
        alert("Gagal membuat handover")
        return
      }

      const id = data.handover_id

      // 🔥 CLEAR DRAFT (PENTING)
      localStorage.removeItem("draft_sender_name")
      localStorage.removeItem("draft_sender_contact")
      localStorage.removeItem("draft_receiver_name")
      localStorage.removeItem("draft_receiver_contact")

      // 🔥 ROUTING
      if(mode === "save"){
        router.push("/paket")
      }else{
        router.push(`/handover/${id}`)
      }

    }catch{
      setSaving(false)
      alert("Terjadi kesalahan koneksi")
    }

  }

  return (

    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col">

      <main className="p-10 pt-10">

        <div className="flex justify-between items-start mb-8">

          <h2 className="text-lg font-medium uppercase tracking-[0.2em] opacity-60">
            Daftar Barang
          </h2>

          <Link href="/paket">
            <Home size={20} strokeWidth={1.5} className="opacity-60"/>
          </Link>

        </div>

        {/* ITEMS */}

        <div className="space-y-0 mb-8">

          {items.map((item, i) => (
            <textarea
              key={i}
              value={item}
              onChange={(e) => handleItemChange(i, e.target.value)}
              className="line-input resize-none"
              rows={2}
              placeholder={i === 0 ? "Ketik nama barang yang kamu\nmau kirim di sini" : ""}
            />
          ))}

        </div>

        {/* PHOTO */}

        <div className="mb-8">

          <input
            type="file"
            accept="image/*"
            capture="environment"
            id="cameraInput"
            className="hidden"
            onChange={(e)=>{
              if(!e.target.files) return
              handlePhoto(e.target.files[0])
            }}
          />

          {!preview && (

            <label
              htmlFor="cameraInput"
              className="w-full aspect-[4/3] border border-dashed border-[#E0DED7] flex flex-col items-center justify-center rounded-sm active:bg-[#F2F1ED]"
            >

              <Camera
                className="text-[#A1887F] mb-2"
                size={24}
                strokeWidth={1.5}
              />

              <span className="text-xs text-[#A1887F]">
                Tambahkan foto paketmu di sini
              </span>

            </label>

          )}

          {preview && (

            <div className="space-y-3">

              <img
                src={preview}
                className="w-full rounded-sm"
              />

              <label
                htmlFor="cameraInput"
                className="text-xs opacity-60 cursor-pointer"
              >
                Ambil ulang foto
              </label>

            </div>

          )}

        </div>

        {/* ACTION BUTTONS */}

        <div className="flex justify-between text-sm mt-10">

          <button
            onClick={()=>createHandover("save")}
            className="opacity-60"
          >
            Simpan
          </button>

          <button
            onClick={()=>createHandover("handover")}
            className="font-medium"
          >
            Serah Terima →
          </button>

        </div>

      </main>

    </div>

  )

}
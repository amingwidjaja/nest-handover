'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Home } from "lucide-react"
import imageCompression from "browser-image-compression"

export default function PackagePage() {

  const router = useRouter()

  const [items, setItems] = useState(["", "", "", ""])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleItemChange = (index:number,value:string) => {
    const copy = [...items]
    copy[index] = value
    setItems(copy)
  }

  const handlePhoto = async (file:File) => {

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

  const createHandover = async () => {

    if(!items[0].trim()){
      alert("Minimal isi 1 barang")
      return
    }

    const payload = {
      sender_name: "Sender",
      receiver_target_name: "",
      receiver_target_phone: "",
      receiver_target_email: "",
      items: items
        .filter(i => i.trim() !== "")
        .map(i => ({
          description: i
        }))
    }

    const res = await fetch("/api/handover/create",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    })

    const data = await res.json()

    if(!data.success){
      alert("Gagal membuat handover")
      return
    }

    router.push(`/handover/${data.handover_id}`)

  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">

    <div className="flex justify-end p-6">
    <a href="/paket">
        <Home size={20} strokeWidth={1.5} className="text-[#3E2723] opacity-70" />
    </a>
    </div>

      <main className="p-10 pt-10">

        <h2 className="text-lg font-medium uppercase tracking-[0.2em] mb-8 opacity-60">
          Daftar Barang
        </h2>

        <div className="space-y-0 mb-8">

          {items.map((item,i)=>(
            <input
              key={i}
              value={item}
              onChange={(e)=>handleItemChange(i,e.target.value)}
              className="line-input"
              placeholder={i===0 ? "Ketik nama barang yang kamu mau kirim di sini" : ""}
            />
          ))}

        </div>

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

      </main>

      <div className="flex justify-end px-8 pb-4 text-sm">

        <button onClick={createHandover}>
          Lanjut →
        </button>

      </div>

    </div>
  )

}
'use client';

import { useState } from "react";
import Link from "next/link";
import { Camera } from "lucide-react";
import imageCompression from "browser-image-compression";

export default function PackagePage() {

  const [items, setItems] = useState(["", "", "", ""])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const [toast,setToast] = useState("")

  function showToast(msg:string){
    setToast(msg)
    setTimeout(()=>setToast(""),3000)
  }

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

  function handleNext(){

    if(!items[0].trim()){
      showToast("Tulis nama barang yang kamu kirim")
      return
    }

    const id = crypto.randomUUID()

    window.location.href = `/handover/${id}`

  }

  return (

    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">

      <main className="p-8 pt-16">

        <h2 className="text-xs font-medium uppercase tracking-[0.2em] mb-12 opacity-60">
          ketik nama barang yang kamu mau kirim di sini
        </h2>

        <div className="space-y-0 mb-12">

          {items.map((item,i)=>(

            <input
              key={i}
              value={item}
              onChange={(e)=>handleItemChange(i,e.target.value)}
              className="line-input"
              placeholder={i===0 ? "1. Nama barang..." : ""}
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


      {toast && (

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#3E2723] text-white text-sm px-6 py-3 rounded-full shadow-lg">
          {toast}
        </div>

      )}


      <div className="flex justify-between px-8 pb-8 text-sm">

        <Link href="/create" className="opacity-60">
          ← Sebelumnya
        </Link>

        <button
          onClick={handleNext}
        >
          Lanjut →
        </button>

      </div>

    </div>

  );
}
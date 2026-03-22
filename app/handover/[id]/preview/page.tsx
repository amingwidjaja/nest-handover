'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PreviewPage(){

  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [photo,setPhoto] = useState<string | null>(null)
  const [saving,setSaving] = useState(false)

  useEffect(()=>{

    const stored = sessionStorage.getItem(`handover_${id}_photo`)

    if(!stored){
      router.replace(`/handover/${id}`)
      return
    }

    setPhoto(stored)

  },[id, router])

  function handleRetake(){
    window.location.href = `/handover/${id}`
  }

  async function handleConfirm(){

    if(!photo) return

    setSaving(true)

    try{

      // =========================
      // 1. Convert & crop
      // =========================
      const img = document.createElement("img")
      img.src = photo

      await new Promise<void>((resolve)=>{
        img.onload = ()=>resolve()
      })

      const size = Math.min(img.width,img.height)
      const sx = (img.width - size)/2
      const sy = (img.height - size)/2

      const canvas = document.createElement("canvas")
      canvas.width = 1200
      canvas.height = 1200

      const ctx = canvas.getContext("2d")
      if(!ctx) throw new Error("canvas error")

      ctx.drawImage(img, sx, sy, size, size, 0, 0, 1200, 1200)

      const blob: Blob | null = await new Promise(resolve=>{
        canvas.toBlob(resolve,"image/jpeg",0.8)
      })

      if(!blob) throw new Error("compress error")

      const file = new File([blob],"photo.jpg",{ type:"image/jpeg" })

      // =========================
      // 2. Upload
      // =========================
      const path = `paket/public/handover/${id}/${Date.now()}.jpg`

      const { error: uploadError } = await supabase
        .storage
        .from("nest-evidence")
        .upload(path, file, {
          contentType: "image/jpeg"
        })

      if(uploadError){
        console.log(uploadError)
        throw new Error("upload gagal")
      }

      const { data } = supabase
        .storage
        .from("nest-evidence")
        .getPublicUrl(path)

      const photo_url = data.publicUrl

      // =========================
      // 3. META
      // =========================
      const meta = JSON.parse(
        sessionStorage.getItem(`handover_${id}_meta`) || "{}"
      )

      const receiver_type = meta.mode === "direct" ? "direct" : "proxy"

      // =========================
      // 4. INSERT (NO GPS)
      // =========================
      const res = await fetch("/api/handover/receive",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body: JSON.stringify({
          handover_id: id,
          receive_method: meta.mode === "direct" ? "direct_photo" : "proxy_photo",
          receiver_type,
          receiver_name: meta.mode === "direct" ? "" : meta.delegateName || "",
          receiver_relation: meta.mode === "direct" ? "" : meta.relation || "",
          photo_url
        })
      })

      const result = await res.json()

      if(!result.success){
        throw new Error(result.error || "fail")
      }

      sessionStorage.removeItem(`handover_${id}_photo`)

      // =========================
      // 5. NEXT STEP → GPS PAGE
      // =========================
      router.replace(`/handover/${id}/location`)

    }catch(err){
      console.log(err)
      alert("Gagal menyimpan")
      setSaving(false)
    }
  }

  return(
    <div className="min-h-full bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">

      <main className="p-6 pt-6">

        <h2 className="text-2xl font-medium mb-6 text-center">
          Preview Bukti
        </h2>

        {photo && (
          <div className="relative w-full aspect-square border border-[#E0DED7] rounded-sm overflow-hidden shadow-md mb-6">

            <Image
              src={photo}
              alt="Preview"
              fill
              className="object-cover"
            />

            {saving && (
              <div className="absolute inset-0 bg-[#FAF9F6]/60 flex items-center justify-center">
                <span className="text-xs animate-pulse">
                  Menyimpan...
                </span>
              </div>
            )}

          </div>
        )}

        {!saving && (
          <div className="flex gap-3">

            <button
              onClick={handleRetake}
              className="flex-1 border border-[#E0DED7] py-3 rounded-sm"
            >
              Retake
            </button>

            <button
              onClick={handleConfirm}
              className="flex-1 bg-[#3E2723] text-white py-3 rounded-sm"
            >
              Gunakan Foto
            </button>

          </div>
        )}

      </main>

    </div>
  )
}
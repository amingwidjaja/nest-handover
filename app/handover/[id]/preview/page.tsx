'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"

export default function PreviewPage(){

  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [photo,setPhoto] = useState<string | null>(null)
  const [saving,setSaving] = useState(false)

  useEffect(()=>{

    const key = `handover_${id}_photo`
    const stored = sessionStorage.getItem(key)

    if(!stored){
      router.replace(`/handover/${id}`)
      return
    }

    setPhoto(stored)

  },[])

  function handleRetake(){
    router.replace(`/handover/${id}`)
  }

  async function handleConfirm(){

    if(!photo) return

    setSaving(true)

    try{

      // convert base64 → image
      const img = document.createElement("img")
      img.src = photo

      await new Promise<void>((resolve)=>{
        img.onload = () => resolve()
      })

      const size = Math.min(img.width,img.height)
      const sx = (img.width - size)/2
      const sy = (img.height - size)/2

      const MAX_SIZE = 1200
      const targetSize = size > MAX_SIZE ? MAX_SIZE : size

      const canvas = document.createElement("canvas")
      canvas.width = targetSize
      canvas.height = targetSize

      const ctx = canvas.getContext("2d")
      if(!ctx){
        alert("Gagal memproses gambar")
        setSaving(false)
        return
      }

      ctx.drawImage(
        img,
        sx, sy, size, size,
        0, 0, targetSize, targetSize
      )

      const blob: Blob | null = await new Promise(resolve=>{
        canvas.toBlob(resolve,"image/jpeg",0.8)
      })

      if(!blob){
        alert("Gagal compress gambar")
        setSaving(false)
        return
      }

      const finalFile = new File([blob],"photo.jpg",{ type:"image/jpeg" })

      // GPS
      const pos = await new Promise<GeolocationPosition>((resolve,reject)=>{
        navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true})
      })

      const meta = JSON.parse(
        sessionStorage.getItem(`handover_${id}_meta`) || "{}"
      )

      const form = new FormData()

      form.append("handover_id", id)
      form.append(
        "receive_method",
        meta.mode === "direct" ? "direct_photo" : "proxy_photo"
      )
      form.append("receiver_name", meta.mode === "direct" ? "" : meta.delegateName || "")
      form.append("receiver_relation", meta.mode === "direct" ? "" : meta.relation || "")

      form.append("photo", finalFile)

      form.append("gps_lat", String(pos.coords.latitude))
      form.append("gps_lng", String(pos.coords.longitude))

      if(pos.coords.accuracy != null){
        form.append("gps_accuracy", String(pos.coords.accuracy))
      }

      const res = await fetch("/api/handover/receive",{
        method:"POST",
        body:form
      })

      const data = await res.json()

      if(data.success){

        sessionStorage.removeItem(`handover_${id}_photo`)
        sessionStorage.removeItem(`handover_${id}_meta`)

        router.replace(`/handover/${id}/success`)

      }else{
        alert(data.error || "Gagal")
        setSaving(false)
      }

    }catch{
      alert("Error koneksi")
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
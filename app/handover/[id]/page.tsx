'use client'

import { useState, useEffect, type ChangeEvent } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { QrCode, Camera } from "lucide-react"
import Image from "next/image"
import { resolveEvidencePhotoUrl } from "@/lib/nest-evidence-upload"
import { blobToDataUrl, compressJpegUnderMaxBytes } from "@/lib/image-evidence"

export default function HandoverPage() {

  const params = useParams()
  const router = useRouter()

  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : ""

  const [mode,setMode] = useState("direct")
  const [delegateName,setDelegateName] = useState("")
  const [relation,setRelation] = useState("")
  const [photo,setPhoto] = useState<string | null>(null)
  const [rawFile,setRawFile] = useState<File | null>(null)
  const [notes,setNotes] = useState("")
  const [saving,setSaving] = useState(false)
  const [processingCapture, setProcessingCapture] = useState(false)

  const [handover,setHandover] = useState<any>(null)

  useEffect(()=>{
    load()
  },[])

  async function load(){
    const res = await fetch(`/api/handover/detail?id=${id}`)
    const data = await res.json()
    setHandover(data)
  }

  function getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation tidak didukung"))
        return
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
      })
    })
  }

  // ===== STEP 1: CAPTURE ONLY (NO UPLOAD) — compress before preview =====
  async function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return

    const file = e.target.files[0]
    e.target.value = ""

    if (mode === "delegate") {
      if (!delegateName.trim() || !relation.trim()) {
        alert("Nama wakil & hubungan wajib diisi")
        return
      }
    }

    setProcessingCapture(true)
    await new Promise<void>((r) => setTimeout(r, 0))
    const objectUrl = URL.createObjectURL(file)
    const img = document.createElement("img")

    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("Gagal memuat gambar"))
        img.src = objectUrl
      })

      const size = Math.min(img.width, img.height)
      const sx = (img.width - size) / 2
      const sy = (img.height - size) / 2

      const MAX_SIZE = 1200
      const targetSize = size > MAX_SIZE ? MAX_SIZE : size

      const canvas = document.createElement("canvas")
      canvas.width = targetSize
      canvas.height = targetSize

      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("canvas")

      ctx.drawImage(img, sx, sy, size, size, 0, 0, targetSize, targetSize)

      const rawBlob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92)
      )
      if (!rawBlob) throw new Error("toBlob")

      const compressed = await compressJpegUnderMaxBytes(rawBlob)
      const dataUrl = await blobToDataUrl(compressed)

      const key = `handover_${id}_photo`
      sessionStorage.setItem(key, dataUrl)

      sessionStorage.setItem(
        `handover_${id}_meta`,
        JSON.stringify({
          mode,
          delegateName,
          relation
        })
      )

      router.replace(`/handover/${id}/preview`)
    } catch (err) {
      console.error(err)
      alert("Gagal memproses foto")
    } finally {
      URL.revokeObjectURL(objectUrl)
      setProcessingCapture(false)
    }
  }

  // ===== STEP 2: PROCESS + UPLOAD =====
  async function handleConfirm(){

    if(!rawFile) return

    setSaving(true)

    try{

      // GPS
      let pos: GeolocationPosition
      try{
        pos = await getCurrentPosition()
      }catch{
        setSaving(false)
        alert("GPS diperlukan untuk bukti foto. Izinkan akses lokasi.")
        return
      }

      // ===== PROCESS IMAGE =====
      const img = document.createElement("img")
      img.src = URL.createObjectURL(rawFile)

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
        setSaving(false)
        alert("Gagal memproses gambar")
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
        setSaving(false)
        alert("Gagal compress gambar")
        return
      }

      const compressed = await compressJpegUnderMaxBytes(blob)
      const finalFile = new File([compressed],"photo.jpg",{ type:"image/jpeg" })

      // ===== UPLOAD =====
      const form = new FormData()
      form.append("handover_id", id)
      form.append(
        "receive_method",
        mode === "direct" ? "direct_photo" : "proxy_photo"
      )
      form.append(
        "receiver_name",
        mode === "direct" ? "" : delegateName.trim()
      )
      form.append(
        "receiver_relation",
        mode === "direct" ? "" : relation.trim()
      )
      form.append("photo", finalFile)
      form.append("gps_lat", String(pos.coords.latitude))
      form.append("gps_lng", String(pos.coords.longitude))

      if (pos.coords.accuracy != null) {
        form.append("gps_accuracy", String(pos.coords.accuracy))
      }

      const res = await fetch("/api/handover/receive", {
        method:"POST",
        body:form
      })

      const data = await res.json()

      if(data.success){
        router.push(`/handover/${id}/location`)
      }else{
        setSaving(false)
        alert(data.error || "Gagal")
      }

    }catch{
      setSaving(false)
      alert("Error koneksi")
    }

  }

  function handleRetake(){
    setPhoto(null)
    setRawFile(null)
  }

  return(

    <div className="min-h-full bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between relative">

      {processingCapture && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#FAF9F6]/80 backdrop-blur-[1px]">
          <span className="text-sm font-medium text-[#3E2723] animate-pulse">
            Memproses foto…
          </span>
        </div>
      )}

      <main className="p-6 pt-6">

        <h2 className="text-2xl font-medium mb-1">
          Tanda Terima
        </h2>

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
              <span className="text-base font-medium">{handover.sender_name || "-"}</span>
            </div>

            <div>
              <span className="opacity-50">Penerima paket: </span>
              <span className="text-base font-medium">{handover.receiver_target_name || "-"}</span>
            </div>

          </div>
        )}

        {handover?.handover_items?.length > 0 && (
          <div className="space-y-3 mb-8">

            {handover.handover_items.map((item:any)=>(
              <div key={item.id} className="flex gap-3 items-stretch">

                <div className="aspect-square w-26 border border-[#E0DED7] rounded-sm overflow-hidden flex-shrink-0">
                  {(() => {
                    const src = resolveEvidencePhotoUrl(item.photo_url)
                    return src ? (
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : null
                  })()}
                </div>

                <div className="flex-1 border border-[#E0DED7] rounded-sm px-3 py-2">
                  <span className="text-md opacity-50 mb-1 block">Detail paket:</span>
                  <span className="text-base">{item.description || "-"}</span>
                </div>

              </div>
            ))}

          </div>
        )}

        <div className="flex gap-6 mb-6 border-b border-[#E0DED7] pb-3">

          <button
            onClick={()=>setMode("direct")}
            className={`text-base pb-3 -mb-[14px] ${
              mode==="direct" ? "font-medium border-b-2 border-[#3E2723]" : "opacity-40"
            }`}
          >
            Penerima Langsung
          </button>

          <button
            onClick={()=>setMode("delegate")}
            className={`text-base pb-3 -mb-[14px] ${
              mode==="delegate" ? "font-medium border-b-2 border-[#3E2723]" : "opacity-40"
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
              onChange={(e)=>setDelegateName(e.target.value)}
              className="w-full border-b border-[#E0DED7] py-2 outline-none"
            />
            <input
              placeholder="Hubungan:"
              value={relation}
              onChange={(e)=>setRelation(e.target.value)}
              className="w-full border-b border-[#E0DED7] py-2 outline-none"
            />
          </div>
        )}

        <textarea
          placeholder="Catatan:"
          value={notes}
          onChange={(e)=>setNotes(e.target.value)}
          className="w-full border-b border-[#E0DED7] py-2 outline-none mb-6 text-md"
        />

        <div className="grid grid-cols-2 gap-3 mb-6">

          <Link
            href={`/handover/${id}/qr`}
            className="w-[85%] aspect-square border border-[#E0DED7] flex flex-col items-center justify-center rounded-sm shadow-md"
          >
            <QrCode size={26} className="mb-2"/>
            <span className="text-[10px]">QR</span>
          </Link>

          {/* PHOTO BOX */}
          {!photo && (
            <label className="w-[85%] aspect-square border border-[#E0DED7] flex flex-col items-center justify-center rounded-sm shadow-md cursor-pointer">
              <Camera size={26} className="mb-2"/>
              <span className="text-[10px]">Foto</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhoto}
              />
            </label>
          )}

          {photo && (
            <div className="relative w-[85%] aspect-square border border-[#E0DED7] rounded-sm overflow-hidden shadow-md">

              <Image src={photo} alt="Preview" fill className="object-cover"/>

              {!saving && (
                <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                  <button onClick={handleRetake} className="flex-1 bg-white text-xs py-1 rounded">
                    Retake
                  </button>
                  <button onClick={handleConfirm} className="flex-1 bg-[#3E2723] text-white text-xs py-1 rounded">
                    Confirm
                  </button>
                </div>
              )}

              {saving && (
                <div className="absolute inset-0 bg-[#FAF9F6]/60 flex items-center justify-center">
                  <span className="text-xs animate-pulse">Menyimpan...</span>
                </div>
              )}

            </div>
          )}

        </div>

      </main>

      <div className="px-6 pb-6">
        <button
          onClick={()=>router.back()}
          className="w-full py-3 rounded-lg border border-[#E0DED7] shadow-md"
        >
          Kembali
        </button>
      </div>

    </div>

  )
}
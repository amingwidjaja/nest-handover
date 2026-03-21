'use client'

import { useState, useEffect, type ChangeEvent } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { QrCode, Camera } from "lucide-react"
import Image from "next/image"

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
  const [notes,setNotes] = useState("")
  const [saving,setSaving] = useState(false)

  const [handover,setHandover] = useState<any>(null)

  useEffect(()=>{
    if (id) load()
  },[id])

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

  async function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    if (saving) return
    if (!e.target.files?.length) return

    const file = e.target.files[0]
    const preview = URL.createObjectURL(file)

    // VALIDATION
    if (mode === "delegate") {
      const name = delegateName.trim()
      const rel = relation.trim()

      if (!name || !rel) {
        alert("Nama wakil & hubungan wajib diisi")
        return
      }
    }

    setSaving(true)

    try {
      let pos: GeolocationPosition

      try {
        pos = await getCurrentPosition()
      } catch {
        setSaving(false)
        alert("GPS diperlukan untuk bukti foto. Izinkan akses lokasi.")
        return
      }

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
      form.append("photo", file, file.name || "photo.jpg")
      form.append("gps_lat", String(pos.coords.latitude))
      form.append("gps_lng", String(pos.coords.longitude))

      if (pos.coords.accuracy != null) {
        form.append("gps_accuracy", String(pos.coords.accuracy))
      }

      const res = await fetch("/api/handover/receive", {
        method: "POST",
        body: form,
      })

      const data = await res.json()

      if (data.success) {
        setPhoto(preview)
        router.push("/dashboard")
      } else {
        setSaving(false)
        alert(data.error || "Gagal menyimpan")
      }

    } catch {
      setSaving(false)
      alert("Error koneksi")
    } finally {
      e.target.value = ""
    }
  }

  return(

    <div className="min-h-full bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">

      <main className="p-6 pt-6">

        <h2 className="text-2xl font-medium mb-4">
          Serah Terima
        </h2>

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
                  {item.photo_url && (
                    <img
                      src={item.photo_url}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="flex-1 border border-[#E0DED7] rounded-sm px-3 py-2 flex flex-col justify-start">
                  <span className="text-md opacity-50 mb-1">
                    Detail paket:
                  </span>

                  <span className="text-base">
                    {item.description || "-"}
                  </span>
                </div>

              </div>
            ))}

          </div>
        )}

        <div className="flex gap-6 mb-6 border-b border-[#E0DED7] pb-3">

          <button
            onClick={()=>setMode("direct")}
            className={`text-base pb-3 -mb-[14px] ${
              mode==="direct"
                ? "font-medium border-b-2 border-[#3E2723]"
                : "opacity-40"
            }`}
          >
            Penerima Langsung
          </button>

          <button
            onClick={()=>setMode("delegate")}
            className={`text-base pb-3 -mb-[14px] ${
              mode==="delegate"
                ? "font-medium border-b-2 border-[#3E2723]"
                : "opacity-40"
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
          className="w-full border-b border-[#E0DED7] py-2 outline-none mb-6 text-md placeholder:opacity-80"
        />

        <div className="grid grid-cols-2 gap-3 mb-6">

          <Link
            href={`/handover/${id}/qr`}
            className="w-[85%] aspect-square border border-[#E0DED7] flex flex-col items-center justify-center rounded-sm shadow-md active:scale-95 active:shadow-sm active:bg-[#F2F1ED] transition"
          >
            <QrCode size={26} className="mb-2"/>
            <span className="text-[10px]">QR</span>
          </Link>

          <label
            className="w-[85%] aspect-square border border-[#E0DED7] flex flex-col items-center justify-center rounded-sm shadow-md active:scale-95 active:shadow-sm active:bg-[#F2F1ED] transition cursor-pointer"
          >
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

        </div>

        {!photo && (
          <p className="text-[11px] text-center text-[#A1887F] leading-relaxed mb-6">
            Pilih salah satu cara untuk menyelesaikan serah terima
            <br/>
            QR atau foto saat paket diserahkan
          </p>
        )}

        {photo && (
          <div className="relative w-full aspect-square border border-[#E0DED7] rounded-sm overflow-hidden shadow-md mb-6">

            <Image
              src={photo}
              alt="Bukti"
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

      </main>

      <div className="px-6 pb-6">

        <button
          onClick={()=>router.back()}
          className="w-full py-3 rounded-lg border border-[#E0DED7] shadow-md active:scale-95 active:shadow-sm active:bg-[#F2F1ED] transition"
        >
          Kembali
        </button>

      </div>

    </div>

  )

}
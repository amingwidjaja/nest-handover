'use client'

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Camera, QrCode } from "lucide-react"
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

  function handleCameraClick(){

    if(mode === "delegate"){
      if(!delegateName.trim() || !relation.trim()){
        alert(
`Isi nama wakil dan
hubungan dengan penerima
terlebih dahulu`
        )
        return
      }
    }

    if(saving) return

    document.getElementById("handoverCamera")?.click()

  }

  async function handlePhoto(e:React.ChangeEvent<HTMLInputElement>){

    if(!e.target.files) return

    const file = e.target.files[0]

    const url = URL.createObjectURL(file)

    setPhoto(url)

    setSaving(true)

    const receive_method =
      mode === "direct"
        ? "direct_photo"
        : "proxy_photo"

    const receiver_name =
      mode === "direct"
        ? ""
        : delegateName

    const receiver_relation =
      mode === "direct"
        ? ""
        : relation

    const res = await fetch("/api/handover/receive",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        handover_id: id,
        receiver_name,
        receiver_relation,
        receive_method,
        notes
      })
    })

    const data = await res.json()

    if(data.success){

      router.push("/dashboard")

    }else{

      setSaving(false)

      alert(data.error || "Gagal menyimpan serah terima")

    }

  }

  return(

    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">

      <main className="p-8 pt-12">

        <h2 className="text-xl font-light mb-10">
          Serah terima paket
        </h2>


        {/* MODE SWITCH */}

        <div className="flex gap-8 mb-10 border-b border-[#E0DED7] pb-4">

          <button
            onClick={()=>setMode("direct")}
            className={`text-sm pb-4 -mb-[18px] ${
              mode==="direct"
              ? "font-bold border-b-2 border-[#3E2723]"
              : "opacity-40"
            }`}
          >
            Penerima langsung
          </button>

          <button
            onClick={()=>setMode("delegate")}
            className={`text-sm pb-4 -mb-[18px] ${
              mode==="delegate"
              ? "font-bold border-b-2 border-[#3E2723]"
              : "opacity-40"
            }`}
          >
            Diwakilkan
          </button>

        </div>


        {/* DELEGATE MODE */}

        {mode==="delegate" && (

          <div className="space-y-6 mb-10">

            <div>

              <div className="text-sm mb-2">
                Nama yang mewakili
              </div>

              <input
                value={delegateName}
                onChange={(e)=>setDelegateName(e.target.value)}
                className="line-input w-full"
              />

            </div>

            <div>

              <div className="text-sm mb-2">
                Hubungan dengan penerima
              </div>

              <input
                value={relation}
                onChange={(e)=>setRelation(e.target.value)}
                className="line-input w-full"
              />

            </div>

            <div>

              <div className="text-sm mb-2">
                Catatan <span className="opacity-40">(opsional)</span>
              </div>

              <input
                value={notes}
                onChange={(e)=>setNotes(e.target.value)}
                className="line-input w-full"
              />

            </div>

          </div>

        )}


        {/* DIRECT MODE */}

        {mode==="direct" && (

          <div className="mb-10">

            <div className="text-sm mb-2">
              Catatan <span className="opacity-40">(opsional)</span>
            </div>

            <textarea
              rows={2}
              value={notes}
              onChange={(e)=>setNotes(e.target.value)}
              className="line-input w-full"
            />

          </div>

        )}


        {/* ACTION BUTTONS */}

        <div className="grid grid-cols-2 gap-4 mb-6">

          <Link
            href={`/handover/${id}/qr`}
            className="aspect-square border border-[#E0DED7] flex flex-col items-center justify-center rounded-sm active:bg-[#F2F1ED]"
          >

            <QrCode
              size={32}
              strokeWidth={1.5}
              className="mb-3"
            />

            <span className="text-xs">
              QR Code
            </span>

          </Link>

          <button
            onClick={handleCameraClick}
            disabled={saving}
            className="aspect-square border border-[#E0DED7] flex flex-col items-center justify-center rounded-sm active:bg-[#F2F1ED]"
          >

            <Camera
              size={32}
              strokeWidth={1.5}
              className="mb-3"
            />

            <span className="text-xs text-center">
              Ambil foto
              <br/>
              serah terima
            </span>

          </button>

        </div>


        {/* GUIDELINE */}

        <p className="text-xs text-center text-[#A1887F] leading-relaxed mb-10">

          Pilih salah satu cara untuk menyelesaikan serah terima:

          <br/>

          • Tunjukkan QR kepada penerima untuk difoto

          <br/>

          • Atau ambil foto saat paket diserahkan

        </p>


        {saving && (

          <p className="text-xs text-center text-[#A1887F] mb-10">
            Menyimpan serah terima...
          </p>

        )}


        {/* CAMERA INPUT */}

        <input
          id="handoverCamera"
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhoto}
        />


        {/* PHOTO PREVIEW */}

        {photo && (

          <Image
            src={photo}
            alt="handover proof"
            width={800}
            height={600}
            className="w-full rounded-sm mb-10"
          />

        )}

      </main>


      {/* FOOTER NAV */}

      <div className="flex justify-between px-8 pb-8 text-sm">

        <Link
          href="/package"
          className="opacity-60"
        >
          ← Sebelumnya
        </Link>

      </div>

    </div>

  )

}
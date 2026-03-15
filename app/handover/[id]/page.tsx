'use client'

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Camera, QrCode } from "lucide-react"
import Image from "next/image"

export default function HandoverPage() {

  const params = useParams()
  const id = params.id as string

  const [mode,setMode] = useState("direct")
  const [delegateName,setDelegateName] = useState("")
  const [relation,setRelation] = useState("")
  const [photo,setPhoto] = useState<string | null>(null)
  const [notes,setNotes] = useState("")

  function handleCameraClick(){

    if(mode === "delegate"){
      if(!delegateName.trim() || !relation.trim()){
        alert(
`Isi nama wakil
dan hubungan dengan penerima
terlebih dahulu`
        )
        return
      }
    }

    document.getElementById("handoverCamera")?.click()

  }

  function handlePhoto(e:React.ChangeEvent<HTMLInputElement>){

    if(!e.target.files) return

    const file = e.target.files[0]

    const url = URL.createObjectURL(file)

    setPhoto(url)

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

        <div className="grid grid-cols-2 gap-4 mb-10">

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
          href={`/package/${id}`}
          className="opacity-60"
        >
          ← Sebelumnya
        </Link>

        
      </div>

    </div>

  )

}
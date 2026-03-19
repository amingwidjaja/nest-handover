'use client'

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { QrCode, ChevronLeft } from "lucide-react"
import Image from "next/image"
import SquarePhotoInput from "@/app/components/SquarePhotoInput"

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


  async function handlePhotoCapture(file: File, preview: string){

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

    setPhoto(preview)
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

    try{

      const res = await fetch("/api/handover/receive",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body: JSON.stringify({
          handover_id:id,
          receiver_name,
          receiver_relation,
          receive_method,
          receiver_type: mode === "direct" ? "direct" : "proxy",
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

    }catch{

      setSaving(false)
      alert("Terjadi kesalahan koneksi")

    }

  }


  return(

    <div className="min-h-full bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">

      <main className="p-6 pt-8">

        {/* 🔥 HEADER UPGRADE */}
        <h2 className="text-2xl font-medium mb-8">
          Serah Terima
        </h2>


        {/* MODE SWITCH */}

        <div className="flex gap-6 mb-8 border-b border-[#E0DED7] pb-3">

          <button
            onClick={()=>setMode("direct")}
            className={`text-sm pb-3 -mb-[14px] transition ${
              mode==="direct"
                ? "font-medium border-b-2 border-[#3E2723]"
                : "opacity-40"
            }`}
          >
            Langsung
          </button>

          <button
            onClick={()=>setMode("delegate")}
            className={`text-sm pb-3 -mb-[14px] transition ${
              mode==="delegate"
                ? "font-medium border-b-2 border-[#3E2723]"
                : "opacity-40"
            }`}
          >
            Diwakilkan
          </button>

        </div>



        {/* INPUT FIELDS */}

        {mode === "delegate" ? (

          <div className="space-y-5 mb-8">

            <div>

              <div className="text-[10px] uppercase tracking-widest opacity-40 mb-1">
                Nama Wakil
              </div>

              <input
                value={delegateName}
                onChange={(e)=>setDelegateName(e.target.value)}
                className="w-full bg-transparent border-b border-[#E0DED7] py-2 outline-none focus:border-[#3E2723] transition-colors"
              />

            </div>


            <div>

              <div className="text-[10px] uppercase tracking-widest opacity-40 mb-1">
                Hubungan
              </div>

              <input
                value={relation}
                onChange={(e)=>setRelation(e.target.value)}
                className="w-full bg-transparent border-b border-[#E0DED7] py-2 outline-none focus:border-[#3E2723] transition-colors"
              />

            </div>


            <div>

              <div className="text-[10px] uppercase tracking-widest opacity-40 mb-1">
                Catatan
              </div>

              <input
                value={notes}
                onChange={(e)=>setNotes(e.target.value)}
                className="w-full bg-transparent border-b border-[#E0DED7] py-2 outline-none focus:border-[#3E2723] transition-colors"
              />

            </div>

          </div>

        ) : (

          <div className="mb-8">

            <div className="text-[10px] uppercase tracking-widest opacity-40 mb-1">
              Catatan
            </div>

            <textarea
              rows={2}
              value={notes}
              onChange={(e)=>setNotes(e.target.value)}
              className="w-full bg-transparent border-b border-[#E0DED7] py-2 outline-none focus:border-[#3E2723] transition-colors resize-none"
            />

          </div>

        )}



        {/* ACTION BUTTONS */}

        <div className="grid grid-cols-2 gap-4 mb-6">

          <Link
            href={`/handover/${id}/qr`}
            className="
            aspect-square
            border border-[#E0DED7]
            flex flex-col items-center justify-center
            rounded-sm
            shadow-sm
            active:scale-95 active:shadow-none
            transition
            "
          >

            <QrCode
              size={30}
              strokeWidth={1.5}
              className="mb-2 opacity-80"
            />

            <span className="text-[10px] uppercase tracking-widest">
              QR Code
            </span>

          </Link>



          <SquarePhotoInput
            onPhoto={handlePhotoCapture}
            disabled={
              saving ||
              (mode === "delegate" &&
                (!delegateName.trim() || !relation.trim()))
            }
          />

        </div>



        {/* GUIDELINE */}

        {!photo && (

          <p className="text-[11px] text-center text-[#A1887F] leading-relaxed mb-6">

            Pilih salah satu cara:

            <br/>

            • Scan QR

            <br/>

            • Atau ambil foto

          </p>

        )}



        {/* PHOTO PREVIEW */}

        {photo && (

          <div className="relative w-full aspect-square border border-[#E0DED7] rounded-sm overflow-hidden mb-8">

            <Image
              src={photo}
              alt="Bukti Serah Terima"
              fill
              priority
              className="object-cover"
            />

            {saving && (

              <div className="absolute inset-0 bg-[#FAF9F6]/60 flex items-center justify-center">

                <span className="text-[10px] uppercase tracking-[0.2em] font-bold animate-pulse">
                  Menyimpan...
                </span>

              </div>

            )}

          </div>

        )}

      </main>



      {/* FOOTER NAV */}

      <div className="flex justify-between px-6 pb-6 text-sm">

        <button
          onClick={()=>router.back()}
          className="opacity-40 flex items-center gap-1 active:opacity-80 transition"
        >

          <ChevronLeft size={16} />

          <span>Kembali</span>

        </button>

      </div>

    </div>

  )

}
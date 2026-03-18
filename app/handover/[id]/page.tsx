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



        {/* INPUT FIELDS */}

        {mode === "delegate" ? (

          <div className="space-y-6 mb-10">

            <div>

              <div className="text-[10px] uppercase tracking-widest opacity-40 mb-2">
                Nama Wakil
              </div>

              <input
                value={delegateName}
                onChange={(e)=>setDelegateName(e.target.value)}
                className="w-full bg-transparent border-b border-[#E0DED7] py-2 outline-none focus:border-[#3E2723] transition-colors"
              />

            </div>


            <div>

              <div className="text-[10px] uppercase tracking-widest opacity-40 mb-2">
                Hubungan
              </div>

              <input
                value={relation}
                onChange={(e)=>setRelation(e.target.value)}
                className="w-full bg-transparent border-b border-[#E0DED7] py-2 outline-none focus:border-[#3E2723] transition-colors"
              />

            </div>


            <div>

              <div className="text-[10px] uppercase tracking-widest opacity-40 mb-2">
                Catatan (Opsional)
              </div>

              <input
                value={notes}
                onChange={(e)=>setNotes(e.target.value)}
                className="w-full bg-transparent border-b border-[#E0DED7] py-2 outline-none focus:border-[#3E2723] transition-colors"
              />

            </div>

          </div>

        ) : (

          <div className="mb-10">

            <div className="text-[10px] uppercase tracking-widest opacity-40 mb-2">
              Catatan (Opsional)
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
            className="aspect-square border border-[#E0DED7] flex flex-col items-center justify-center rounded-sm active:bg-[#F2F1ED] transition-colors"
          >

            <QrCode
              size={32}
              strokeWidth={1.5}
              className="mb-3 opacity-80"
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

          <p className="text-[11px] text-center text-[#A1887F] leading-relaxed mb-8">

            Pilih salah satu cara untuk menyelesaikan serah terima:

            <br/>

            • Tunjukkan QR kepada penerima untuk dipindai

            <br/>

            • Atau ambil foto saat paket diserahkan

          </p>

        )}



        {/* PHOTO PREVIEW */}

        {photo && (

          <div className="relative w-full aspect-square border border-[#E0DED7] rounded-sm overflow-hidden mb-10">

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

      <div className="flex justify-between px-8 pb-8 text-sm">

        <button
          onClick={()=>router.back()}
          className="opacity-40 flex items-center gap-1 hover:opacity-100 transition-opacity"
        >

          <ChevronLeft size={16} />

          <span>Kembali</span>

        </button>

      </div>

    </div>

  )

}
'use client'

import { useState, useEffect } from "react"
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

  // 🔥 NEW: load data
  const [handover,setHandover] = useState<any>(null)

  useEffect(()=>{
    load()
  },[])

  async function load(){
    const res = await fetch(`/api/handover/detail?id=${id}`)
    const data = await res.json()
    setHandover(data)
  }

  async function handlePhotoCapture(file: File, preview: string){

    if(mode === "delegate"){
      if(!delegateName.trim() || !relation.trim()){
        alert(`Isi nama wakil dan hubungan terlebih dahulu`)
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
        alert(data.error || "Gagal")
      }

    }catch{
      setSaving(false)
      alert("Error koneksi")
    }
  }


  return(

    <div className="min-h-full bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">

      <main className="p-6 pt-6">

        {/* 🔥 HEADER */}
        <h2 className="text-2xl font-medium mb-4">
          Serah Terima
        </h2>

        {/* 🔥 IDENTITY */}
        {handover && (
          <div className="space-y-1 mb-6 text-sm">

            <div className="flex justify-between">
              <span className="opacity-50">Dari</span>
              <span>{handover.sender_name || "-"}</span>
            </div>

            <div className="flex justify-between">
              <span className="opacity-50">Untuk</span>
              <span>{handover.receiver_target_name || "-"}</span>
            </div>

          </div>
        )}

        {/* 🔥 PACKAGE */}
        {handover?.handover_items?.length > 0 && (
          <div className="space-y-3 mb-8">

            {handover.handover_items.map((item:any)=>(
              <div key={item.id} className="flex gap-3 items-center">

                <div className="w-20 h-20 border border-[#E0DED7] rounded-sm overflow-hidden flex-shrink-0">
                  {item.photo_url && (
                    <img
                      src={item.photo_url}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="text-sm">
                  {item.description || "-"}
                </div>

              </div>
            ))}

          </div>
        )}

        {/* MODE */}
        <div className="flex gap-6 mb-6 border-b border-[#E0DED7] pb-3">

          <button
            onClick={()=>setMode("direct")}
            className={`text-sm pb-3 -mb-[14px] ${
              mode==="direct"
                ? "font-medium border-b-2 border-[#3E2723]"
                : "opacity-40"
            }`}
          >
            Langsung
          </button>

          <button
            onClick={()=>setMode("delegate")}
            className={`text-sm pb-3 -mb-[14px] ${
              mode==="delegate"
                ? "font-medium border-b-2 border-[#3E2723]"
                : "opacity-40"
            }`}
          >
            Diwakilkan
          </button>

        </div>

        {/* INPUT */}
        {mode === "delegate" ? (

          <div className="space-y-5 mb-6">

            <input
              placeholder="Nama wakil"
              value={delegateName}
              onChange={(e)=>setDelegateName(e.target.value)}
              className="w-full border-b border-[#E0DED7] py-2 outline-none"
            />

            <input
              placeholder="Hubungan"
              value={relation}
              onChange={(e)=>setRelation(e.target.value)}
              className="w-full border-b border-[#E0DED7] py-2 outline-none"
            />

          </div>

        ) : null}

        <textarea
          placeholder="Catatan (opsional)"
          value={notes}
          onChange={(e)=>setNotes(e.target.value)}
          className="w-full border-b border-[#E0DED7] py-2 outline-none mb-6"
        />

        {/* ACTION */}
        <div className="grid grid-cols-2 gap-4 mb-6">

          <Link
            href={`/handover/${id}/qr`}
            className="
            aspect-square
            border border-[#E0DED7]
            flex flex-col items-center justify-center
            rounded-sm
            shadow-md
            active:scale-95 active:shadow-sm active:bg-[#F2F1ED]
            transition
            "
          >
            <QrCode size={28} className="mb-2"/>
            <span className="text-[10px]">QR</span>
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

        {/* PHOTO */}
        {photo && (
          <div className="relative w-full aspect-square border border-[#E0DED7] rounded-sm overflow-hidden mb-6">

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

      {/* 🔥 FOOTER BUTTON FIX */}
      <div className="px-6 pb-6">

        <button
          onClick={()=>router.back()}
          className="
          w-full
          py-3
          rounded-lg
          border border-[#E0DED7]
          shadow-sm
          active:scale-95 active:shadow-none active:bg-[#F2F1ED]
          transition
          "
        >
          Kembali
        </button>

      </div>

    </div>

  )

}
'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

export default function QRPage(){

  const params = useParams()
  const router = useRouter()

  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : ""

  const [qr,setQr] = useState<string>("")

  // 🔥 GET TOKEN → GENERATE QR
  useEffect(()=>{

    if(!id) return

    async function load(){

      const tokenRes = await fetch(`/api/handover/by-token?id=${id}`)
      const tokenData = await tokenRes.json()

      const qrRes = await fetch(`/api/handover/qr?token=${tokenData.share_token}`)
      const qrData = await qrRes.json()

      setQr(qrData.qr)

    }

    load()

  },[id])



  // 🔥 FIXED POLLING (INI YANG PENTING)
  useEffect(()=>{

    if(!id) return

    let interval:any

    async function check(){

      const res = await fetch(`/api/handover/status?id=${id}`)
      const data = await res.json()

      if(
        data.status === "received" ||
        data.status === "accepted"
      ){
        clearInterval(interval)
        router.push("/dashboard")
      }

    }

    interval = setInterval(check,2000)

    return ()=>clearInterval(interval)

  },[id])



  return (

    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">

      <main className="p-8 pt-12 text-center">

        <h2 className="text-xl font-light mb-10">
          Tunjukkan QR ini
        </h2>

        {qr ? (

          <img
            src={qr}
            className="mx-auto w-64 h-64"
          />

        ) : (

          <div className="w-64 h-64 mx-auto border border-[#E0DED7] flex items-center justify-center">
            <span className="text-xs opacity-40">Loading QR...</span>
          </div>

        )}

        <p className="text-[11px] text-[#A1887F] mt-8 leading-relaxed">

          Minta penerima scan QR ini untuk konfirmasi penerimaan paket

        </p>

      </main>



      <div className="flex justify-between px-8 pb-8 text-sm">

        <button
          onClick={()=>router.back()}
          className="opacity-40 flex items-center gap-1"
        >
          <ChevronLeft size={16} />
          <span>Kembali</span>
        </button>

      </div>

    </div>

  )

}
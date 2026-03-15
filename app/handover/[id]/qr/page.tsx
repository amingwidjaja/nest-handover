'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import QRCode from "react-qr-code"
import { ChevronLeft, Loader2 } from "lucide-react"

export default function QRPage(){

  const params = useParams()
  const router = useRouter()

  const id = params.id as string

  const [shareToken,setShareToken] = useState<string | null>(null)
  const [loading,setLoading] = useState(true)

  // ambil share token
  useEffect(()=>{

    async function load(){

      try{

        const res = await fetch(`/api/handover/by-token?id=${id}`)
        const data = await res.json()

        setShareToken(data.share_token)

      }catch(err){

        console.error("token error",err)

      }finally{

        setLoading(false)

      }

    }

    load()

  },[id])


  // polling status setiap 2 detik
  useEffect(()=>{

    if(!shareToken) return

    const interval = setInterval(async()=>{

      try{

        const res = await fetch(`/api/handover/status?id=${id}`)
        const data = await res.json()

        if(data.status === "received"){

          router.replace("/dashboard")

        }

      }catch(err){

        console.error("polling error",err)

      }

    },2000)

    return ()=>clearInterval(interval)

  },[shareToken,id,router])


  if(loading){

    return(

      <div className="min-h-full flex items-center justify-center">

        <Loader2 className="animate-spin text-[#A1887F]" size={32}/>

      </div>

    )

  }


  const url = `${window.location.origin}/receive/${shareToken}`


  return(

    <div className="min-h-full flex flex-col items-center px-8 pt-16 bg-[#FAF9F6] text-[#3E2723]">

      <header className="w-full flex items-center mb-12">

        <button
          onClick={()=>router.back()}
          className="p-2 -ml-2 text-[#A1887F]"
        >
          <ChevronLeft size={24} strokeWidth={1.5}/>
        </button>

        <h1 className="flex-1 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1887F]">
          Scan QR untuk Terima
        </h1>

        <div className="w-8"/>

      </header>


      <div className="bg-white p-6 rounded-sm border border-[#E0DED7] shadow-sm mb-12">

        {shareToken ? (

          <QRCode
            value={url}
            size={200}
            level="H"
          />

        ):(
          <div className="w-[200px] h-[200px] flex items-center justify-center text-xs text-red-400">
            Token tidak ditemukan
          </div>
        )}

      </div>


      <p className="text-center text-[#A1887F] text-sm italic max-w-[240px]">

        Tunjukkan kode ini kepada penerima.

      </p>

      <p className="text-[11px] leading-relaxed text-[#C1BFB9] text-center max-w-[240px] mt-4">

        Halaman ini akan otomatis kembali ke Dashboard setelah penerima melakukan konfirmasi.

      </p>

    </div>

  )

}
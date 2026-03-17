'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SuccessPage(){

  const router = useRouter()

  useEffect(()=>{

    const timer = setTimeout(()=>{
      router.push("/paket")
    },3000)

    return ()=>clearTimeout(timer)

  },[])

  return(

  <div
    onClick={() => router.push("/paket")}
    className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex items-center justify-center p-8 cursor-pointer"
  >

    <div className="text-center space-y-6">

      <div className="text-4xl">
        ✓
      </div>

      <h1 className="text-xl font-light">
        Paket siap diserahkan
      </h1>

      <p className="text-sm opacity-60">
        QR sudah dibuat
      </p>

      <div className="text-xs opacity-40">
        Ketuk layar untuk lanjut
      </div>

    </div>

  </div>

)

}
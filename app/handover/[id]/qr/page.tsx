'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import QRCode from "react-qr-code"

export default function QRPage(){

  const params = useParams()
  const router = useRouter()

  const id = params.id

  const [token,setToken] = useState<string | null>(null)

  async function loadToken(){

    const res = await fetch(`/api/handover/by-token?id=${id}`)
    const data = await res.json()

    setToken(data.share_token)

  }

  async function checkStatus(){

    const res = await fetch(`/api/handover/status?id=${id}`)
    const data = await res.json()

    if(data.status === "received"){
      router.push("/dashboard")
    }

  }

  useEffect(()=>{

    loadToken()

    const interval = setInterval(()=>{
      checkStatus()
    },2000)

    return ()=>clearInterval(interval)

  },[])

  if(!token){
    return <div className="p-8 text-center">Loading QR...</div>
  }

  const url = `${window.location.origin}/receive/${token}`

  return (

    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6]">

      <QRCode
        value={url}
        size={260}
      />

      <p className="text-xs opacity-60 mt-8 text-center">
        Tunjukkan QR ini kepada penerima untuk difoto
      </p>

    </div>

  )

}
'use client'

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import QRCode from "react-qr-code"

export default function QRPage(){

  const params = useParams()
  const id = params.id

  const [token,setToken] = useState<string | null>(null)

  useEffect(()=>{

    async function load(){

      const res = await fetch(`/api/handover/by-token?id=${id}`)
      const data = await res.json()

      setToken(data.share_token)

    }

    load()

  },[id])

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
'use client'

import { useParams } from "next/navigation"
import QRCode from "react-qr-code"

export default function QRPage(){

  const params = useParams()
  const id = params.id

  const url = `${window.location.origin}/receive/${id}`

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
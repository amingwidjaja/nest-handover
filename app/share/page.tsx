'use client'

import { useEffect, useState } from "react"
import Link from "next/link"

export default function SharePage(){

  const [qr,setQr] = useState<string>("")

  useEffect(()=>{

    const token = localStorage.getItem("handover_token")

    async function load(){

      const res = await fetch(`/api/handover/qr?token=${token}`)
      const data = await res.json()

      setQr(data.qr)

    }

    load()

  },[])


  return(

    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">

      <main className="p-8 pt-16 text-center space-y-10">

        <h1 className="text-xl font-light">
          Scan untuk menerima paket
        </h1>

        {qr && (

          <img
            src={qr}
            className="mx-auto w-64"
          />

        )}

        <p className="text-sm opacity-60">
          Penerima cukup scan QR ini
        </p>

      </main>


      <div className="flex justify-between px-8 pb-8 text-sm">

        <Link href="/package" className="opacity-60">
          ← Sebelumnya
        </Link>

        <Link href="/events" className="font-medium">
          Lanjut →
        </Link>

      </div>

    </div>

  )

}
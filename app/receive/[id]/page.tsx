'use client'

import { useParams } from "next/navigation"
import { useState } from "react"

export default function ReceivePage(){

  const params = useParams()
  const id = params.id

  const [name,setName] = useState("")
  const [relation,setRelation] = useState("")

  async function confirm(){

    const res = await fetch("/api/handover/receive",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        handover_id:id,
        receiver_name:name,
        receiver_relation:relation,
        receive_method:"qr"
      })
    })

    const data = await res.json()

    if(data.success){
      window.location.href="/log"
    }else{
      alert("Gagal menyimpan penerimaan")
    }

  }

  return(

    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-8">

      <div className="w-full max-w-sm space-y-8">

        <h2 className="text-xl text-center">
          Konfirmasi penerimaan paket
        </h2>

        <input
          className="line-input w-full"
          placeholder="Nama penerima"
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <input
          className="line-input w-full"
          placeholder="Hubungan dengan penerima"
          value={relation}
          onChange={(e)=>setRelation(e.target.value)}
        />

        <button
          onClick={confirm}
          className="w-full py-3 border border-[#3E2723]"
        >
          Konfirmasi Terima
        </button>

      </div>

    </div>

  )

}
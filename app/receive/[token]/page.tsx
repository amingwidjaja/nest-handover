'use client'

import { useParams } from "next/navigation"
import { useState } from "react"

export default function ReceivePage(){

  const params = useParams()
  const token = params.token

  const [name,setName] = useState("")
  const [relation,setRelation] = useState("")
  const [done,setDone] = useState(false)

  async function confirm(){

    const res = await fetch("/api/handover/receive",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        token,
        receiver_name:name,
        receiver_relation:relation,
        receive_method:"direct_qr"
      })
    })

    const data = await res.json()

    if(data.success){
      setDone(true)
    }else{
      alert(data.error || "Gagal menyimpan penerimaan")
    }

  }

  if(done){
    return(
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h2 className="text-xl">
            Paket berhasil diterima
          </h2>
          <p className="text-sm text-gray-600">
            Terima kasih
          </p>
        </div>
      </div>
    )
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
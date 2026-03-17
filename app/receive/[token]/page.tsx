'use client'

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"

export default function ReceivePage(){

  const params = useParams()
  const token = params.token as string

  const [name,setName] = useState("")
  const [relation,setRelation] = useState("")
  const [type,setType] = useState<"direct"|"proxy">("direct")

  const [loading,setLoading] = useState(false)
  const [done,setDone] = useState(false)

  async function confirm(){

    if(loading) return

    if(type === "proxy" && !name.trim()){
      alert("Nama penerima wajib diisi")
      return
    }

    setLoading(true)

    const res = await fetch("/api/handover/receive",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        token,
        receiver_name:name,
        receiver_relation:relation,
        receive_method: type === "direct" ? "direct_qr" : "proxy_qr",
        receiver_type: type
      })
    })

    const data = await res.json()

    setLoading(false)

    if(data.success){
      setDone(true)
    }else{
      alert(data.error || "Gagal menyimpan penerimaan")
    }

  }

  // 🔥 auto redirect after success
  useEffect(()=>{
    if(done){
      setTimeout(()=>{
        window.location.href = "/paket"
      },2000)
    }
  },[done])

  // 🔥 SUCCESS PAGE
  if(done){
    return(
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-8">

        <div className="text-center space-y-4">

          <h2 className="text-xl">
            {type === "direct"
              ? "Paket berhasil diterima"
              : "Paket berhasil dititipkan"}
          </h2>

          <p className="text-sm text-gray-600">
            Terima kasih
          </p>

        </div>

      </div>
    )
  }

  // 🔥 FORM PAGE
  return(

    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-8">

      <div className="w-full max-w-sm space-y-8">

        <h2 className="text-xl text-center">
          Konfirmasi penerimaan paket
        </h2>

        {/* RECEIVER TYPE */}
        <div className="space-y-2 text-sm">

          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={type === "direct"}
              onChange={()=>setType("direct")}
            />
            Saya penerima langsung
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={type === "proxy"}
              onChange={()=>setType("proxy")}
            />
            Saya mewakili penerima
          </label>

        </div>

        {/* INPUT NAME */}
        <input
          className="line-input w-full"
          placeholder={
            type === "direct"
              ? "Nama (opsional)"
              : "Nama penerima"
          }
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        {/* INPUT RELATION */}
        <input
          className="line-input w-full"
          placeholder="Hubungan dengan penerima (opsional)"
          value={relation}
          onChange={(e)=>setRelation(e.target.value)}
        />

        {/* BUTTON */}
        <button
          onClick={confirm}
          disabled={loading}
          className="w-full py-3 border border-[#3E2723] disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Konfirmasi Terima"}
        </button>

      </div>

    </div>

  )

}
'use client'

import { useEffect,useState } from "react"
import { useParams } from "next/navigation"

export default function VerifyPage(){

  const params = useParams()
  const token = params.token as string

  const [handover,setHandover] = useState<any>(null)

  useEffect(()=>{

    async function load(){

      const res = await fetch(`/api/handover/by-token?token=${token}`)
      const data = await res.json()

      setHandover(data)

    }

    load()

  },[token])


  if(!handover){
    return <div className="p-8">Data tidak ditemukan</div>
  }

  return(

    <div className="min-h-screen p-8 bg-[#FAF9F6] text-[#3E2723]">

      <h1 className="text-xl mb-8">
        Verifikasi Tanda Terima
      </h1>

      <div className="space-y-2 text-sm">

        <div>
          Pengirim: {handover.sender_name || "-"}
        </div>

        <div>
          Penerima: {handover.receiver_target_name}
        </div>

        <div>
          Status: {handover.status}
        </div>

      </div>

    </div>

  )

}
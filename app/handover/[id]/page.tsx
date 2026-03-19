'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

export default function HandoverPage(){

  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [data,setData] = useState<any>(null)
  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    load()
  },[id])

  async function load(){

    const res = await fetch(`/api/handover/detail?id=${id}`)
    const json = await res.json()

    setData(json)
    setLoading(false)

  }

  if(loading){
    return(
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        Memuat...
      </div>
    )
  }

  if(!data){
    return(
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        Data tidak ditemukan
      </div>
    )
  }

  return(

    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col">

      {/* HEADER */}
      <div className="px-5 pt-6 pb-4 space-y-2">

        <div className="flex justify-between items-center">
          <h1 className="text-lg font-medium">
            Serah Terima
          </h1>

          <span className="text-xs opacity-60">
            {data.status}
          </span>
        </div>

        <div className="text-xs opacity-60">
          {data.sender_name || "-"} → {data.receiver_target_name || "-"}
        </div>

      </div>

      <div className="border-t border-[#E0DED7]" />

      {/* CONTENT */}
      <main className="px-5 py-4 space-y-6 flex-1">

        {/* ITEMS */}
        <div className="space-y-3">

          <div className="text-xs uppercase tracking-widest opacity-60">
            Paket
          </div>

          <div className="space-y-3">

            {data.handover_items?.map((item:any)=>(
              <div
                key={item.id}
                className="flex items-center gap-3"
              >

                {/* PHOTO */}
                <div className="w-16 h-16 bg-[#EEE] rounded-sm overflow-hidden flex-shrink-0">

                  {item.photo_url ? (
                    <img
                      src={item.photo_url}
                      className="w-full h-full object-cover"
                    />
                  ) : null}

                </div>

                {/* TEXT */}
                <div className="text-sm">
                  {item.description || "-"}
                </div>

              </div>
            ))}

          </div>

        </div>

      </main>

      {/* ACTION */}
      <div className="px-5 pb-6 space-y-3">

        <button
          onClick={()=>router.push(`/handover/${id}/qr`)}
          className="
          w-full py-4
          bg-[#3E2723] text-white
          rounded-xl
          shadow-md
          active:scale-95 active:shadow-sm
          transition
          "
        >
          Tampilkan QR
        </button>

        <button
          onClick={()=>router.push(`/handover/${id}/photo`)}
          className="
          w-full py-4
          border border-[#E0DED7]
          rounded-xl
          shadow-sm
          active:scale-95 active:shadow-none
          transition
          "
        >
          Foto Serah Terima
        </button>

        <div className="text-center pt-2">
          <Link href="/package" className="text-xs opacity-60">
            Kembali
          </Link>
        </div>

      </div>

    </div>

  )

}
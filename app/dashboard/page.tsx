'use client'

import { useEffect, useState } from "react"
import Link from "next/link"

export default function DashboardPage(){

  const [handovers,setHandovers] = useState<any[]>([])

  useEffect(()=>{

    async function load(){

      const res = await fetch("/api/handover/list")
      const data = await res.json()

      setHandovers(data.handovers || [])

    }

    load()

  },[])


  return(

    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723]">

      <main className="p-8 pt-16">

        <h1 className="text-xl mb-10">
          Logbook Paket
        </h1>

        <div className="space-y-6">

          {handovers.map(h=>{

            return(

              <Link
                key={h.id}
                href={`/receipt/${h.share_token}`}
                className="block border-b border-[#E0DED7] pb-4"
              >

                <div className="text-sm">

                  <div>
                    {h.sender_name || "-"} → {h.receiver_target_name}
                  </div>

                  <div className="text-xs">

  {h.status === "received" && (
    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
      Diterima
    </span>
  )}

  {h.status === "created" && (
    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
      Menunggu
    </span>
  )}

  {h.status === "draft" && (
    <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded">
      Draft
    </span>
  )}

</div>

                </div>

              </Link>

            )

          })}

        </div>

      </main>

    </div>

  )

}
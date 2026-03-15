'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Handover = {
  id: string
  status: string
  created_at: string
  received_at: string | null
}

type ReceiveEvent = {
  receiver_name: string
  receive_method: string
}

export default function LogPage(){

  const [pending,setPending] = useState<Handover[]>([])
  const [received,setReceived] = useState<(Handover & {receive?:ReceiveEvent})[]>([])

  useEffect(()=>{

    async function load(){

      // pending
      const { data:pendingData } = await supabase
        .from("handover")
        .select("*")
        .neq("status","received")
        .order("created_at",{ ascending:false })

      // received
      const { data:receivedData } = await supabase
        .from("handover")
        .select(`
          *,
          receive_event (
            receiver_name,
            receive_method
          )
        `)
        .eq("status","received")
        .order("received_at",{ ascending:false })

      setPending(pendingData || [])

      const formatted = (receivedData || []).map((r:any)=>({
        ...r,
        receive:r.receive_event?.[0]
      }))

      setReceived(formatted)

    }

    load()

  },[])

  return(

    <div className="min-h-screen bg-[#FAF9F6] p-8 max-w-xl mx-auto space-y-12">

      <h1 className="text-xl text-center">
        Log Book
      </h1>

      {/* PENDING */}

      <div>

        <h2 className="text-sm opacity-60 mb-4">
          Pending
        </h2>

        <div className="space-y-3">

          {pending.map(p=>(
            <div
              key={p.id}
              className="border p-3 text-sm"
            >

              <div className="font-mono text-xs">
                {p.id.slice(0,8)}
              </div>

              <div className="opacity-60 text-xs">
                Created {new Date(p.created_at).toLocaleString()}
              </div>

            </div>
          ))}

        </div>

      </div>

      {/* RECEIVED */}

      <div>

        <h2 className="text-sm opacity-60 mb-4">
          Received
        </h2>

        <div className="space-y-3">

          {received.map(r=>(
            <div
              key={r.id}
              className="border p-3 text-sm"
            >

              <div className="font-mono text-xs">
                {r.id.slice(0,8)}
              </div>

              <div className="opacity-60 text-xs">
                Received {new Date(r.received_at || "").toLocaleString()}
              </div>

              {r.receive && (
                <div className="text-xs mt-1">
                  {r.receive.receiver_name} • {r.receive.receive_method}
                </div>
              )}

            </div>
          ))}

        </div>

      </div>

    </div>

  )

}
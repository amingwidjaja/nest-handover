'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Row = {
  id:string
  created_at:string
  received_at:string | null
  status:string
  receiver_name?:string
  receive_method?:string
  package?:string
}

export default function LogPage(){

  const [pending,setPending] = useState<Row[]>([])
  const [received,setReceived] = useState<Row[]>([])

  useEffect(()=>{

    async function load(){

      const { data } = await supabase
        .from("handover")
        .select(`
          id,
          status,
          created_at,
          received_at,
          handover_items(description),
          receive_event(receiver_name,receive_method)
        `)

      if(!data) return

      const rows = data.map((r:any)=>{

        const firstItem = r.handover_items?.[0]?.description || ""

        const packageText =
          firstItem.length > 40
          ? firstItem.slice(0,40) + "..."
          : firstItem

        return {
          id:r.id,
          created_at:r.created_at,
          received_at:r.received_at,
          status:r.status,
          receiver_name:r.receive_event?.[0]?.receiver_name,
          receive_method:r.receive_event?.[0]?.receive_method,
          package:packageText
        }

      })

      setPending(
        rows
          .filter(r=>r.status!=="received")
          .sort((a,b)=>b.created_at.localeCompare(a.created_at))
      )

      setReceived(
        rows
          .filter(r=>r.status==="received")
          .sort((a,b)=>b.received_at!.localeCompare(a.received_at!))
      )

    }

    load()

  },[])

  function RowView(r:Row,mode:"pending"|"received"){

    const time = mode==="pending"
      ? new Date(r.created_at).toLocaleString()
      : new Date(r.received_at || "").toLocaleString()

    const receiver =
      mode==="pending"
      ? "dalam proses"
      : r.receiver_name || "-"

    const status =
      mode==="pending"
      ? "dalam proses"
      : "paket telah diterima"

    return(

      <div className="grid grid-cols-4 text-xs py-2 border-b border-neutral-200">

        <div>{time}</div>

        <div>{receiver}</div>

        <div className="truncate pr-2">
          {r.package}
        </div>

        <div className="text-right">
          {status}
        </div>

      </div>

    )

  }

  return(

    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center p-6">

      <div className="w-full max-w-3xl space-y-10">

        {/* PENDING */}

        <div className="h-56 overflow-y-auto">

          {pending.map(p=>(
            <RowView key={p.id} {...p} mode="pending"/>
          ))}

        </div>

        {/* RECEIVED */}

        <div className="h-72 overflow-y-auto">

          {received.map(r=>(
            <RowView key={r.id} {...r} mode="received"/>
          ))}

        </div>

        {/* GUIDELINE */}

        <p className="text-[11px] text-neutral-500 text-center leading-relaxed">

          Photo akan di delete otomatis setelah melewati 30 hari,
          atau setelah proses serah terima selesai dan kami buatkan buktinya.
          Terima kasih.

        </p>

      </div>

    </div>

  )

}
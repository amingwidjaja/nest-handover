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


  const pending = handovers.filter(h=>h.status !== "received")
  const received = handovers.filter(h=>h.status === "received")


  function row(h:any){

    const time = new Date(h.created_at).toLocaleTimeString("id-ID",{
      hour:"2-digit",
      minute:"2-digit"
    })

    const receiver = h.receiver_target_name || "-"

    const packageName =
      h.handover_items && h.handover_items.length
        ? h.handover_items[0].description
        : "-"

    return(

      <Link
        key={h.id}
        href={`/handover/${h.id}`}
        className="px-6 py-4 flex items-center justify-between text-[13px] border-b border-[#E0DED7]"
      >

        <span className="w-14 font-mono text-[#A1887F]">
          {time}
        </span>

        <span className="flex-1 font-medium truncate px-2">
          {receiver}
        </span>

        <span className="flex-1 italic text-[#A1887F] truncate">
          {packageName}
        </span>

        <span className="w-4 text-right">
          {h.status === "received" ? "✓" : "○"}
        </span>

      </Link>

    )

  }


  return(

    <main className="flex flex-col min-h-full text-[#3E2723]">

      {/* HEADER */}

      <header className="px-6 py-8 shrink-0">
        <h1 className="text-xl font-medium tracking-tight">
          Daftar Paket
        </h1>
      </header>



      {/* SECTION 1 */}

      <section className="flex flex-col flex-1 min-h-0 overflow-hidden border-b border-[#E0DED7]">

        <div className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-[#A1887F] bg-[#F2F1ED]/50 shrink-0">
          Dalam Proses
        </div>

        <div className="flex-1 overflow-y-auto">
          {pending.map(row)}
        </div>

      </section>



      {/* SECTION 2 */}

      <section className="flex flex-col flex-1 min-h-0 overflow-hidden">

        <div className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-[#A1887F] bg-[#F2F1ED]/50 shrink-0">
          Paket Telah Diterima
        </div>

        <div className="flex-1 overflow-y-auto opacity-60">
          {received.map(row)}
        </div>

      </section>



      {/* FOOTER */}

      <footer className="p-6 border-t border-[#E0DED7] shrink-0">

        <p className="text-[10px] leading-relaxed text-[#A1887F] text-center italic">

          Photo akan di delete otomatis setelah melewati 30 hari,
          atau setelah proses serah terima selesai dan kami buatkan buktinya.
          Terima kasih.

        </p>

      </footer>

    </main>

  )

}
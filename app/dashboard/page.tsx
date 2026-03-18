'use client'

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Home } from "lucide-react"
import { useRouter } from "next/navigation"

export default function DashboardPage(){

  const router = useRouter()

  const [handovers,setHandovers] = useState<any[]>([])
  const [selectMode,setSelectMode] = useState(false)
  const [selected,setSelected] = useState<string[]>([])
  const [highlightId,setHighlightId] = useState<string | null>(null)

  const timerRef = useRef<any>(null)

  useEffect(()=>{
    load()
  },[])

  async function load(){

    const res = await fetch("/api/handover/list", {
      cache: "no-store"
    })

    const data = await res.json()

    const rows = data.handovers || []

    setHandovers(rows)

    if(rows.length){
      window.scrollTo({ top:0 })
      setHighlightId(rows[0].id)

      setTimeout(()=>{
        setHighlightId(null)
      },3000)
    }
  }

  function toggleSelect(id:string){
    if(selected.includes(id)){
      setSelected(selected.filter(i=>i!==id))
    }else{
      setSelected([...selected,id])
    }
  }

  function startSelect(id:string){
    setSelectMode(true)
    setSelected([id])
  }

  function cancelSelect(){
    setSelectMode(false)
    setSelected([])
  }

  async function deleteSelected(){

    if(selected.length === 0) return

    if(!confirm("Hapus paket yang dipilih?")) return

    const res = await fetch("/api/handover/delete",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        ids:selected
      })
    })

    const data = await res.json()

    if(!res.ok){
      alert(data.error || "Tidak bisa menghapus paket")
      return
    }

    cancelSelect()
    load()
  }

  const pending = handovers.filter(h=>h.status === "created")
  const received = handovers.filter(
    h=>h.status === "received" || h.status === "accepted"
  )

  function getDateLabel(dateString:string){

    const d = new Date(dateString)
    const now = new Date()

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())

    if(target.getTime() === today.getTime()) return "Hari ini"
    if(target.getTime() === yesterday.getTime()) return "Kemarin"

    return new Intl.DateTimeFormat("id-ID",{
      day:"numeric",
      month:"short"
    }).format(d)
  }

  function isToday(dateString:string){
    return getDateLabel(dateString) === "Hari ini"
  }

  function handleClick(h:any){

    if(selectMode){
      toggleSelect(h.id)
      return
    }

    if(h.status === "accepted"){
      router.push(`/api/handover/pdf?token=${h.share_token}`)
    }
    else if(h.status === "received"){
      router.push(`/handover/${h.id}/documents`)
    }
    else{
      router.push(`/handover/${h.id}`)
    }
  }

  function row(h:any){

    const date = getDateLabel(h.created_at)

    const receiver = h.receiver_target_name || "-"

    const packageName =
      h.handover_items && h.handover_items.length
        ? h.handover_items[0].description
        : "-"

    const checked = selected.includes(h.id)
    const today = isToday(h.created_at)

    return(

      <div
        key={h.id}

        style={{ WebkitUserSelect:"none" }}

        onClick={()=>handleClick(h)}

        onContextMenu={(e)=>{
          e.preventDefault()
          if(!selectMode){
            startSelect(h.id)
          }
        }}

        onTouchStart={()=>{
          timerRef.current = setTimeout(()=>{
            if(!selectMode){
              startSelect(h.id)
            }
          },500)
        }}

        onTouchEnd={()=>{
          clearTimeout(timerRef.current)
        }}

        className={`
          px-6 py-4 flex items-center justify-between text-[13px]
          cursor-pointer
          ${highlightId === h.id ? "new-row" : ""}
          ${checked ? "bg-[#3E2723]/10" : ""}
        `}
      >

        {/* DATE + VERTICAL LINE */}

        <div className="w-16 flex items-center gap-2">

          {today && (
            <div className="w-[4px] h-6 bg-[#3E2723]/60 rounded-sm"></div>
          )}

          <span className="font-mono text-[#A1887F]">
            {date}
          </span>

        </div>

        <span className="flex-1 font-medium truncate px-2">
          {receiver}
        </span>

        <span className="flex-1 italic text-[#A1887F] truncate">
          {packageName}
        </span>

      </div>

    )

  }

  return(

    <main className="flex flex-col min-h-full text-[#3E2723]">

      {/* HEADER */}
      <header className="px-6 py-8 shrink-0 flex items-center justify-between">

        <h1 className="text-xl font-medium tracking-tight">
          Daftar Paket
        </h1>

        <Link href="/paket">
          <Home size={20} strokeWidth={1.5} className="opacity-60"/>
        </Link>

      </header>

      {/* DALAM PROSES */}
      <section className="flex flex-col flex-1 min-h-0 overflow-hidden border-b border-[#E0DED7]">

        <div className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-[#A1887F] bg-[#F2F1ED]/50 shrink-0">
          Dalam Proses
        </div>

        <div className="flex-1 overflow-y-auto">
          {pending.map(row)}
        </div>

      </section>

      {/* SUDAH DITERIMA */}
      <section className="flex flex-col flex-1 min-h-0 overflow-hidden">

        <div className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-[#A1887F] bg-[#F2F1ED]/50 shrink-0">
          Paket Telah Diterima
        </div>

        <div className="flex-1 overflow-y-auto opacity-60">
          {received.map(row)}
        </div>

      </section>

      {/* FOOTER NOTE */}
      <footer className="p-6 border-t border-[#E0DED7] shrink-0">

        <p className="text-[10px] leading-relaxed text-[#A1887F] text-center italic">
          Foto akan dihapus otomatis setelah 30 hari.
          Paket yang dititipkan akan dianggap telah diterima oleh penerima setelah 3 hari.
        </p>

      </footer>

      {/* SELECT TOOLBAR */}
      {selectMode && (

        <div className="fixed bottom-0 left-0 right-0 bg-[#3E2723] text-white flex items-center justify-between px-6 py-4">

          <span className="text-sm">
            {selected.length} dipilih
          </span>

          <div className="flex gap-6 text-sm">

            <button onClick={cancelSelect}>
              Batal
            </button>

            <button onClick={deleteSelected}>
              Hapus
            </button>

          </div>

        </div>

      )}

    </main>

  )

}
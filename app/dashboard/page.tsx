'use client'

import { useEffect, useState } from "react"

function formatDate(dateString: string) {
  if (!dateString) return "-"

  const date = new Date(dateString)

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date)
}

export default function DashboardPage(){

  const [data,setData] = useState<any[]>([])
  const [selected,setSelected] = useState<number[]>([])
  const [loading,setLoading] = useState(true)

  async function load(){

    const res = await fetch("/api/handover/list")
    const json = await res.json()

    if(json.handovers){
      setData(json.handovers)
    }

    setLoading(false)
  }

  useEffect(()=>{
    load()
  },[])

  function toggleSelect(id:number){

    if(selected.includes(id)){
      setSelected(selected.filter(i => i !== id))
    }else{
      setSelected([...selected,id])
    }

  }

  async function handleDelete(){

    if(selected.length === 0) return

    const confirmDelete = confirm("Hapus paket terpilih?")
    if(!confirmDelete) return

    const res = await fetch("/api/handover/delete",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        ids:selected
      })
    })

    const json = await res.json()

    if(json.success){
      setSelected([])
      load()
    }else{
      alert(json.error || "Gagal hapus")
    }

  }

  if(loading){
    return <div className="p-8">Loading...</div>
  }

  return(

    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723]">

      <main className="p-8 space-y-6">

        <div className="flex justify-between items-center">

          <h1 className="text-lg uppercase tracking-widest opacity-60">
            Daftar Paket
          </h1>

          {selected.length > 0 && (
            <button
              onClick={handleDelete}
              className="text-sm opacity-60"
            >
              Hapus ({selected.length})
            </button>
          )}

        </div>

        {data.length === 0 && (
          <div className="text-sm opacity-60">
            Belum ada paket
          </div>
        )}

        <div className="space-y-4">

          {data.map((h:any)=>{

            const isSelected = selected.includes(h.id)

            const statusIcon =
              h.status === "accepted"
                ? "✓"
                : "○"

            return(

              <div
                key={h.id}
                onClick={()=>toggleSelect(h.id)}
                className={`border border-[#E0DED7] p-4 cursor-pointer ${isSelected ? "bg-[#F2F1ED]" : ""}`}
              >

                <div className="flex justify-between items-start">

                  <div className="space-y-1">

                    <div className="text-sm">
                      {h.receiver_target_name || "Tanpa Nama"}
                    </div>

                    <div className="text-xs opacity-60">
                      {formatDate(h.created_at)}
                    </div>

                  </div>

                  <div className="text-lg">
                    {statusIcon}
                  </div>

                </div>

                <div className="mt-3 text-sm opacity-80 space-y-1">

                  {h.handover_items?.slice(0,2).map((item:any)=>(
                    <div key={item.id}>
                      • {item.description}
                    </div>
                  ))}

                  {h.handover_items?.length > 2 && (
                    <div className="text-xs opacity-50">
                      +{h.handover_items.length - 2} lainnya
                    </div>
                  )}

                </div>

              </div>

            )

          })}

        </div>

      </main>

    </div>

  )

}
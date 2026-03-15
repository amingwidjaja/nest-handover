'use client'

import { useEffect, useState } from "react"

export default function DashboardPage(){

  const [handovers,setHandovers] = useState<any[]>([])
  const [selected,setSelected] = useState<number[]>([])
  const [selectMode,setSelectMode] = useState(false)

  async function load(){

    const res = await fetch("/api/handover/list")
    const data = await res.json()

    setHandovers(data.handovers || [])

  }

  useEffect(()=>{
    load()
  },[])

  function toggleSelect(id:number){

    if(!selectMode){
      setSelectMode(true)
      setSelected([id])
      return
    }

    if(selected.includes(id)){
      setSelected(selected.filter(x=>x!==id))
    }else{
      setSelected([...selected,id])
    }

  }

  async function deleteSelected(){

    if(selected.length===0) return

    const ok = confirm("Hapus event yang dipilih?")
    if(!ok) return

    await fetch("/api/handover/delete",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        ids:selected
      })
    })

    setSelected([])
    setSelectMode(false)

    load()

  }

  return(

    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723]">

      <main className="p-8 pt-16">

        <div className="flex justify-between items-center mb-10">

          <h1 className="text-xl">
            Daftar Paket
          </h1>

          {selectMode ? (
            <button
              onClick={deleteSelected}
              className="text-red-600 text-sm"
            >
              Hapus ({selected.length})
            </button>
          ) : (
            <span className="text-xs opacity-40">
              tahan untuk pilih
            </span>
          )}

        </div>

        <div className="space-y-6">

          {handovers.map(h=>{

            const active = selected.includes(h.id)

            return(

              <div
                key={h.id}
                onClick={()=>toggleSelect(h.id)}
                className={`border-b border-[#E0DED7] pb-4 cursor-pointer ${
                  active ? "bg-red-50" : ""
                }`}
              >

                <div className="text-sm">

                  <div>
                    {h.sender_name || "-"} → {h.receiver_target_name}
                  </div>

                  <div className="text-xs opacity-60">
                    {h.status}
                  </div>

                </div>

              </div>

            )

          })}

        </div>

      </main>

    </div>

  )

}
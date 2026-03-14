'use client'

import { useState } from "react"
import Link from "next/link"
import { Camera } from "lucide-react"

export default function PackagePage() {

  const [items,setItems] = useState([
    "",
    "",
    "",
    ""
  ])


  function updateItem(index:number,value:string){

    const copy = [...items]
    copy[index] = value
    setItems(copy)

  }


  async function next(){

    const handover_id = localStorage.getItem("handover_id")

    const cleanItems = items
      .filter(i => i.trim()!=="")
      .map(i => ({
        description:i,
        photo_url:null
      }))


    await fetch("/api/handover/create",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        handover_id,
        items:cleanItems
      })
    })


    window.location.href="/events"

  }


  return (

    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">

      <main className="p-8 pt-16">

        <h2 className="text-xs font-medium uppercase tracking-[0.2em] mb-12 opacity-60">
          tulis rincian paket kamu di sini
        </h2>


        <div className="space-y-0 mb-16">

          {items.map((item,i)=>(
            <input
              key={i}
              className="line-input"
              placeholder={i===0?"1. Nama barang...":""}
              value={item}
              onChange={(e)=>updateItem(i,e.target.value)}
            />
          ))}

        </div>


        <div className="w-full aspect-[4/3] border border-dashed border-[#E0DED7] flex flex-col items-center justify-center rounded-sm active:bg-[#F2F1ED] transition-colors">

          <Camera
            className="text-[#A1887F] mb-2"
            size={24}
            strokeWidth={1.5}
          />

          <span className="text-xs text-[#A1887F]">
            Tambahkan foto paketmu di sini
          </span>

        </div>

      </main>


      <div className="flex justify-between px-8 pb-8 text-sm">

        <Link href="/create" className="opacity-60">
          ← Sebelumnya
        </Link>

        <button
          onClick={next}
          className="font-medium"
        >
          Lanjut →
        </button>

      </div>

    </div>

  )

}
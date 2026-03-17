'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function UserPage(){

  const router = useRouter()

  const [name,setName] = useState("")
  const [contact,setContact] = useState("")

  function save(){

    if(!name.trim()){
      alert("Nama wajib diisi")
      return
    }

    localStorage.setItem("user_name", name)
    localStorage.setItem("user_contact", contact)

    router.push("/paket")
  }

  return(

    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex items-center justify-center p-8">

      <div className="w-full max-w-sm space-y-8">

        <h1 className="text-xl text-center">
          Profil Pengirim
        </h1>

        <input
          className="line-input w-full"
          placeholder="Nama / Nama Bisnis"
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <input
          className="line-input w-full"
          placeholder="WA / Email (opsional)"
          value={contact}
          onChange={(e)=>setContact(e.target.value)}
        />

        <button
          onClick={save}
          className="w-full py-3 border border-[#3E2723]"
        >
          Simpan
        </button>

      </div>

    </div>

  )

}
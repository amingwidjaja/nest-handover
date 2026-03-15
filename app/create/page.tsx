'use client'

import { useState } from "react"
import Link from "next/link"

export default function CreatePage() {

  const [senderType,setSenderType] = useState("self")
  const [toast,setToast] = useState("")

  const [senderName,setSenderName] = useState("")
  const [senderContact,setSenderContact] = useState("")

  const [receiverName,setReceiverName] = useState("")
  const [receiverContact,setReceiverContact] = useState("")

  function showToast(msg:string){

    setToast(msg)

    setTimeout(()=>{
      setToast("")
    },2000)

  }

  async function submit(){

    if(!receiverName || !receiverContact){
      showToast("Nama dan WA/Email penerima wajib diisi")
      return
    }

    if(senderType==="other" && (!senderName || !senderContact)){
      showToast("Data pengirim wajib diisi")
      return
    }

    const res = await fetch("/api/handover/create",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        sender_name: senderType==="self" ? "self" : senderName,
        receiver_target_name: receiverName,
        receiver_target_phone: receiverContact
      })
    })

    const data = await res.json()

    if(data.success){

      localStorage.setItem("handover_id",data.handover_id)
      localStorage.setItem("handover_token",data.token)

      window.location.href="/package"

    }else{

      showToast("Gagal membuat Serah Terima")

    }

  }

  return (

    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">

      <main className="p-8 pt-16 space-y-12">

        <section>

          <p className="text-sm font-medium mb-6">
            Siapa yang kirim paket ini?
          </p>

          <div className="flex gap-8 mb-8">

            <button
              onClick={()=>setSenderType("self")}
              className="flex items-center gap-2"
            >

              <div className="w-4 h-4 border border-[#3E2723] rounded-full flex items-center justify-center">

                {senderType==="self" &&
                  <div className="w-2 h-2 bg-[#3E2723] rounded-full"></div>
                }

              </div>

              <span className="text-sm">Saya</span>

            </button>

            <button
              onClick={()=>setSenderType("other")}
              className="flex items-center gap-2"
            >

              <div className="w-4 h-4 border border-[#3E2723] rounded-full flex items-center justify-center">

                {senderType==="other" &&
                  <div className="w-2 h-2 bg-[#3E2723] rounded-full"></div>
                }

              </div>

              <span className="text-sm">Orang lain</span>

            </button>

          </div>

          {senderType==="other" && (

            <div className="space-y-4 mb-8">

              <input
                className="line-input"
                placeholder="Nama pengirim"
                value={senderName}
                onChange={e=>setSenderName(e.target.value)}
              />

              <input
                className="line-input"
                placeholder="WA / Email"
                value={senderContact}
                onChange={e=>setSenderContact(e.target.value)}
              />

            </div>

          )}

        </section>

        <section>

          <p className="text-sm font-medium mb-6">
            Paket ini untuk siapa?
          </p>

          <div className="space-y-4">

            <input
              className="line-input"
              placeholder="Nama penerima"
              value={receiverName}
              onChange={e=>setReceiverName(e.target.value)}
            />

            <input
              className="line-input"
              placeholder="WA / Email"
              value={receiverContact}
              onChange={e=>setReceiverContact(e.target.value)}
            />

          </div>

        </section>

      </main>

      <div className="flex justify-between px-8 pb-8 text-sm">

        <Link href="/" className="opacity-60">
          ← Sebelumnya
        </Link>

        <button
          onClick={submit}
          className="font-medium"
        >
          Lanjut →
        </button>

      </div>

      {toast && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2
          bg-[#3E2723] text-white text-sm
          px-5 py-3 rounded-md shadow-lg
          text-center whitespace-pre-line
          animate-[toastSlide_0.25s_ease-out]"
        >
          {toast}
        </div>
      )}

    </div>

  )

}
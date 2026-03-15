'use client';

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Camera, QrCode } from "lucide-react";

export default function HandoverPage() {

  const params = useParams()
  const id = params.id

  const [mode, setMode] = useState("direct")
  const [delegateName, setDelegateName] = useState("")
  const [relation, setRelation] = useState("")
  const [photo, setPhoto] = useState<string | null>(null)
  const [notes, setNotes] = useState("")

  const [gps, setGps] = useState<any>(null)
  const [timestamp, setTimestamp] = useState<any>(null)

  const captureMeta = () => {

    const now = new Date().toISOString()
    setTimestamp(now)

    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition((pos)=>{
        setGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        })
      })
    }

  }

  const handleCameraClick = () => {

    if(mode === "delegate"){
      if(!delegateName.trim() || !relation.trim()){
        alert(
`Isi nama wakil
dan hubungan dengan penerima
terlebih dahulu`
        )
        return
      }
    }

    document.getElementById("handoverCamera")?.click()

  }

  const handleFinish = () => {

    captureMeta()

    const eventLog = [
      {event:"handover_started"},
      {event: photo ? "photo_used" : "qr_used"},
      {event:"handover_completed"}
    ]

    console.log({
      id,
      mode,
      delegateName,
      relation,
      notes,
      photo,
      gps,
      timestamp,
      eventLog
    })

  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">

      <main className="p-8 pt-16">

        <h2 className="text-xl font-light mb-12">
          Serah terima paket
        </h2>

        <div className="flex gap-8 mb-12 border-b border-[#E0DED7] pb-4">

          <button
            onClick={() => setMode("direct")}
            className={`text-sm pb-4 -mb-[18px] ${
              mode === "direct"
                ? "font-bold border-b-2 border-[#3E2723]"
                : "opacity-40"
            }`}
          >
            Penerima langsung
          </button>

          <button
            onClick={() => setMode("delegate")}
            className={`text-sm pb-4 -mb-[18px] ${
              mode === "delegate"
                ? "font-bold border-b-2 border-[#3E2723]"
                : "opacity-40"
            }`}
          >
            Diwakilkan
          </button>

        </div>

        {mode === "delegate" && (

          <div className="space-y-8 mb-12">

            <div>
              <div className="text-sm mb-2">Nama yang mewakili:</div>
              <input
                value={delegateName}
                onChange={(e)=>setDelegateName(e.target.value)}
                className="line-input w-full"
              />
            </div>

            <div>
              <div className="text-sm mb-2">Hubungan dengan penerima:</div>
              <input
                value={relation}
                onChange={(e)=>setRelation(e.target.value)}
                className="line-input w-full"
              />
            </div>

            <div>
              <div className="text-sm mb-2">
                Catatan: <span className="opacity-40">(kalau ada)</span>
              </div>

              <input
                value={notes}
                onChange={(e)=>setNotes(e.target.value)}
                className="line-input w-full"
              />
            </div>

          </div>

        )}

        {mode === "direct" && (

          <div className="mb-12">

            <div className="text-sm mb-2">
              Catatan: <span className="opacity-40">(kalau ada)</span>
            </div>

            <textarea
              rows={2}
              value={notes}
              onChange={(e)=>setNotes(e.target.value)}
              className="line-input w-full"
            />

          </div>

        )}

        <div className="grid grid-cols-2 gap-4 mb-12">

          <Link
            href={`/handover/${id}/qr`}
            className="aspect-square border border-[#E0DED7] flex flex-col items-center justify-center rounded-sm active:bg-[#F2F1ED]"
          >

            <QrCode
              className="text-[#3E2723] mb-3"
              size={32}
              strokeWidth={1.5}
            />

            <span className="text-xs">
              QR Code
            </span>

          </Link>

          <div
            onClick={handleCameraClick}
            className="aspect-square border border-[#E0DED7] flex flex-col items-center justify-center rounded-sm active:bg-[#F2F1ED] cursor-pointer"
          >

            <Camera
              className="text-[#3E2723] mb-3"
              size={32}
              strokeWidth={1.5}
            />

            <span className="text-xs text-center">
              Ambil foto
              <br/>
              serah terima
            </span>

          </div>

        </div>

        <input
          id="handoverCamera"
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e)=>{
            if(!e.target.files) return
            const file = e.target.files[0]
            setPhoto(URL.createObjectURL(file))
          }}
        />

        {photo && (
          <img src={photo} className="w-full rounded-sm mb-12"/>
        )}

      </main>

      <div className="flex justify-between px-8 pb-8 text-sm">

        <Link href="/package" className="opacity-60">
          ← Sebelumnya
        </Link>

        <Link
          href={`/handover/${id}/success`}
          onClick={handleFinish}
        >
          Selesai →
        </Link>

      </div>

    </div>
  );
}
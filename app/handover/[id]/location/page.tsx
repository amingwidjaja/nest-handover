'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MapPin, RotateCcw, ChevronRight } from "lucide-react"

export default function LocationPage(){

  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading,setLoading] = useState(true)
  const [coords,setCoords] = useState<GeolocationCoordinates | null>(null)

  useEffect(()=>{

    navigator.geolocation.getCurrentPosition(
      (pos)=>{
        setCoords(pos.coords)
        setLoading(false)
      },
      ()=>{
        setLoading(false)
      },
      {
        enableHighAccuracy:true,
        timeout:8000
      }
    )

  },[])

  async function submitLocation(){

    if(!coords){
      router.replace(`/handover/${id}/success`)
      return
    }

    try{

      await fetch("/api/handover/receive/location",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body: JSON.stringify({
          handover_id: id,
          gps_lat: coords.latitude,
          gps_lng: coords.longitude,
          gps_accuracy: coords.accuracy
        })
      })

    }catch(err){
      console.log(err)
    }

    router.replace(`/handover/${id}/success`)
  }

  function retryGPS(){
    setLoading(true)

    navigator.geolocation.getCurrentPosition(
      (pos)=>{
        setCoords(pos.coords)
        setLoading(false)
      },
      ()=>{
        setLoading(false)
      },
      {
        enableHighAccuracy:true,
        timeout:8000
      }
    )
  }

  function skip(){
    router.replace(`/handover/${id}/success`)
  }

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-black max-w-md mx-auto border-x border-gray-100">

      {/* HEADER */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold tracking-widest uppercase text-gray-400">
            Step 02/03
          </span>
          <span className="text-xs font-bold text-green-600 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
            GPS
          </span>
        </div>
        <h1 className="text-xl font-black uppercase tracking-tight">
          Confirm Location
        </h1>
      </div>

      {/* MAP */}
      <div className="relative flex-grow bg-gray-100 flex items-center justify-center">
        <MapPin size={48} />
      </div>

      {/* ACTION */}
      <div className="p-6 space-y-3 bg-white">

        <button
          onClick={submitLocation}
          className="w-full bg-black text-white py-5 px-6 font-bold flex justify-between items-center"
        >
          USE THIS LOCATION
          <ChevronRight size={20} />
        </button>

        <button
          onClick={retryGPS}
          className="w-full bg-white border-2 border-black py-4 px-6 font-bold flex justify-center items-center gap-2"
        >
          <RotateCcw size={18} />
          RETRY GPS
        </button>

        <button
          onClick={skip}
          className="w-full py-4 text-sm font-bold text-gray-400 underline"
        >
          Skip (Continue without location)
        </button>

      </div>
    </div>
  )
}
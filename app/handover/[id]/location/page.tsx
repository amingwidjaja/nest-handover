'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { RotateCcw, ChevronRight } from "lucide-react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// 🔥 Fix marker icon (WAJIB)
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

// 🔥 Map Component (LOCAL, CLIENT ONLY)
function ActualMap({ coords }: { coords: { lat: number, lng: number } }) {

  const { MapContainer, TileLayer, Marker, useMap } = require("react-leaflet")

  function Recenter() {
    const map = useMap()
    useEffect(() => {
      map.setView([coords.lat, coords.lng])
    }, [coords, map])
    return null
  }

  return (
    <MapContainer
      center={[coords.lat, coords.lng]}
      zoom={16}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='© OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[coords.lat, coords.lng]} />
      <Recenter />
    </MapContainer>
  )
}

// 🔥 Dynamic wrapper (1x saja)
const MapWrapper = dynamic(
  () => Promise.resolve(ActualMap),
  { ssr: false }
)

export default function LocationPage(){

  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [coords,setCoords] = useState<{lat:number,lng:number,accuracy:number} | null>(null)
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState(false)

  useEffect(()=>{
    getLocation()
  },[])

  function getLocation(){
    setLoading(true)
    setError(false)

    navigator.geolocation.getCurrentPosition(
      (pos)=>{
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        })
        setLoading(false)
      },
      ()=>{
        setError(true)
        setLoading(false)
      },
      {
        enableHighAccuracy:true,
        timeout:8000
      }
    )
  }

  async function submitLocation(){

    if(coords){
      try{
        await fetch("/api/handover/receive/location",{
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body: JSON.stringify({
            handover_id: id,
            gps_lat: coords.lat,
            gps_lng: coords.lng,
            gps_accuracy: coords.accuracy
          })
        })
      }catch(err){
        console.log(err)
      }
    }

    router.replace(`/handover/${id}/success`)
  }

  function skip(){
    router.replace(`/handover/${id}/success`)
  }

  return (
    <div className="flex flex-col h-screen bg-white max-w-md mx-auto border-x">

      {/* HEADER */}
      <div className="p-4 border-b">
        <div className="flex justify-between mb-2">
          <span className="text-xs uppercase text-gray-400">
            Step 02/03
          </span>
          <span className="text-xs text-green-600 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
            GPS ACTIVE
          </span>
        </div>
        <h1 className="text-xl font-bold">
          Confirm Location
        </h1>
      </div>

      {/* MAP AREA */}
      <div className="flex-1 relative">

        {coords && !loading && (
          <MapWrapper coords={coords} />
        )}

        {loading && (
          <div className="absolute inset-0 z-[1000] bg-white flex items-center justify-center text-sm text-gray-400">
            <div className="flex flex-col items-center gap-2">
              <RotateCcw className="animate-spin" size={24} />
              Mendeteksi lokasi...
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-red-400 text-sm p-4 text-center">
            GPS tidak tersedia atau izin ditolak
          </div>
        )}

      </div>

      {/* INFO */}
      {coords && (
        <div className="p-4 text-sm border-t space-y-1">
          <div>Lat: {coords.lat.toFixed(6)}</div>
          <div>Lng: {coords.lng.toFixed(6)}</div>
          <div className="text-xs text-gray-400">
            Akurasi ±{Math.round(coords.accuracy)} meter
          </div>
        </div>
      )}

      {/* ACTION */}
      <div className="p-4 space-y-3">

        <button
          onClick={submitLocation}
          className="w-full bg-black text-white py-4 flex justify-between items-center px-4"
        >
          USE THIS LOCATION
          <ChevronRight size={20} />
        </button>

        <button
          onClick={getLocation}
          className="w-full border-2 border-black py-3 flex justify-center items-center gap-2"
        >
          <RotateCcw size={18} />
          RETRY GPS
        </button>

        <button
          onClick={skip}
          className="w-full text-sm text-gray-400 underline"
        >
          Skip (Continue without location)
        </button>

      </div>

    </div>
  )
}
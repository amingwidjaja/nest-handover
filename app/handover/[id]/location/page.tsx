'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { RotateCcw, ChevronRight } from "lucide-react"
import "leaflet/dist/leaflet.css"

// 🔥 Dynamic Leaflet Wrapper (STABLE)
const MapWrapper = dynamic(
  () => import("react-leaflet").then((mod) => {
    const { MapContainer, TileLayer, Marker, useMap } = mod

    const L = require("leaflet")

    // 🔥 Fix marker icon
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    function Recenter({ lat, lng }: { lat: number; lng: number }) {
      const map = useMap()
      useEffect(() => {
        map.setView([lat, lng])
      }, [lat, lng, map])
      return null
    }

    return function LeafletMap({ coords }: any) {
      return (
        <MapContainer
          center={[coords.lat, coords.lng]}
          zoom={16}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="© OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[coords.lat, coords.lng]} />
          <Recenter lat={coords.lat} lng={coords.lng} />
        </MapContainer>
      )
    }
  }),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-gray-300">
        Membuka peta...
      </div>
    )
  }
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

  // 🔥 GPS FUNCTION (ANTI STUCK VERSION)
  function getLocation(){

    console.log("📡 Checking GPS...")

    setLoading(true)
    setError(false)

    if (!navigator.geolocation) {
      console.error("❌ Geolocation not supported")
      setError(true)
      setLoading(false)
      return
    }

    let resolved = false

    const fallback = setTimeout(() => {
      if (!resolved) {
        console.warn("⚠️ GPS fallback triggered")
        setError(true)
        setLoading(false)
      }
    }, 12000)

    navigator.geolocation.getCurrentPosition(
      (pos)=>{
        resolved = true
        clearTimeout(fallback)

        console.log("📍 GPS Success:", pos.coords)

        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        })

        setLoading(false)
      },
      (err)=>{
        resolved = true
        clearTimeout(fallback)

        console.error("❌ GPS Error:", err)

        setError(true)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
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

  <div className="flex justify-between items-center mb-2">

    <span className="text-xs uppercase text-gray-400">
      Step 02/02
    </span>

    {/* 🔥 GPS STATUS */}
    <span className="text-xs font-bold flex items-center gap-1">

      {loading && (
        <>
          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
          PENCARIAN SIGNAL GPS
        </>
      )}

      {!loading && coords && (
        <>
          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
          GPS DIKUNCI
        </>
      )}

      {!loading && error && (
        <>
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          PENCARIAN GPS GAGAL
        </>
      )}

    </span>

  </div>

  <h1 className="text-xl font-bold">
    Konfirmasi Lokasi
  </h1>

</div>

      {/* MAP */}
      <div className="flex-1 relative bg-gray-50">

        {coords && !loading && (
          <MapWrapper coords={coords} />
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            <div className="flex flex-col items-center gap-2">
              <RotateCcw className="animate-spin" size={24} />
              Mendeteksi lokasi (maks 12 detik)...
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 text-sm text-center p-6">
            GPS tidak tersedia / izin ditolak
            <button
              onClick={getLocation}
              className="mt-4 underline"
            >
              Coba Lagi
            </button>
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
          GUNAKAN LOKASI INI
          <ChevronRight size={20} />
        </button>

        <button
          onClick={getLocation}
          className="w-full border-2 border-black py-3 flex justify-center items-center gap-2"
        >
          <RotateCcw size={18} />
          COBA CARI SIGNAL GPS
        </button>

        <button
          onClick={skip}
          className="w-full text-sm text-gray-400 underline"
        >
          Lewati (Lanjutkan tanpa bukti lokasi)
        </button>

      </div>

    </div>
  )
}
'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { RotateCcw, ChevronRight } from "lucide-react"
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

type Coords = {
  lat: number
  lng: number
  accuracy?: number
}

const DEFAULT_COORDS: Coords = {
  lat: -6.2,
  lng: 106.8,
  accuracy: 0
}

const MapWrapper = dynamic(
  () =>
  import("react-map-gl" as any).then((mod: any) => {
  const { Map, Marker } = mod

    return function MapboxComponent({ coords }: any) {

      if (!MAPBOX_TOKEN) {
        return (
          <div className="flex items-center justify-center h-full text-xs text-red-500">
            Token Map tidak tersedia
          </div>
        )
      }

      return (
        <Map
          key={`${coords.lat}-${coords.lng}`}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: coords.lng,
            latitude: coords.lat,
            zoom: 16
          }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          style={{ width: '100%', height: '100%' }}
        >
          <Marker longitude={coords.lng} latitude={coords.lat} anchor="center">
            <div className="relative flex items-center justify-center">
              <div className="w-8 h-8 bg-black/10 rounded-full animate-ping absolute" />
              <div className="w-4 h-4 bg-black rounded-full border-2 border-white shadow-lg z-10" />
            </div>
          </Marker>
        </Map>
      )
    }
  }),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-zinc-50 text-[10px] font-mono text-zinc-400 tracking-widest uppercase">
        Inisialisasi Peta...
      </div>
    )
  }
)

export default function LocationPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [coords, setCoords] = useState<Coords>(DEFAULT_COORDS)
  const [realCoords, setRealCoords] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getLocation()
  }, [])

  function getLocation() {
    setLoading(true)
    setError(false)

    if (!navigator.geolocation) {
      setError(true)
      setLoading(false)
      return
    }

    let finished = false

    const timeout = setTimeout(() => {
      if (!finished) {
        setError(true)
        setLoading(false)
      }
    }, 10000)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        finished = true
        clearTimeout(timeout)

        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        }

        setCoords(newCoords)
        setRealCoords(newCoords)
        setLoading(false)
      },
      () => {
        finished = true
        clearTimeout(timeout)

        setError(true)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      }
    )
  }

  // 🔥 INI YANG KITA TAMBAH
  async function submitLocation() {
    if (!coords) {
      alert("Lokasi belum tersedia")
      return
    }

    try {
      const res = await fetch("/api/receive/location/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          handover_id: id,
          lat: coords.lat,
          lng: coords.lng,
          accuracy: coords.accuracy || 0
        })
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || "Gagal menyimpan lokasi")
        return
      }

      if (!data.isValid) {
        alert(`Lokasi di luar area (${data.distance}m)`)
        return
      }

      alert("Lokasi berhasil divalidasi")

      router.replace(`/handover/${id}/success`)

    } catch (err) {
      alert("Terjadi kesalahan")
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white max-w-md mx-auto border-x border-zinc-100 font-sans text-zinc-900">

      <div className="p-6 border-b border-zinc-100">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-300 uppercase">
            Sistem / GPS / V.03
          </span>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${
              loading ? 'bg-zinc-200 animate-pulse' :
              realCoords ? 'bg-black' :
              'bg-red-500'
            }`} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {loading ? 'Mencari' : realCoords ? 'Terkunci' : 'Default'}
            </span>
          </div>
        </div>
        <h1 className="text-2xl font-light tracking-tight italic uppercase">
          Validasi Lokasi
        </h1>
      </div>

      <div className="flex-1 relative bg-zinc-50 overflow-hidden">
        <MapWrapper coords={coords} />

        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RotateCcw className="animate-spin" size={20} />
              <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-400">
                Mengunci Sinyal...
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-3 border-y border-zinc-100 bg-zinc-50/50 flex justify-between text-[9px] font-mono text-zinc-500 uppercase">
        <span>Lat // {coords.lat.toFixed(6)}</span>
        <span>Lng // {coords.lng.toFixed(6)}</span>
      </div>

      <div className="p-6 space-y-4">
        <button 
          onClick={submitLocation}   // 🔥 INI SAJA YANG BERUBAH
          className="w-full bg-black text-white py-5 text-xs font-bold tracking-[0.2em] uppercase flex justify-between items-center px-6 active:scale-[0.98]"
        >
          Konfirmasi Lokasi
          <ChevronRight size={16} />
        </button>

        <button
          onClick={getLocation}
          className="w-full border border-zinc-200 py-4 text-[10px] font-bold tracking-[0.2em] uppercase flex justify-center gap-2 hover:bg-zinc-50"
        >
          <RotateCcw size={12} />
          Perbarui Sinyal
        </button>

        <button
          onClick={() => router.replace(`/handover/${id}/success`)}
          className="w-full text-[9px] text-zinc-400 uppercase tracking-[0.3em]"
        >
          Lewati Validasi
        </button>
      </div>
    </div>
  )
}

// trigger deploy
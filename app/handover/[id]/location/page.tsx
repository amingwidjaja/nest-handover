'use client'

import { useEffect, useState, useRef } from "react"
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

const MapWrapper = dynamic<any>(
  () =>
    import("react-map-gl").then((mod) => {
      const { Map, Marker } = mod

      return function MapboxComponent({ coords }: { coords: Coords }) {
        if (!MAPBOX_TOKEN) {
          return (
            <div className="flex items-center justify-center h-full text-[10px] font-mono text-red-600 uppercase tracking-widest px-10 text-center font-bold">
              ERROR: TOKEN MAPBOX TIDAK TERDETEKSI
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
                <div className="w-10 h-10 bg-black/20 rounded-full animate-ping absolute" />
                <div className="w-5 h-5 bg-black rounded-full border-2 border-white shadow-xl z-10" />
              </div>
            </Marker>
          </Map>
        )
      }
    }),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-zinc-100 text-[10px] font-mono text-zinc-500 tracking-[0.2em] uppercase font-bold">
        Memuat Engine Peta...
      </div>
    )
  }
)

export default function LocationPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const watchId = useRef<number | null>(null)

  const [coords, setCoords] = useState<Coords>(DEFAULT_COORDS)
  const [realCoords, setRealCoords] = useState<Coords | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    startTracking()
    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [])

  function startTracking() {
    setLoading(true)
    setErrorMsg(null)

    if (typeof window !== "undefined" && !navigator.geolocation) {
      setErrorMsg("PERANGKAT TIDAK MENDUKUNG GPS")
      setLoading(false)
      return
    }

    // Gunakan watchPosition agar iPhone terus mencoba update lokasi
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        }
        setCoords(newCoords)
        setRealCoords(newCoords)
        setLoading(false) // Begitu dapat posisi pertama kali, stop loading
      },
      (err) => {
        // Jangan langsung error kalau masih mencoba
        if (!realCoords) {
           if (err.code === 1) setErrorMsg("IZIN LOKASI DITOLAK")
           else if (err.code === 2) setErrorMsg("MENCARI SINYAL...")
           else setErrorMsg("TIMEOUT GPS")
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    )
  }

  async function submitLocation() {
    if (!realCoords) return
    try {
      const res = await fetch("/api/receive/location/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handover_id: id,
          lat: coords.lat,
          lng: coords.lng,
          accuracy: coords.accuracy || 0
        })
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || "Gagal proses."); return; }
      if (!data.isValid) { alert(`LUAR RADIUS (${data.distance}m)`); return; }
      router.replace(`/handover/${id}/success`)
    } catch (err) {
      alert("SERVER ERROR");
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white max-w-md mx-auto border-x border-zinc-200 font-sans text-zinc-900 antialiased">
      
      {/* HEADER */}
      <div className="p-6 border-b-2 border-zinc-900 bg-white shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase">
            NEST / UNIT / GPS-V4
          </span>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              loading ? 'bg-yellow-400 animate-pulse' :
              realCoords ? (coords.accuracy && coords.accuracy < 50 ? 'bg-green-600' : 'bg-orange-400') :
              'bg-red-600'
            }`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-800">
              {loading ? 'Searching' : realCoords ? (coords.accuracy && coords.accuracy < 50 ? 'Stable' : 'Weak') : 'Offline'}
            </span>
          </div>
        </div>
        <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">
          Validasi Lokasi
        </h1>
      </div>

      {/* MAP AREA */}
      <div className="flex-1 relative bg-zinc-200 overflow-hidden">
        <MapWrapper coords={coords} />

        {loading && (
          <div className="absolute inset-0 bg-white/95 z-20 flex items-center justify-center p-10 text-center">
            <div className="flex flex-col items-center gap-5">
               <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-zinc-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-t-black rounded-full animate-spin"></div>
               </div>
               <div className="space-y-1">
                  <span className="block text-[10px] tracking-[0.4em] uppercase text-zinc-900 font-black">
                    Sinkronisasi...
                  </span>
                  <span className="block text-[8px] text-zinc-400 uppercase tracking-widest">
                    Pastikan Anda di luar ruangan
                  </span>
               </div>
            </div>
          </div>
        )}

        {errorMsg && !loading && !realCoords && (
          <div className="absolute inset-0 bg-white/95 z-20 flex items-center justify-center p-10">
            <div className="flex flex-col items-center gap-4">
              <span className="text-xs font-black text-red-600 tracking-tight uppercase border-2 border-red-600 px-4 py-2">{errorMsg}</span>
              <button 
                onClick={() => { window.location.reload() }} 
                className="px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em]"
              >
                Muat Ulang Sinyal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DATA STRIP */}
      <div className="px-6 py-4 border-y-2 border-zinc-900 bg-zinc-900 flex justify-between text-[10px] font-mono text-zinc-300 uppercase tracking-widest">
        <div className="flex flex-col">
          <span className="text-zinc-500 text-[8px] mb-1">Position / Lat</span>
          <span className="font-bold text-white tracking-normal">{coords.lat.toFixed(6)}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-zinc-500 text-[8px] mb-1">Accuracy / Radius</span>
          <span className={`font-bold ${coords.accuracy && coords.accuracy < 50 ? 'text-green-400' : 'text-orange-400'}`}>
            ± {Math.round(coords.accuracy || 0)} M
          </span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="p-6 space-y-4 bg-white">
        <button 
          onClick={submitLocation}
          disabled={loading || !realCoords}
          className="w-full bg-black text-white py-6 text-sm font-black tracking-[0.3em] uppercase flex justify-between items-center px-8 active:scale-[0.97] transition-all disabled:bg-zinc-200 disabled:text-zinc-400"
        >
          {loading ? 'MENGUNCI SINYAL...' : 'KONFIRMASI LOKASI'}
          {!loading && <ChevronRight size={20} strokeWidth={3} />}
        </button>

        <button
          onClick={() => router.replace(`/handover/${id}/success`)}
          className="w-full text-[10px] text-zinc-400 border border-zinc-100 py-3 uppercase tracking-[0.3em] font-bold text-center"
        >
          Lewati (Bypass)
        </button>
      </div>
    </div>
  )
}
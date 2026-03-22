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

  const [coords, setCoords] = useState<Coords>(DEFAULT_COORDS)
  const [realCoords, setRealCoords] = useState<Coords | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    getLocation()
  }, [])

  function getLocation() {
    setLoading(true)
    setErrorMsg(null)

    if (typeof window !== "undefined" && !navigator.geolocation) {
      setErrorMsg("PERANGKAT TIDAK MENDUKUNG GPS")
      setLoading(false)
      return
    }

    // iPhone tweak: kadangkala high accuracy butuh pancingan
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        }
        setCoords(newCoords);
        setRealCoords(newCoords);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) {
          setErrorMsg("IZIN LOKASI DITOLAK (CEK SETTING IPHONE)");
        } else if (err.code === 2) {
          setErrorMsg("SINYAL GPS TIDAK TERDETEKSI");
        } else {
          setErrorMsg("TIMEOUT: GAGAL MENGUNCI POSISI");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,      // Perpanjang ke 20 detik
        maximumAge: 30000    // Gunakan cache jika tersedia dalam 30 detik terakhir
      }
    )
  }

  async function submitLocation() {
    if (!realCoords) {
      alert("⚠️ Sinyal GPS belum terkunci.");
      return
    }

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
      if (!res.ok) { alert(data.error || "Gagal memproses lokasi."); return; }
      if (!data.isValid) { alert(`LOKASI DILUAR RADIUS (${data.distance}m)`); return; }

      router.replace(`/handover/${id}/success`)
    } catch (err) {
      alert("GANGGUAN KONEKSI SERVER NEST");
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white max-w-md mx-auto border-x border-zinc-200 font-sans text-zinc-900 antialiased">

      {/* HEADER - High Contrast */}
      <div className="p-6 border-b-2 border-zinc-900 bg-white">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase">
            NEST / UNIT / GPS-V3
          </span>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              loading ? 'bg-yellow-400 animate-pulse' :
              realCoords ? 'bg-green-600' :
              'bg-red-600'
            }`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-800">
              {loading ? 'Searching' : realCoords ? 'Stable' : 'Offline'}
            </span>
          </div>
        </div>
        <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">
          Validasi Lokasi
        </h1>
      </div>

      {/* MAP AREA */}
      <div className="flex-1 relative bg-zinc-200 overflow-hidden">
        <MapWrapper coords={coords} />

        {(loading || errorMsg) && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-20 flex items-center justify-center p-10 text-center">
            <div className="flex flex-col items-center gap-4">
              {loading ? (
                <>
                  <div className="w-12 h-1 bg-zinc-100 overflow-hidden relative">
                    <div className="absolute inset-0 bg-black animate-[slide_1.5s_infinite]" style={{width: '30%'}}></div>
                  </div>
                  <span className="text-[10px] tracking-[0.4em] uppercase text-zinc-600 font-black">
                    Menghubungkan ke Satelit...
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-bold text-red-600 mb-2 tracking-tight uppercase">{errorMsg}</span>
                  <button 
                    onClick={getLocation} 
                    className="px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em]"
                  >
                    Refresh Sinyal
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* DATA STRIP - High Contrast Mono */}
      <div className="px-6 py-4 border-y-2 border-zinc-900 bg-zinc-900 flex justify-between text-[10px] font-mono text-zinc-300 uppercase tracking-widest">
        <div className="flex flex-col">
          <span className="text-zinc-500 text-[8px]">Latitude</span>
          <span className="font-bold text-white">{coords.lat.toFixed(6)}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-zinc-500 text-[8px]">Longitude</span>
          <span className="font-bold text-white">{coords.lng.toFixed(6)}</span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="p-6 space-y-4 bg-white">
        <button 
          onClick={submitLocation}
          className="w-full bg-black text-white py-6 text-sm font-black tracking-[0.3em] uppercase flex justify-between items-center px-8 active:scale-[0.97] transition-all disabled:opacity-20"
          disabled={loading || !!errorMsg}
        >
          Konfirmasi Lokasi
          <ChevronRight size={20} strokeWidth={3} />
        </button>

        <button
          onClick={() => router.replace(`/handover/${id}/success`)}
          className="w-full text-[10px] text-zinc-500 border border-zinc-200 py-3 uppercase tracking-[0.3em] font-black text-center"
        >
          Bypass Validasi
        </button>
      </div>

      <style jsx>{`
        @keyframes slide {
          0% { left: -30%; }
          100% { left: 130%; }
        }
      `}</style>
    </div>
  )
}
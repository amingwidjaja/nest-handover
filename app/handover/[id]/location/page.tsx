'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { RotateCcw, ChevronRight } from "lucide-react"
import 'mapbox-gl/dist/mapbox-gl.css'

// Mengambil token dari environment variable Vercel
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

// 🔥 KOMPONEN PETA (Disesuaikan untuk Vercel & Mapbox v2/v7)
const MapWrapper = dynamic<any>(
  () =>
    import("react-map-gl").then((mod) => {
      const { Map, Marker } = mod

      return function MapboxComponent({ coords }: { coords: Coords }) {
        if (!MAPBOX_TOKEN) {
          return (
            <div className="flex items-center justify-center h-full text-[10px] font-mono text-red-500 uppercase tracking-widest px-10 text-center">
              Token Mapbox tidak ditemukan di sistem.
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
        Memuat Sistem Peta...
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
      setErrorMsg("Perangkat tidak mendukung GPS")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        }
        setCoords(newCoords)
        setRealCoords(newCoords)
        setLoading(false)
      },
      (err) => {
        setLoading(false)
        if (err.code === 1) {
          setErrorMsg("Izin lokasi ditolak. Cek pengaturan privasi iPhone Anda.")
        } else if (err.code === 2) {
          setErrorMsg("Sinyal GPS hilang atau tidak tersedia.")
        } else {
          setErrorMsg("Gagal mengunci lokasi (Timeout).")
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // 15 detik untuk iPhone
        maximumAge: 0
      }
    )
  }

  async function submitLocation() {
    if (!realCoords) {
      alert("Sinyal GPS belum terkunci sempurna.")
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

      if (!res.ok) {
        alert(data.error || "Gagal memproses data lokasi.")
        return
      }

      if (!data.isValid) {
        alert(`Lokasi di luar jangkauan area (${data.distance}m)`)
        return
      }

      router.replace(`/handover/${id}/success`)

    } catch (err) {
      alert("Gangguan koneksi ke server NEST.")
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white max-w-md mx-auto border-x border-zinc-100 font-sans text-zinc-900 antialiased">

      {/* HEADER */}
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
              {loading ? 'Mencari' : realCoords ? 'Terkunci' : 'Gagal'}
            </span>
          </div>
        </div>
        <h1 className="text-2xl font-light tracking-tight italic uppercase leading-none">
          Konfirmasi Lokasi
        </h1>
      </div>

      {/* MAP AREA */}
      <div className="flex-1 relative bg-zinc-50 overflow-hidden">
        <MapWrapper coords={coords} />

        {(loading || errorMsg) && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center p-10 text-center">
            <div className="flex flex-col items-center gap-3">
              {loading ? (
                <>
                  <RotateCcw className="animate-spin text-zinc-900" size={20} strokeWidth={1.5} />
                  <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 font-medium">
                    Sinkronisasi Satelit...
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-medium text-red-500 mb-2">{errorMsg}</span>
                  <button onClick={getLocation} className="text-[10px] font-bold border-b border-black pb-1 uppercase tracking-widest">
                    Coba Lagi
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* DATA FOOTER */}
      <div className="px-6 py-3 border-y border-zinc-100 bg-zinc-50/50 flex justify-between text-[9px] font-mono text-zinc-400 uppercase tracking-tighter">
        <span>LAT // {coords.lat.toFixed(6)}</span>
        <span>LNG // {coords.lng.toFixed(6)}</span>
      </div>

      {/* ACTIONS */}
      <div className="p-6 space-y-4 bg-white">
        <button 
          onClick={submitLocation}
          className="w-full bg-black text-white py-5 text-xs font-bold tracking-[0.2em] uppercase flex justify-between items-center px-6 active:scale-[0.98] transition-transform disabled:opacity-30"
          disabled={loading || !!errorMsg}
        >
          Otorisasi Lokasi
          <ChevronRight size={16} />
        </button>

        <button
          onClick={getLocation}
          className="w-full border border-zinc-200 py-4 text-[10px] font-bold tracking-[0.2em] uppercase flex justify-center gap-2 hover:bg-zinc-50 transition-colors"
        >
          <RotateCcw size={12} />
          Perbarui Sinyal
        </button>

        <button
          onClick={() => router.replace(`/handover/${id}/success`)}
          className="w-full text-[9px] text-zinc-300 uppercase tracking-[0.3em] font-medium pt-2 text-center"
        >
          Lewati Validasi
        </button>
      </div>
    </div>
  )
}
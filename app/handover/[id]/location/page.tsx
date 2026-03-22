'use client'

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { RotateCcw, ChevronRight, MapPin } from "lucide-react"
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
            <div className="flex items-center justify-center h-full text-[10px] font-mono text-red-800 uppercase tracking-widest px-10 text-center font-bold bg-[#F4F1EA]">
              SISTEM: TOKEN TIDAK AKTIF
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
                <div className="w-10 h-10 bg-[#7F5539]/20 rounded-full animate-ping absolute" />
                <div className="w-5 h-5 bg-[#7F5539] rounded-full border-2 border-[#F4F1EA] shadow-xl z-10" />
              </div>
            </Marker>
          </Map>
        )
      }
    }),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-[#F4F1EA] text-[10px] font-mono text-[#9C6644] tracking-[0.2em] uppercase font-bold">
        MENYIAPKAN RADAR...
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
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [])

  function startTracking() {
    setLoading(true)
    setErrorMsg(null)

    if (typeof window !== "undefined" && !navigator.geolocation) {
      setErrorMsg("GPS TIDAK DIDUKUNG")
      setLoading(false)
      return
    }

    // iPhone sering butuh pancingan watchPosition
    watchId.current = navigator.geolocation.watchPosition(
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
        if (!realCoords) {
          setLoading(false)
          if (err.code === 1) setErrorMsg("IZIN LOKASI DITOLAK")
          else if (err.code === 3) setErrorMsg("SINYAL LEMAH / TIMEOUT")
          else setErrorMsg("GANGGUAN SINYAL GPS")
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
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
      if (!res.ok) { alert(data.error || "Gagal."); return; }
      if (!data.isValid) { alert(`DI LUAR RADIUS (${data.distance}m)`); return; }
      router.replace(`/handover/${id}/success`)
    } catch (err) {
      alert("SERVER ERROR");
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#F4F1EA] max-w-md mx-auto border-x border-[#DDB892] font-sans text-[#432818] antialiased">
      
      {/* HEADER - MUJI DARK BROWN */}
      <div className="p-6 border-b-2 border-[#7F5539] bg-white">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-black tracking-[0.2em] text-[#9C6644] uppercase">
            NEST / UNIT / MUJI-V1
          </span>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              loading ? 'bg-[#DDB892] animate-pulse' :
              realCoords ? (coords.accuracy && coords.accuracy < 50 ? 'bg-green-700' : 'bg-orange-600') :
              'bg-red-700'
            }`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#7F5539]">
              {loading ? 'PENCARIAN' : realCoords ? 'STABIL' : 'OFFLINE'}
            </span>
          </div>
        </div>
        <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none text-[#7F5539]">
          Validasi Lokasi
        </h1>
      </div>

      {/* MAP AREA */}
      <div className="flex-1 relative bg-[#EDEADF] overflow-hidden">
        <MapWrapper coords={coords} />

        {/* LOADING & ERROR OVERLAY */}
        {(loading || (errorMsg && !realCoords)) && (
          <div className="absolute inset-0 bg-[#F4F1EA]/90 z-20 flex items-center justify-center p-10 text-center">
            <div className="flex flex-col items-center gap-5">
               {loading ? (
                 <>
                  <div className="w-12 h-12 border-4 border-[#DDB892] border-t-[#7F5539] rounded-full animate-spin"></div>
                  <div className="space-y-1">
                    <span className="block text-[10px] tracking-[0.4em] uppercase text-[#7F5539] font-black">
                      MENGUNCI SINYAL...
                    </span>
                    <span className="block text-[8px] text-[#9C6644] uppercase tracking-widest">
                      Gerakkan HP sedikit jika macet
                    </span>
                  </div>
                 </>
               ) : (
                 <>
                  <MapPin className="text-red-700 mb-2" size={32} />
                  <span className="text-xs font-black text-red-800 tracking-tight uppercase px-4 py-2 bg-red-50">{errorMsg}</span>
                  <button 
                    onClick={() => { window.location.reload() }} 
                    className="px-8 py-4 bg-[#7F5539] text-[#F4F1EA] text-[10px] font-black uppercase tracking-[0.3em] shadow-lg active:scale-95"
                  >
                    AKTIFKAN GPS MANUAL
                  </button>
                 </>
               )}
            </div>
          </div>
        )}
      </div>

      {/* DATA STRIP - MUJI DARK BLOCKING */}
      <div className="px-6 py-5 border-y-2 border-[#7F5539] bg-[#7F5539] flex justify-between text-[10px] font-mono text-[#EDEADF] uppercase tracking-widest">
        <div className="flex flex-col">
          <span className="text-[#DDB892] text-[8px] mb-1 font-bold">LATITUDE</span>
          <span className="font-bold text-white text-xs">{coords.lat.toFixed(6)}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[#DDB892] text-[8px] mb-1 font-bold">AKURASI</span>
          <span className={`font-bold text-xs ${coords.accuracy && coords.accuracy < 50 ? 'text-green-300' : 'text-orange-300'}`}>
            ± {Math.round(coords.accuracy || 0)} METER
          </span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="p-6 space-y-4 bg-white">
        <button 
          onClick={submitLocation}
          disabled={loading || !realCoords}
          className="w-full bg-[#7F5539] text-[#F4F1EA] py-6 text-sm font-black tracking-[0.3em] uppercase flex justify-between items-center px-8 active:scale-[0.97] transition-all disabled:bg-[#EDEADF] disabled:text-[#DDB892]"
        >
          {loading ? 'MENUNGGU SATELIT...' : 'KONFIRMASI LOKASI'}
          {!loading && <ChevronRight size={20} strokeWidth={3} />}
        </button>

        <button
          onClick={() => router.replace(`/handover/${id}/success`)}
          className="w-full text-[10px] text-[#9C6644] border border-[#DDB892] py-3 uppercase tracking-[0.3em] font-bold text-center"
        >
          LEWATI VALIDASI
        </button>
      </div>
    </div>
  )
}
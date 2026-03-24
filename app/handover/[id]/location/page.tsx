'use client'

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { ChevronRight, SignalLow } from "lucide-react"
import type { Coords } from "./validation-map"

const DEFAULT_COORDS: Coords = {
  lat: -6.2,
  lng: 106.8,
  accuracy: 0
}

const ValidationMap = dynamic(
  () => import("./validation-map"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-[var(--paper)] text-[10px] font-mono text-[#A1887F] tracking-[0.2em] uppercase font-bold">
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
  const timerId = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastMapPush = useRef(0)
  const mapPrimed = useRef(false)
  const realCoordsRef = useRef<Coords | null>(null)

  /** Live coords (strip + submit). */
  const [coords, setCoords] = useState<Coords>(DEFAULT_COORDS)
  /** Throttled — map camera only updates when this changes (avoids remount / ease spam). */
  const [mapCoords, setMapCoords] = useState<Coords>(DEFAULT_COORDS)
  const [realCoords, setRealCoords] = useState<Coords | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    startTracking()
    return () => {
      stopTracking()
    }
  }, [])

  function stopTracking() {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    if (timerId.current) clearTimeout(timerId.current)
  }

  const pushMapIfNeeded = useCallback((c: Coords) => {
    setMapCoords((prev) => {
      const now = Date.now()
      if (!mapPrimed.current) {
        mapPrimed.current = true
        lastMapPush.current = now
        return c
      }
      const moved =
        Math.abs(c.lat - prev.lat) > 0.00003 ||
        Math.abs(c.lng - prev.lng) > 0.00003
      if (moved || now - lastMapPush.current > 2000) {
        lastMapPush.current = now
        return c
      }
      return prev
    })
  }, [])

  function startTracking() {
    setLoading(true)
    setErrorMsg(null)
    setRealCoords(null)
    realCoordsRef.current = null
    mapPrimed.current = false
    lastMapPush.current = 0
    setMapCoords(DEFAULT_COORDS)

    if (typeof window !== "undefined" && !navigator.geolocation) {
      setErrorMsg("GPS TIDAK DIDUKUNG")
      setLoading(false)
      return
    }

    timerId.current = setTimeout(() => {
      if (!realCoordsRef.current) {
        stopTracking()
        setLoading(false)
        setErrorMsg("TIMEOUT: SINYAL TERLALU LEMAH")
      }
    }, 12000)

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (timerId.current) clearTimeout(timerId.current)

        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        }
        setCoords(newCoords)
        setRealCoords(newCoords)
        realCoordsRef.current = newCoords
        pushMapIfNeeded(newCoords)
        setLoading(false)
      },
      (err) => {
        if (!realCoordsRef.current) {
          if (timerId.current) clearTimeout(timerId.current)
          setLoading(false)
          if (err.code === 1) setErrorMsg("IZIN LOKASI DITOLAK")
          else setErrorMsg("GAGAL MENGUNCI SINYAL")
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
      const res = await fetch("/api/handover/receive/location/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handover_id: id,
          lat: realCoords.lat,
          lng: realCoords.lng,
          accuracy: realCoords.accuracy ?? 0
        })
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Gagal.")
        return
      }
      if (!data.isValid) {
        alert(`DI LUAR RADIUS (${data.distance}m)`)
        return
      }
      router.replace("/dashboard")
    } catch {
      alert("Koneksi gagal.")
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--paper)] max-w-md mx-auto border-x border-[var(--line)] font-sans text-[var(--ink)] antialiased">
      
      {/* HEADER */}
      <div className="p-6 border-b border-[var(--line)] bg-white shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#A1887F] uppercase">
            NEST / UNIT / GPS-MUJI-V2
          </span>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              loading ? 'bg-orange-300 animate-pulse' :
              realCoords ? 'bg-green-700' :
              'bg-red-700'
            }`} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {loading ? 'MENCARI' : realCoords ? 'TERKUNCI' : 'OFFLINE'}
            </span>
          </div>
        </div>
        <h1 className="text-2xl font-light tracking-tight uppercase italic leading-none text-[#3E2723]">
          Validasi Lokasi
        </h1>
      </div>

      {/* MAP AREA */}
      <div className="flex-1 relative bg-[var(--line)] overflow-hidden">
        <ValidationMap coords={mapCoords} />

        {/* LOADING & ERROR OVERLAY */}
        {(loading || (errorMsg && !realCoords)) && (
          <div className="absolute inset-0 bg-[var(--paper)]/95 z-20 flex items-center justify-center p-10 text-center">
            <div className="flex flex-col items-center gap-8">
               {loading ? (
                 <>
                  <div className="w-12 h-12 border-2 border-[var(--line)] border-t-[#3E2723] rounded-full animate-spin"></div>
                  <div className="space-y-2">
                    <span className="block text-[10px] tracking-[0.4em] uppercase text-[#3E2723] font-bold">
                      MENYINKRONKAN...
                    </span>
                    <span className="block text-[8px] text-[#A1887F] uppercase tracking-widest leading-loose max-w-[180px]">
                      Mohon tunggu sebentar, sistem sedang menghubungi satelit
                    </span>
                  </div>
                 </>
               ) : (
                 <>
                  <div className="p-5 border border-red-100 bg-red-50/30 rounded-full">
                    <SignalLow className="text-red-800" size={32} />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-red-800 tracking-widest uppercase">{errorMsg}</span>
                    <p className="text-[9px] text-[#A1887F] leading-relaxed max-w-[200px]">Sinyal GPS iPhone terhambat. Silakan coba di area yang lebih terbuka.</p>
                  </div>
                  <button 
                    onClick={startTracking} 
                    className="px-8 py-4 bg-[#3E2723] text-[var(--paper)] text-[10px] font-bold uppercase tracking-[0.3em] shadow-lg active:scale-95 transition-all"
                  >
                    COBA LAGI
                  </button>
                 </>
               )}
            </div>
          </div>
        )}
      </div>

      {/* DATA STRIP - HIGH CONTRAST INK */}
      <div className="px-6 py-5 border-y border-[var(--line)] bg-[#3E2723] flex justify-between text-[10px] font-mono text-[var(--paper)] uppercase tracking-widest">
        <div className="flex flex-col">
          <span className="text-[#A1887F] text-[8px] mb-1 font-bold">LATITUDE</span>
          <span className="font-bold text-white text-xs">{coords.lat.toFixed(6)}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[#A1887F] text-[8px] mb-1 font-bold">AKURASI</span>
          <span className={`font-bold text-xs ${coords.accuracy && coords.accuracy < 50 ? 'text-green-300' : 'text-orange-300'}`}>
            ± {Math.round(coords.accuracy || 0)} M
          </span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="p-6 space-y-4 bg-white">
        <button 
          onClick={submitLocation}
          disabled={loading || !realCoords}
          className="w-full bg-[#3E2723] text-[var(--paper)] py-6 text-xs font-bold tracking-[0.3em] uppercase flex justify-between items-center px-8 active:scale-[0.98] transition-all disabled:bg-[var(--line)] disabled:text-[#A1887F]"
        >
          {loading ? 'LOADING GPS...' : 'KONFIRMASI LOKASI'}
          {!loading && <ChevronRight size={18} strokeWidth={2} />}
        </button>

      </div>
    </div>
  )
}
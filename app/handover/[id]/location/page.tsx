'use client'

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { ChevronRight, SignalLow } from "lucide-react"
import type { Coords } from "./validation-map"

const DEFAULT_COORDS: Coords = { lat: -6.2, lng: 106.8, accuracy: 0 }

const ValidationMap = dynamic(
  () => import("./validation-map"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-[var(--paper)] text-[10px] font-mono text-[#A1887F] tracking-[0.2em] uppercase font-bold">
        MENYIAPKAN RADAR...
      </div>
    ),
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

  const [coords, setCoords] = useState<Coords>(DEFAULT_COORDS)
  const [mapCoords, setMapCoords] = useState<Coords>(DEFAULT_COORDS)
  const [realCoords, setRealCoords] = useState<Coords | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    startTracking()
    return () => stopTracking()
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
          accuracy: pos.coords.accuracy,
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // Submit GPS coords — non-blocking: success or failure both go to dashboard
  async function submitLocation() {
    if (!realCoords) return
    setSubmitting(true)
    try {
      await fetch("/api/handover/receive/location/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handover_id: id,
          lat: realCoords.lat,
          lng: realCoords.lng,
          accuracy: realCoords.accuracy ?? 0,
        }),
      })
      // GPS is additional data — we navigate regardless of is_valid
    } catch {
      // ignore — non-blocking
    } finally {
      setSubmitting(false)
      router.replace("/dashboard")
    }
  }

  // Skip GPS entirely — data simply won't be recorded
  function skipLocation() {
    stopTracking()
    router.replace("/dashboard")
  }

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-y-auto bg-[var(--paper)] font-sans text-[var(--ink)] antialiased max-w-md mx-auto border-x border-[var(--line)]">

      {/* HEADER */}
      <div className="shrink-0 border-b border-[var(--line)] bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#3E2723]">
            NEST76 PAKET
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                loading
                  ? "bg-orange-300 animate-pulse"
                  : realCoords
                    ? "bg-green-700"
                    : "bg-red-700"
              }`}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {loading ? "MENCARI" : realCoords ? "TERKUNCI" : "OFFLINE"}
            </span>
          </div>
        </div>
        <h1 className="text-lg font-black uppercase tracking-[0.2em] leading-tight text-[#3E2723]">
          Lokasi Serah Terima
        </h1>
        <p className="mt-1 text-[10px] text-[#A1887F]">
          Opsional — data tambahan untuk bukti digital
        </p>
      </div>

      {/* MAP */}
      <div className="shrink-0 px-4 py-3 sm:px-5">
        <div className="relative h-56 w-full overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--line)]">
          <ValidationMap coords={mapCoords} />
          {(loading || (errorMsg && !realCoords)) && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--paper)]/95 p-6 text-center">
              <div className="flex flex-col items-center gap-6">
                {loading ? (
                  <>
                    <div className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--line)] border-t-[#3E2723]" />
                    <div className="space-y-2">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.35em] text-[#3E2723]">
                        MENYINKRONKAN…
                      </span>
                      <span className="block max-w-[200px] text-[8px] uppercase leading-relaxed tracking-widest text-[#A1887F]">
                        Menghubungkan ke satelit
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-full border border-red-100 bg-red-50/30 p-5">
                      <SignalLow className="text-red-800" size={32} />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-red-800">
                        {errorMsg}
                      </span>
                      <p className="max-w-[220px] text-[9px] leading-relaxed text-[#A1887F]">
                        Coba lagi atau lewati — GPS tidak wajib.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={startTracking}
                      className="bg-[#3E2723] px-8 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--paper)] shadow-lg transition-all active:scale-[0.96]"
                    >
                      COBA LAGI
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DATA STRIP */}
      <div className="px-6 py-5 border-y border-[var(--line)] bg-[#3E2723] flex justify-between text-[10px] font-mono text-[var(--paper)] uppercase tracking-widest">
        <div className="flex flex-col">
          <span className="text-[#A1887F] text-[8px] mb-1 font-bold">LATITUDE</span>
          <span className="font-bold text-white text-xs">{coords.lat.toFixed(6)}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[#A1887F] text-[8px] mb-1 font-bold">AKURASI</span>
          <span className={`font-bold text-xs ${coords.accuracy && coords.accuracy < 50 ? "text-green-300" : "text-orange-300"}`}>
            ± {Math.round(coords.accuracy || 0)} M
          </span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="p-6 space-y-3 bg-white">
        <button
          onClick={submitLocation}
          disabled={loading || !realCoords || submitting}
          className="w-full bg-[#3E2723] text-[var(--paper)] py-6 text-xs font-bold tracking-[0.3em] uppercase flex justify-between items-center px-8 active:scale-[0.96] transition-all disabled:bg-[var(--line)] disabled:text-[#A1887F]"
        >
          {submitting ? "MENYIMPAN…" : loading ? "LOADING GPS..." : "REKAM LOKASI"}
          {!loading && !submitting && <ChevronRight size={18} strokeWidth={2} />}
        </button>

        {/* Skip button — GPS is optional */}
        <button
          onClick={skipLocation}
          disabled={submitting}
          className="w-full py-3 text-[11px] text-[#A1887F] tracking-widest uppercase border border-[#E0DED7] active:scale-[0.98] transition-all"
        >
          Lewati — tanpa data GPS
        </button>
      </div>
    </div>
  )
}

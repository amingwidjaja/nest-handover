'use client'

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { ChevronRight, SignalLow } from "lucide-react"
import type { Coords } from "./validation-map"

const DEFAULT: Coords = { lat: -6.2, lng: 106.8, accuracy: 0 }

const ValidationMap = dynamic(() => import("./validation-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[var(--paper)] text-[10px] font-bold font-mono uppercase tracking-[0.2em] text-[#A1887F]">
      MENYIAPKAN RADAR...
    </div>
  ),
})

export default function LocationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const watchId  = useRef<number | null>(null)
  const timer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPush = useRef(0)
  const primed   = useRef(false)
  const realRef  = useRef<Coords | null>(null)

  const [display,   setDisplay]   = useState<Coords>(DEFAULT)
  const [mapCoords, setMapCoords] = useState<Coords>(DEFAULT)
  const [real,      setReal]      = useState<Coords | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    track()
    return stop
  }, [])

  function stop() {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    if (timer.current) clearTimeout(timer.current)
  }

  const pushMap = useCallback((c: Coords) => {
    setMapCoords(prev => {
      const now = Date.now()
      if (!primed.current) { primed.current = true; lastPush.current = now; return c }
      const moved = Math.abs(c.lat - prev.lat) > 0.00003 || Math.abs(c.lng - prev.lng) > 0.00003
      if (moved || now - lastPush.current > 2000) { lastPush.current = now; return c }
      return prev
    })
  }, [])

  function track() {
    setLoading(true); setError(null); setReal(null)
    realRef.current = null; primed.current = false
    lastPush.current = 0; setMapCoords(DEFAULT)

    if (!navigator?.geolocation) {
      setError("GPS TIDAK DIDUKUNG"); setLoading(false); return
    }

    timer.current = setTimeout(() => {
      if (!realRef.current) { stop(); setLoading(false); setError("TIMEOUT: SINYAL TERLALU LEMAH") }
    }, 12000)

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (timer.current) clearTimeout(timer.current)
        const c: Coords = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }
        setDisplay(c); setReal(c); realRef.current = c
        pushMap(c); setLoading(false)
      },
      (err) => {
        if (!realRef.current) {
          if (timer.current) clearTimeout(timer.current)
          setLoading(false)
          setError(err.code === 1 ? "IZIN LOKASI DITOLAK" : "GAGAL MENGUNCI SINYAL")
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  async function submit() {
    if (!real) return
    setSaving(true)
    try {
      await fetch("/api/handover/receive/location/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handover_id: id, lat: real.lat, lng: real.lng, accuracy: real.accuracy ?? 0 }),
      })
    } catch { /* non-blocking */ }
    finally { setSaving(false); router.replace("/dashboard") }
  }

  const overlayVisible = loading || (!real && !!error)

  return (
    <div className="flex h-screen flex-col overflow-y-auto bg-[var(--paper)] font-sans text-[var(--ink)] antialiased max-w-md mx-auto border-x border-[var(--line)]">

      {/* HEADER */}
      <div className="shrink-0 border-b border-[var(--line)] bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#3E2723]">NEST76 PAKET</span>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${loading ? "animate-pulse bg-orange-300" : real ? "bg-green-700" : "bg-red-700"}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {loading ? "MENCARI" : real ? "TERKUNCI" : "OFFLINE"}
            </span>
          </div>
        </div>
        <h1 className="text-lg font-black uppercase tracking-[0.2em] leading-tight text-[#3E2723]">Lokasi Serah Terima</h1>
        <p className="mt-1 text-[10px] text-[#A1887F]">Opsional — data tambahan untuk bukti digital</p>
      </div>

      {/* MAP */}
      <div className="shrink-0 px-4 py-3 sm:px-5">
        <div className="relative h-56 w-full overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--line)]">
          <ValidationMap coords={mapCoords} />

          {overlayVisible && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--paper)]/95 p-6 text-center">
              {loading ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--line)] border-t-[#3E2723]" />
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.35em] text-[#3E2723]">MENYINKRONKAN…</span>
                    <span className="block max-w-[200px] text-[8px] uppercase leading-relaxed tracking-widest text-[#A1887F]">Menghubungkan ke satelit</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <div className="rounded-full border border-red-100 bg-red-50/30 p-5">
                    <SignalLow className="text-red-800" size={32} />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-red-800">{error}</span>
                    <p className="max-w-[220px] text-[9px] leading-relaxed text-[#A1887F]">Coba lagi atau lewati — GPS tidak wajib.</p>
                  </div>
                  <button onClick={track} className="bg-[#3E2723] px-8 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--paper)] shadow-lg transition-all active:scale-[0.96]">
                    COBA LAGI
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* COORDS STRIP */}
      <div className="flex justify-between border-y border-[var(--line)] bg-[#3E2723] px-6 py-5 font-mono text-[10px] uppercase tracking-widest text-[var(--paper)]">
        <div className="flex flex-col">
          <span className="mb-1 text-[8px] font-bold text-[#A1887F]">LATITUDE</span>
          <span className="text-xs font-bold text-white">{display.lat.toFixed(6)}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="mb-1 text-[8px] font-bold text-[#A1887F]">AKURASI</span>
          <span className={`text-xs font-bold ${(display.accuracy ?? 0) < 50 ? "text-green-300" : "text-orange-300"}`}>
            ± {Math.round(display.accuracy ?? 0)} M
          </span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="space-y-3 bg-white p-6">
        <button
          onClick={submit}
          disabled={loading || !real || saving}
          className="flex w-full items-center justify-between bg-[#3E2723] px-8 py-6 text-xs font-bold uppercase tracking-[0.3em] text-[var(--paper)] transition-all active:scale-[0.96] disabled:bg-[var(--line)] disabled:text-[#A1887F]"
        >
          {saving ? "MENYIMPAN…" : loading ? "LOADING GPS..." : "REKAM LOKASI"}
          {!loading && !saving && <ChevronRight size={18} strokeWidth={2} />}
        </button>
        <button
          onClick={() => { stop(); router.replace("/dashboard") }}
          disabled={saving}
          className="w-full border border-[#E0DED7] py-3 text-[11px] uppercase tracking-widest text-[#A1887F] transition-all active:scale-[0.98]"
        >
          Lewati — tanpa data GPS
        </button>
      </div>
    </div>
  )
}

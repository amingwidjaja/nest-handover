'use client'

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import {
  fetchForwardGeocodeSuggestions,
  type MapboxGeocodeFeature
} from "@/lib/mapbox-forward-geocode"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

function useDebouncedCallback<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number
) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null)
  return useCallback(
    (...args: T) => {
      if (t.current) clearTimeout(t.current)
      t.current = setTimeout(() => fn(...args), delay)
    },
    [fn, delay]
  )
}

export default function HandoverCreatePage() {
  const [senderType, setSenderType] = useState("self")

  const [senderName, setSenderName] = useState("")
  const [senderContact, setSenderContact] = useState("")

  const [receiverName, setReceiverName] = useState("")
  const [receiverContact, setReceiverContact] = useState("")

  const [destinationAddress, setDestinationAddress] = useState("")
  const [destinationCity, setDestinationCity] = useState("")
  const [destinationPostalCode, setDestinationPostalCode] = useState("")
  /** Set only when user picks a row from the Mapbox dropdown (patokan). */
  const [mapboxPick, setMapboxPick] = useState<{ lat: number; lng: number } | null>(
    null
  )

  const [suggestions, setSuggestions] = useState<MapboxGeocodeFeature[]>([])
  const [geocodeLoading, setGeocodeLoading] = useState(false)
  const [locationRefreshing, setLocationRefreshing] = useState(false)

  const [toast, setToast] = useState("")
  const [limitHint, setLimitHint] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  /** Live GPS — used for Mapbox proximity, fallback lat/lng when no patokan selected. */
  const [userProximity, setUserProximity] = useState<{
    lng: number
    lat: number
  } | null>(null)

  useEffect(() => {
    async function hydrate() {
      const name = localStorage.getItem("user_name")
      const contact = localStorage.getItem("user_contact")
      if (name) setSenderName(name)
      if (contact) setSenderContact(contact)
      if (!name) {
        const supabase = createBrowserSupabaseClient()
        const {
          data: { session }
        } = await supabase.auth.getSession()
        if (session) {
          const res = await fetch("/api/profile")
          const j = await res.json()
          const p = j.profile as {
            display_name?: string | null
            company_name?: string | null
          } | null
          const dn =
            (p?.display_name && String(p.display_name).trim()) ||
            (p?.company_name && String(p.company_name).trim()) ||
            ""
          if (dn) {
            setSenderName(dn)
            try {
              localStorage.setItem("user_name", dn)
            } catch {
              /* ignore */
            }
          }
        }
      }
      const draftCity = localStorage.getItem("draft_destination_city")
      const draftPost = localStorage.getItem("draft_destination_postcode")
      if (draftCity) setDestinationCity(draftCity)
      if (draftPost) setDestinationPostalCode(draftPost)
    }
    hydrate()
  }, [])

  useEffect(() => {
    async function loadLimits() {
      const res = await fetch("/api/handover/limits")
      if (!res.ok) return
      const j = await res.json()
      if (j.authenticated && typeof j.remaining === "number" && j.limit != null) {
        setLimitHint(`${j.remaining}/${j.limit} paket aktif tersisa`)
      }
    }
    loadLimits()
  }, [])

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserProximity({
          lng: pos.coords.longitude,
          lat: pos.coords.latitude
        })
      },
      () => {},
      {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 300_000
      }
    )
  }, [])

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setSuggestions([])
      }
    }
    document.addEventListener("mousedown", onDocDown)
    return () => document.removeEventListener("mousedown", onDocDown)
  }, [])

  const runGeocode = useCallback(async (query: string) => {
    if (!MAPBOX_TOKEN || query.trim().length < 2) {
      setSuggestions([])
      return
    }
    setGeocodeLoading(true)
    try {
      const features = await fetchForwardGeocodeSuggestions(query, MAPBOX_TOKEN, {
        limit: 5,
        proximity: userProximity ?? undefined
      })
      setSuggestions(features)
    } catch {
      setSuggestions([])
    } finally {
      setGeocodeLoading(false)
    }
  }, [userProximity])

  const debouncedGeocode = useDebouncedCallback(runGeocode, 320)

  function onDestinationInputChange(value: string) {
    setDestinationAddress(value)
    if (mapboxPick !== null) setMapboxPick(null)
    debouncedGeocode(value)
  }

  function selectSuggestion(f: MapboxGeocodeFeature) {
    const [lng, lat] = f.center
    setDestinationAddress(f.place_name)
    setMapboxPick({ lat, lng })
    const city = f.city ?? ""
    const pc = f.postcode ?? ""
    setDestinationCity(city)
    setDestinationPostalCode(pc)
    localStorage.setItem("draft_destination_city", city)
    localStorage.setItem("draft_destination_postcode", pc)
    setSuggestions([])
  }

  function onCityChange(value: string) {
    setDestinationCity(value)
    localStorage.setItem("draft_destination_city", value)
  }

  function onPostalChange(value: string) {
    setDestinationPostalCode(value)
    localStorage.setItem("draft_destination_postcode", value)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  function useCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      showToast("GPS tidak didukung di perangkat ini")
      return
    }
    setLocationRefreshing(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserProximity({
          lng: pos.coords.longitude,
          lat: pos.coords.latitude
        })
        setLocationRefreshing(false)
        showToast("Lokasi saat ini siap dipakai sebagai koordinat tujuan")
      },
      () => {
        setLocationRefreshing(false)
        showToast("Tidak bisa mengambil lokasi. Izinkan akses lokasi di browser.")
      },
      {
        enableHighAccuracy: true,
        timeout: 20_000,
        maximumAge: 0
      }
    )
  }

  async function submit() {
    if (!receiverName.trim()) {
      showToast("Tulis nama penerima paket")
      return
    }

    if (!receiverContact.trim()) {
      showToast("Nomor WA atau email penerima paket")
      return
    }

    if (senderType === "other") {
      if (!senderName.trim()) {
        showToast("Tulis nama pengirim paket")
        return
      }
      if (!senderContact.trim()) {
        showToast("Nomor WA atau email pengirim paket")
        return
      }
    }

    const addr = destinationAddress.trim()
    if (!addr) {
      showToast("Isi alamat tujuan")
      return
    }

    let destLat: number
    let destLng: number
    if (mapboxPick !== null) {
      destLat = mapboxPick.lat
      destLng = mapboxPick.lng
    } else if (userProximity !== null) {
      destLat = userProximity.lat
      destLng = userProximity.lng
    } else {
      showToast(
        "Izinkan lokasi GPS atau ketuk “Gunakan lokasi saat ini”, atau pilih patokan dari daftar"
      )
      return
    }

    const supabase = createBrowserSupabaseClient()
    const {
      data: { session }
    } = await supabase.auth.getSession()
    if (!session) {
      window.location.href =
        "/choose-type?redirect=" + encodeURIComponent("/handover/create")
      return
    }

    const limRes = await fetch("/api/handover/limits")
    const lim = await limRes.json()
    if (lim.authenticated && lim.at_limit) {
      showToast("Batas paket aktif tercapai untuk akun Anda.")
      return
    }

    const finalSender =
      senderType === "self"
        ? localStorage.getItem("user_name") || "Sender"
        : senderName

    localStorage.setItem("draft_sender_name", finalSender)
    localStorage.setItem("draft_sender_contact", senderContact)
    localStorage.setItem("draft_receiver_name", receiverName)
    localStorage.setItem("draft_receiver_contact", receiverContact)
    localStorage.setItem("draft_destination_address", addr)
    localStorage.setItem("draft_destination_lat", String(destLat))
    localStorage.setItem("draft_destination_lng", String(destLng))
    localStorage.setItem("draft_destination_city", destinationCity.trim())
    localStorage.setItem("draft_destination_postcode", destinationPostalCode.trim())

    window.location.href = "/package"
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">
      <main className="p-8 pt-16 space-y-12">
        <section>
          <p className="text-sm font-medium mb-6">
            Siapa yang kirim paket ini?
          </p>

          <div className="flex gap-8 mb-8">
            <button
              type="button"
              onClick={() => setSenderType("self")}
              className="flex items-center gap-2"
            >
              <div className="w-4 h-4 border border-[#3E2723] rounded-full flex items-center justify-center">
                {senderType === "self" && (
                  <div className="w-2 h-2 bg-[#3E2723] rounded-full" />
                )}
              </div>
              <span className="text-sm">Saya</span>
            </button>

            <button
              type="button"
              onClick={() => setSenderType("other")}
              className="flex items-center gap-2"
            >
              <div className="w-4 h-4 border border-[#3E2723] rounded-full flex items-center justify-center">
                {senderType === "other" && (
                  <div className="w-2 h-2 bg-[#3E2723] rounded-full" />
                )}
              </div>
              <span className="text-sm">Orang lain</span>
            </button>
          </div>

          {senderType === "other" && (
            <div className="space-y-4 mb-8">
              <input
                className="line-input"
                placeholder="Tulis nama pengirim paket"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
              <input
                className="line-input"
                placeholder="Nomor WA atau email pengirim paket"
                value={senderContact}
                onChange={(e) => setSenderContact(e.target.value)}
              />
            </div>
          )}
        </section>

        <section>
          <p className="text-sm font-medium mb-6">
            Paket ini untuk siapa?
          </p>

          <div className="space-y-4">
            <input
              className="line-input"
              placeholder="Tulis nama penerima paket"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
            />
            <input
              className="line-input"
              placeholder="Nomor WA atau email penerima paket"
              value={receiverContact}
              onChange={(e) => setReceiverContact(e.target.value)}
            />
          </div>
        </section>

        <section>
          <p className="text-sm font-medium mb-2">
            Alamat Tujuan
          </p>
          {limitHint && (
            <p className="text-[10px] text-[#A1887F] mb-2">{limitHint}</p>
          )}
          <p className="text-[11px] text-[#A1887F] leading-relaxed mb-4">
            Ketik alamat lengkap jika perlu. Patokan dari peta (opsional) membantu nama tempat.
            Koordinat tujuan memakai patokan jika Anda memilihnya; jika tidak, dipakai lokasi GPS Anda
            saat ini.
          </p>

          <div ref={wrapRef} className="relative space-y-2">
            <input
              className="line-input w-full"
              placeholder="Alamat tujuan (boleh diketik bebas)"
              autoComplete="off"
              value={destinationAddress}
              onChange={(e) => onDestinationInputChange(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locationRefreshing}
                className="text-[#3E2723] underline underline-offset-2 disabled:opacity-50"
              >
                {locationRefreshing
                  ? "Mengambil lokasi…"
                  : "Gunakan lokasi saat ini"}
              </button>
              {userProximity && (
                <span className="text-[#A1887F]">
                  GPS siap
                </span>
              )}
            </div>
            {(mapboxPick || userProximity) && (
              <p className="text-[10px] text-[#A1887F]">
                {mapboxPick
                  ? "Koordinat tujuan akan memakai patokan yang dipilih."
                  : "Koordinat tujuan akan memakai lokasi GPS Anda saat ini."}
              </p>
            )}
            {geocodeLoading && MAPBOX_TOKEN && (
              <span className="text-[10px] opacity-50">Mencari patokan…</span>
            )}
            {MAPBOX_TOKEN && suggestions.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[#A1887F]">
                  Patokan / POI
                </p>
                <ul className="max-h-48 overflow-auto rounded border border-[#E0DED7] bg-white text-sm shadow">
                  {suggestions.map((f) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-[#F5F4F0]"
                        onClick={() => selectSuggestion(f)}
                      >
                        {f.place_name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-wider text-[#A1887F] mb-1">
                  Kota (opsional)
                </label>
                <input
                  className="line-input w-full"
                  placeholder="Kota"
                  autoComplete="off"
                  value={destinationCity}
                  onChange={(e) => onCityChange(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-wider text-[#A1887F] mb-1">
                  Kode pos (opsional)
                </label>
                <input
                  className="line-input w-full"
                  placeholder="Kode pos"
                  autoComplete="off"
                  inputMode="numeric"
                  value={destinationPostalCode}
                  onChange={(e) => onPostalChange(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#3E2723] text-white text-sm px-6 py-3 rounded-full shadow-lg z-30">
          {toast}
        </div>
      )}

      <div className="flex justify-between px-8 pb-8 text-sm">
        <Link href="/" className="opacity-60">
          ← Sebelumnya
        </Link>

        <button type="button" onClick={submit} className="font-medium">
          Lanjut →
        </button>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import {
  fetchForwardGeocodeSuggestions,
  type MapboxGeocodeFeature
} from "@/lib/mapbox-forward-geocode"

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
  const [destinationLat, setDestinationLat] = useState<number | null>(null)
  const [destinationLng, setDestinationLng] = useState<number | null>(null)

  const [suggestions, setSuggestions] = useState<MapboxGeocodeFeature[]>([])
  const [geocodeLoading, setGeocodeLoading] = useState(false)

  const [toast, setToast] = useState("")
  const wrapRef = useRef<HTMLDivElement>(null)

  /** Used as Mapbox `proximity` so suggestions favor areas near the user (optional). */
  const [userProximity, setUserProximity] = useState<{
    lng: number
    lat: number
  } | null>(null)

  useEffect(() => {
    const name = localStorage.getItem("user_name")
    const contact = localStorage.getItem("user_contact")
    if (name) setSenderName(name)
    if (contact) setSenderContact(contact)
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
    if (destinationLat !== null || destinationLng !== null) {
      setDestinationLat(null)
      setDestinationLng(null)
    }
    debouncedGeocode(value)
  }

  function selectSuggestion(f: MapboxGeocodeFeature) {
    const [lng, lat] = f.center
    setDestinationAddress(f.place_name)
    setDestinationLat(lat)
    setDestinationLng(lng)
    setSuggestions([])
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  function submit() {
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

    if (!destinationAddress.trim()) {
      showToast("Isi alamat tujuan")
      return
    }

    if (destinationLat == null || destinationLng == null) {
      showToast("Pilih alamat dari daftar saran")
      return
    }

    if (!MAPBOX_TOKEN) {
      showToast("Konfigurasi peta belum aktif (token)")
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
    localStorage.setItem("draft_destination_address", destinationAddress)
    localStorage.setItem("draft_destination_lat", String(destinationLat))
    localStorage.setItem("draft_destination_lng", String(destinationLng))

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
          <p className="text-sm font-medium mb-6">
            Alamat Tujuan
          </p>

          <div ref={wrapRef} className="relative space-y-1">
            <input
              className="line-input w-full"
              placeholder="Alamat Tujuan"
              autoComplete="off"
              value={destinationAddress}
              onChange={(e) => onDestinationInputChange(e.target.value)}
            />
            {geocodeLoading && (
              <span className="text-[10px] opacity-50">Mencari alamat…</span>
            )}
            {suggestions.length > 0 && (
              <ul className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-auto rounded border border-[#E0DED7] bg-white text-sm shadow">
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
            )}
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

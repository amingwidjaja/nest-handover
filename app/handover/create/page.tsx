"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  fetchForwardGeocodeSuggestions,
  type MapboxGeocodeFeature
} from "@/lib/mapbox-forward-geocode"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { parseNominatimReverse } from "@/lib/nominatim-parse"
import {
  readHandoverMode,
  type HandoverMode
} from "@/lib/handover-mode"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const PRIMARY = "#3E2723"

const inputClass =
  "w-full rounded-2xl border border-[#E0DED7] bg-white text-sm text-[var(--primary-color)] placeholder:text-[#9A8F88] px-4 py-3.5 outline-none transition focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--primary-color)]/20"

const labelClass =
  "block text-xs font-semibold uppercase tracking-wider text-[var(--primary-color)] mb-2"

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
  const router = useRouter()
  const [handoverMode, setHandoverMode] = useState<HandoverMode | null>(null)

  const [senderType, setSenderType] = useState("self")

  const [senderName, setSenderName] = useState("")
  const [senderContact, setSenderContact] = useState("")

  const [receiverName, setReceiverName] = useState("")
  const [receiverWhatsapp, setReceiverWhatsapp] = useState("")
  const [receiverEmail, setReceiverEmail] = useState("")

  const [destinationAddress, setDestinationAddress] = useState("")
  const [destinationCity, setDestinationCity] = useState("")
  const [destinationPostalCode, setDestinationPostalCode] = useState("")
  const [mapboxPick, setMapboxPick] = useState<{ lat: number; lng: number } | null>(
    null
  )

  const [suggestions, setSuggestions] = useState<MapboxGeocodeFeature[]>([])
  const [geocodeLoading, setGeocodeLoading] = useState(false)
  const [locationPhase, setLocationPhase] = useState<
    "idle" | "gps" | "reverse"
  >("idle")

  const [toast, setToast] = useState("")
  const wrapRef = useRef<HTMLDivElement>(null)

  const [userProximity, setUserProximity] = useState<{
    lng: number
    lat: number
  } | null>(null)

  useEffect(() => {
    const m = readHandoverMode()
    if (!m) {
      router.replace("/handover/select")
      return
    }
    setHandoverMode(m)
  }, [router])

  useEffect(() => {
    if (!handoverMode) return

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

      const wa =
        localStorage.getItem("draft_receiver_whatsapp") ||
        localStorage.getItem("draft_receiver_contact") ||
        ""
      if (wa) setReceiverWhatsapp(wa)

      if (handoverMode === "pro") {
        const draftCity = localStorage.getItem("draft_destination_city")
        const draftPost = localStorage.getItem("draft_destination_postcode")
        if (draftCity) setDestinationCity(draftCity)
        if (draftPost) setDestinationPostalCode(draftPost)
        const em = localStorage.getItem("draft_receiver_email") || ""
        if (em) setReceiverEmail(em)
      } else {
        setReceiverEmail("")
        setDestinationAddress("")
        setDestinationCity("")
        setDestinationPostalCode("")
        setMapboxPick(null)
        setSuggestions([])
      }
    }
    void hydrate()
  }, [handoverMode])

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

  const runGeocode = useCallback(
    async (query: string) => {
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
    },
    [userProximity]
  )

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

  async function useCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      showToast("GPS tidak didukung di perangkat ini")
      return
    }

    setLocationPhase("gps")

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setUserProximity({ lng, lat })
        setMapboxPick({ lat, lng })

        setLocationPhase("reverse")

        try {
          const res = await fetch(
            `/api/geocode/reverse?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}`
          )
          const raw = (await res.json()) as Record<string, unknown>
          if (!res.ok) {
            throw new Error(
              typeof raw.error === "string" ? raw.error : "reverse geocode failed"
            )
          }
          const parsed = parseNominatimReverse(raw)
          if (parsed?.addressLine) {
            setDestinationAddress(parsed.addressLine)
            localStorage.setItem("draft_destination_address", parsed.addressLine)
          }
          if (parsed?.city) {
            setDestinationCity(parsed.city)
            localStorage.setItem("draft_destination_city", parsed.city)
          }
          if (parsed?.postalCode) {
            setDestinationPostalCode(parsed.postalCode)
            localStorage.setItem("draft_destination_postcode", parsed.postalCode)
          }
          showToast(
            parsed?.addressLine
              ? "Alamat terisi dari lokasi Anda"
              : "Koordinat tujuan diset; alamat bisa disesuaikan manual"
          )
        } catch {
          showToast(
            "Koordinat tersimpan; isi alamat/kota/kode pos jika perlu"
          )
        } finally {
          setLocationPhase("idle")
        }
      },
      () => {
        setLocationPhase("idle")
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
    if (!handoverMode) return

    if (!receiverName.trim()) {
      showToast("Tulis nama penerima paket")
      return
    }

    if (!receiverWhatsapp.trim()) {
      showToast("Isi nomor WhatsApp penerima paket")
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

    let addr = ""
    let destLat: number
    let destLng: number

    if (handoverMode === "pro") {
      addr = destinationAddress.trim()
      if (!addr) {
        showToast("Isi alamat tujuan")
        return
      }
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
    } else {
      if (userProximity === null) {
        showToast(
          "Mode Lite memerlukan lokasi GPS. Izinkan akses lokasi di browser, lalu coba lagi."
        )
        return
      }
      destLat = userProximity.lat
      destLng = userProximity.lng
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

    const wa = receiverWhatsapp.trim()
    const em = handoverMode === "pro" ? receiverEmail.trim() : ""

    localStorage.setItem("draft_sender_name", finalSender)
    localStorage.setItem("draft_sender_contact", senderContact)
    localStorage.setItem("draft_receiver_name", receiverName)
    localStorage.setItem("draft_receiver_whatsapp", wa)
    localStorage.setItem("draft_receiver_email", em)
    localStorage.setItem("draft_receiver_contact", wa)
    if (handoverMode === "pro") {
      localStorage.setItem("draft_destination_address", addr)
      localStorage.setItem("draft_destination_lat", String(destLat))
      localStorage.setItem("draft_destination_lng", String(destLng))
      localStorage.setItem("draft_destination_city", destinationCity.trim())
      localStorage.setItem("draft_destination_postcode", destinationPostalCode.trim())
    } else {
      try {
        localStorage.removeItem("draft_destination_address")
        localStorage.removeItem("draft_destination_city")
        localStorage.removeItem("draft_destination_postcode")
      } catch {
        /* ignore */
      }
      localStorage.setItem("draft_destination_lat", String(destLat))
      localStorage.setItem("draft_destination_lng", String(destLng))
    }

    window.location.href = "/package"
  }

  if (!handoverMode) {
    return (
      <div
        className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-sm text-[#9A8F88]"
        style={{ ["--primary-color" as string]: PRIMARY }}
      >
        Memuat…
      </div>
    )
  }

  const isPro = handoverMode === "pro"

  return (
    <div
      className="min-h-screen bg-[#FAF9F6] text-[var(--primary-color)] flex flex-col"
      style={{ ["--primary-color" as string]: PRIMARY }}
    >
      <main className="mx-auto w-full max-w-lg flex-1 px-6 pb-8 pt-14 space-y-12 sm:px-8">
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#9A8F88]">
            NEST Paket
          </p>
          <Link
            href="/handover/select"
            className="inline-block text-[11px] text-[#A1887F] transition hover:text-[var(--primary-color)]/75 underline decoration-[#C4B8B0]/60 underline-offset-2"
          >
            Salah pilih mode? Kembali ke awal
          </Link>
        </div>

        <section className="space-y-6">
          <p className="text-base font-medium text-[var(--primary-color)]">
            Siapa yang kirim paket ini?
          </p>

          <div className="flex flex-wrap gap-10">
            <button
              type="button"
              onClick={() => setSenderType("self")}
              className="flex items-center gap-2.5 text-sm"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--primary-color)]">
                {senderType === "self" && (
                  <div className="h-2.5 w-2.5 rounded-full bg-[var(--primary-color)]" />
                )}
              </div>
              <span>Saya</span>
            </button>

            <button
              type="button"
              onClick={() => setSenderType("other")}
              className="flex items-center gap-2.5 text-sm"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--primary-color)]">
                {senderType === "other" && (
                  <div className="h-2.5 w-2.5 rounded-full bg-[var(--primary-color)]" />
                )}
              </div>
              <span>Orang lain</span>
            </button>
          </div>

          {senderType === "other" && (
            <div className="space-y-5 pt-2">
              <div>
                <label className={labelClass}>Nama pengirim</label>
                <input
                  className={inputClass}
                  placeholder="Tulis nama pengirim paket"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Kontak pengirim</label>
                <input
                  className={inputClass}
                  placeholder="Nomor WA atau email pengirim paket"
                  value={senderContact}
                  onChange={(e) => setSenderContact(e.target.value)}
                />
              </div>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <p className="text-base font-medium text-[var(--primary-color)]">
            Paket ini untuk siapa?
          </p>

          <div className="space-y-6">
            <div>
              <label className={labelClass}>Nama penerima</label>
              <input
                className={inputClass}
                placeholder="Tulis nama penerima paket"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>WhatsApp penerima</label>
              <input
                className={inputClass}
                placeholder="Contoh: 62812xxxxxxxx"
                inputMode="tel"
                autoComplete="tel"
                value={receiverWhatsapp}
                onChange={(e) => setReceiverWhatsapp(e.target.value)}
              />
              <p className="mt-2 text-[11px] leading-relaxed text-[#9A8F88]">
                Nomor ini akan digunakan untuk mengirimkan notifikasi status
                pengiriman secara otomatis melalui sistem.
              </p>
            </div>

            {isPro && (
              <div>
                <label className={labelClass}>Email penerima</label>
                <input
                  className={inputClass}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={receiverEmail}
                  onChange={(e) => setReceiverEmail(e.target.value)}
                />
                <p className="mt-2 text-[11px] leading-relaxed text-[#9A8F88]">
                  Opsional. Digunakan untuk pengiriman salinan tanda terima digital
                  (PDF).
                </p>
              </div>
            )}
          </div>
        </section>

        {isPro && (
        <section className="space-y-5">
          <p className="text-base font-medium text-[var(--primary-color)]">
            Alamat tujuan
          </p>
          <p className="text-[12px] leading-relaxed text-[#9A8F88]">
            Ketik alamat lengkap jika perlu. Patokan dari peta (opsional) membantu
            nama tempat. Koordinat tujuan memakai patokan jika Anda memilihnya;
            jika tidak, dipakai lokasi GPS Anda saat ini.
          </p>

          <div ref={wrapRef} className="relative space-y-4">
            <div>
              <label className={labelClass}>Alamat lengkap</label>
              <input
                className={inputClass}
                placeholder="Alamat tujuan (boleh diketik bebas)"
                autoComplete="off"
                value={destinationAddress}
                onChange={(e) => onDestinationInputChange(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locationPhase !== "idle"}
                className="font-medium text-[var(--primary-color)] underline underline-offset-2 disabled:opacity-50"
              >
                {locationPhase === "gps"
                  ? "Mengambil lokasi…"
                  : locationPhase === "reverse"
                    ? "Mencari alamat…"
                    : "Gunakan lokasi saat ini"}
              </button>
              {userProximity && (
                <span className="text-[#A1887F]">GPS siap</span>
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
              <div className="space-y-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[#A1887F]">
                  Patokan / POI
                </p>
                <ul className="max-h-48 overflow-auto rounded-2xl border border-[#E0DED7] bg-white text-sm shadow-sm">
                  {suggestions.map((f) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        className="w-full px-4 py-3 text-left hover:bg-[#F5F4F0]"
                        onClick={() => selectSuggestion(f)}
                      >
                        {f.place_name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 pt-2 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Kota (opsional)</label>
                <input
                  className={inputClass}
                  placeholder="Kota"
                  autoComplete="off"
                  value={destinationCity}
                  onChange={(e) => onCityChange(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Kode pos (opsional)</label>
                <input
                  className={inputClass}
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
        )}

        {!isPro && (
          <p className="text-[12px] leading-relaxed text-[#9A8F88]">
            Mode Lite memakai lokasi perangkat Anda sebagai koordinat penerimaan.
            Pastikan izin lokasi aktif.
          </p>
        )}

        <p className="text-center text-[10px] leading-relaxed text-[#9A8F88]">
          © 2026 NEST76 STUDIO • Infrastruktur digital yang aman dan terverifikasi.
          Data kontak Anda terenkripsi dalam ekosistem kami.
        </p>
      </main>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-full bg-[var(--primary-color)] px-6 py-3 text-sm text-[#FAF9F6] shadow-lg sm:bottom-8">
          {toast}
        </div>
      )}

      <div className="flex justify-between border-t border-[#ECE7E3] bg-[#FAF9F6]/95 px-6 py-6 text-sm backdrop-blur-sm sm:px-8">
        <Link
          href="/handover/select"
          className="text-[#9A8F88] transition hover:text-[var(--primary-color)]"
        >
          ← Sebelumnya
        </Link>

        <button
          type="button"
          onClick={submit}
          className="font-semibold text-[var(--primary-color)] transition active:scale-95"
        >
          Lanjut →
        </button>
      </div>
    </div>
  )
}

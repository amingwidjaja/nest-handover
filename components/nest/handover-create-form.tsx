"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  fetchForwardGeocodeSuggestions,
  type GeocodeFeature as MapboxGeocodeFeature
} from "@/lib/azure-forward-geocode"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { parseNominatimReverse } from "@/lib/nominatim-parse"
import {
  readHandoverMode,
  HANDOVER_MODE_KEY,
  type HandoverMode
} from "@/lib/handover-mode"
import { StudioFooter } from "@/components/nest/studio-footer"
import type { HandoverCreateInitialData } from "@/lib/handover-editable-types"

const AZURE_MAPS_KEY = process.env.NEXT_PUBLIC_AZURE_MAPS_KEY

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

type HandoverCreateFormProps = {
  initialData?: HandoverCreateInitialData | null
}

export function HandoverCreateForm({ initialData = null }: HandoverCreateFormProps) {
  const router = useRouter()
  const [handoverMode, setHandoverMode] = useState<HandoverMode | null>(
    () => initialData?.mode ?? null
  )

  const [senderType, setSenderType] = useState("self")
  const [senderName, setSenderName] = useState("")
  const [senderContact, setSenderContact] = useState("")

  const [receiverName, setReceiverName] = useState("")
  const [receiverWhatsapp, setReceiverWhatsapp] = useState("")
  const [receiverEmail, setReceiverEmail] = useState("")

  const [destinationAddress, setDestinationAddress] = useState("")
  const [destinationDistrict, setDestinationDistrict] = useState("")
  const [destinationCity, setDestinationCity] = useState("")
  const [destinationPostalCode, setDestinationPostalCode] = useState("")
  const [mapboxPick, setMapboxPick] = useState<{ lat: number; lng: number } | null>(null)

  const [suggestions, setSuggestions] = useState<MapboxGeocodeFeature[]>([])
  const [geocodeLoading, setGeocodeLoading] = useState(false)
  const [locationPhase, setLocationPhase] = useState<"idle" | "gps" | "reverse">("idle")

  const [toast, setToast] = useState("")
  const wrapRef = useRef<HTMLDivElement>(null)
  const [userProximity, setUserProximity] = useState<{ lng: number; lat: number } | null>(null)
  const [pendingHandovers, setPendingHandovers] = useState<{ id: string; serial_number: string | null; receiver_target_name: string; created_at: string }[]>([])

  useEffect(() => {
    if (initialData) {
      try { localStorage.setItem(HANDOVER_MODE_KEY, initialData.mode) } catch { /* ignore */ }
      setHandoverMode(initialData.mode)
      return
    }
    const m = readHandoverMode()
    if (!m) { router.replace("/handover/select"); return }
    setHandoverMode(m)
  }, [router, initialData])

  useEffect(() => {
    if (!initialData) return
    setSenderType(initialData.senderType)
    setSenderName(initialData.senderName)
    setSenderContact(initialData.senderContact)
    setReceiverName(initialData.receiverName)
    setReceiverWhatsapp(initialData.receiverWhatsapp)
    setReceiverEmail(initialData.receiverEmail)
    setDestinationAddress(initialData.destinationAddress)
    setDestinationDistrict(initialData.destinationDistrict)
    setDestinationCity(initialData.destinationCity)
    setDestinationPostalCode(initialData.destinationPostalCode)
    if (initialData.destinationLat != null && initialData.destinationLng != null) {
      const lat = initialData.destinationLat
      const lng = initialData.destinationLng
      setMapboxPick({ lat, lng })
      setUserProximity({ lat, lng })
    }
  }, [initialData])

  useEffect(() => {
    if (!handoverMode || initialData) return
    async function hydrate() {
      const name = localStorage.getItem("user_name")
      const contact = localStorage.getItem("user_contact")
      if (contact) setSenderContact(contact)
      const supabase = createBrowserSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const res = await fetch("/api/profile")
        const j = await res.json()
        const p = j.profile as { display_name?: string | null; company_name?: string | null; role?: string | null } | null
        // Pro: lock sender_name ke company_name
        if (handoverMode === "pro" && p?.company_name?.trim()) {
          const cn = p.company_name.trim()
          setSenderName(cn)
          try { localStorage.setItem("user_name", cn) } catch { /* ignore */ }
        } else {
          const dn =
            (p?.display_name && String(p.display_name).trim()) ||
            (p?.company_name && String(p.company_name).trim()) ||
            name || ""
          if (dn) {
            setSenderName(dn)
            try { localStorage.setItem("user_name", dn) } catch { /* ignore */ }
          } else if (name) {
            setSenderName(name)
          }
        }
      } else if (name) {
        setSenderName(name)
      }
      const wa = localStorage.getItem("draft_receiver_whatsapp") || localStorage.getItem("draft_receiver_contact") || ""
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
  }, [handoverMode, initialData])

  useEffect(() => {
    if (initialData) return // kalau edit, tidak perlu cek
    async function checkPending() {
      try {
        const res = await fetch("/api/handover/list")
        const data = await res.json()
        const pending = (data.handovers ?? []).filter((h: any) => h.status === "created")
        setPendingHandovers(pending)
      } catch { /* ignore */ }
    }
    checkPending()
  }, [initialData])

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserProximity({ lng: pos.coords.longitude, lat: pos.coords.latitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 }
    )
  }, [])

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setSuggestions([])
    }
    document.addEventListener("mousedown", onDocDown)
    return () => document.removeEventListener("mousedown", onDocDown)
  }, [])

  const runGeocode = useCallback(async (query: string) => {
    if (!AZURE_MAPS_KEY || query.trim().length < 2) { setSuggestions([]); return }
    setGeocodeLoading(true)
    try {
      const features = await fetchForwardGeocodeSuggestions(query, AZURE_MAPS_KEY, {
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

  function parsePlaceName(placeName: string) {
    // Format Azure Maps ID: "Jalan X, Kelurahan Y, Kecamatan Z, Provinsi 12345"
    const parts = placeName.split(",").map(s => s.trim())

    let district = ""
    let city = ""
    let postcode = ""
    let addressParts: string[] = []

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const lower = part.toLowerCase()

      if (lower.startsWith("kelurahan ") || lower.startsWith("desa ")) {
        district = part
      } else if (lower.startsWith("kecamatan ")) {
        // skip — kecamatan tidak dipakai sebagai district field
      } else {
        // cek apakah bagian terakhir mengandung kode pos (5 digit di akhir)
        const pcMatch = part.match(/(\d{5})$/)
        if (pcMatch) {
          postcode = pcMatch[1]
          // sisanya adalah nama kota/provinsi
          city = part.replace(pcMatch[1], "").trim()
        } else if (i > 0 && !district) {
          addressParts.push(part)
        } else if (i === 0) {
          addressParts.push(part)
        }
      }
    }

    return { district, city, postcode }
  }

  function selectSuggestion(f: MapboxGeocodeFeature) {
    const [lng, lat] = f.center
    setDestinationAddress(f.place_name)
    setMapboxPick({ lat, lng })

    const { district, city, postcode } = parsePlaceName(f.place_name)

    setDestinationDistrict(district)
    setDestinationCity(city)
    setDestinationPostalCode(postcode)
    localStorage.setItem("draft_destination_district", district)
    localStorage.setItem("draft_destination_city", city)
    localStorage.setItem("draft_destination_postcode", postcode)
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
          if (!res.ok) throw new Error(typeof raw.error === "string" ? raw.error : "reverse geocode failed")
          const parsed = parseNominatimReverse(raw)
          if (parsed?.addressLine) {
            setDestinationAddress(parsed.addressLine)
            localStorage.setItem("draft_destination_address", parsed.addressLine)
          }
          // Azure Maps returns suburb as district/kecamatan
          const suburb = (raw?.address as any)?.suburb || ""
          if (suburb) {
            setDestinationDistrict(suburb)
            localStorage.setItem("draft_destination_district", suburb)
          }
          if (parsed?.city) {
            setDestinationCity(parsed.city)
            localStorage.setItem("draft_destination_city", parsed.city)
          }
          if (parsed?.postalCode) {
            setDestinationPostalCode(parsed.postalCode)
            localStorage.setItem("draft_destination_postcode", parsed.postalCode)
          }
          showToast(parsed?.addressLine ? "Alamat terisi dari lokasi Anda" : "Koordinat tujuan diset")
        } catch {
          showToast("Koordinat tersimpan; isi alamat/kota/kode pos jika perlu")
        } finally {
          setLocationPhase("idle")
        }
      },
      () => {
        setLocationPhase("idle")
        showToast("Tidak bisa mengambil lokasi. Izinkan akses lokasi di browser.")
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 }
    )
  }

  async function submit() {
    if (!handoverMode) return

    if (!receiverName.trim()) { showToast("Tulis nama penerima paket"); return }
    if (!receiverWhatsapp.trim()) { showToast("Isi nomor WhatsApp penerima paket"); return }

    if (senderType === "other") {
      if (!senderName.trim()) { showToast("Tulis nama pengirim paket"); return }
      if (!senderContact.trim()) { showToast("Nomor WA atau email pengirim paket"); return }
    }

    let addr = ""
    let destLat: number = 0
    let destLng: number = 0

    if (handoverMode === "pro") {
      addr = destinationAddress.trim()
      if (!addr) { showToast("Isi alamat tujuan"); return }
      if (mapboxPick !== null) {
        destLat = mapboxPick.lat
        destLng = mapboxPick.lng
      } else if (userProximity !== null) {
        destLat = userProximity.lat
        destLng = userProximity.lng
      } else {
        showToast("Izinkan lokasi GPS atau pilih patokan dari daftar")
        return
      }
    } else {
      if (userProximity === null) {
        showToast("Mode Lite memerlukan lokasi GPS. Izinkan akses lokasi di browser.")
        return
      }
      destLat = userProximity.lat
      destLng = userProximity.lng
    }

    const supabase = createBrowserSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      window.location.href = "/choose-type?redirect=" + encodeURIComponent("/handover/create")
      return
    }

    const isSenderProxy = senderType === "other"
    const finalSender = isSenderProxy
      ? senderName.trim()
      : localStorage.getItem("user_name") || "Sender"
    const senderWa = isSenderProxy ? senderContact.trim() : null
    const wa = receiverWhatsapp.trim()
    const em = handoverMode === "pro" ? receiverEmail.trim() : ""

    // Kalau edit, langsung navigate ke package dengan id yang ada
    if (initialData?.handoverId) {
      // Update handover yang ada via PATCH
      const payload: Record<string, unknown> = {
        handover_id: initialData.handoverId,
        sender_name: finalSender,
        receiver_target_name: receiverName.trim(),
        receiver_whatsapp: wa,
        receiver_email: em,
        is_sender_proxy: isSenderProxy,
        sender_whatsapp: senderWa,
        destination_lat: destLat || null,
        destination_lng: destLng || null,
      }
      if (handoverMode === "pro") {
        payload.destination_address = addr
        payload.destination_district = destinationDistrict.trim()
        payload.destination_city = destinationCity.trim()
        payload.destination_postal_code = destinationPostalCode.trim()
      }
      await fetch("/api/handover/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      window.location.href = `/package?handover_id=${encodeURIComponent(initialData.handoverId)}`
      return
    }

    // Flow baru — cek limit lalu create handover sekarang
    const limRes = await fetch("/api/handover/limits")
    const lim = await limRes.json()
    if (lim.authenticated && lim.at_limit) {
      showToast("Batas paket aktif tercapai untuk akun Anda.")
      return
    }

    const payload: Record<string, unknown> = {
      sender_name: finalSender,
      receiver_target_name: receiverName.trim(),
      receiver_target_phone: wa,
      receiver_whatsapp: wa,
      receiver_email: em,
      receiver_target_email: em,
      is_sender_proxy: isSenderProxy,
      sender_whatsapp: senderWa,
      destination_lat: destLat || null,
      destination_lng: destLng || null,
    }
    if (handoverMode === "pro") {
      payload.destination_address = addr
      payload.destination_district = destinationDistrict.trim()
      payload.destination_city = destinationCity.trim()
      payload.destination_postal_code = destinationPostalCode.trim()
    }

    const res = await fetch("/api/handover/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const data = await res.json()

    if (res.status === 429) { showToast(data.error || "Batas paket aktif tercapai."); return }
    if (!data.success) { showToast(data.error || "Gagal membuat dokumen"); return }

    window.location.href = `/package?handover_id=${encodeURIComponent(data.handover_id)}`
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
    <>    
    <style jsx global>{`
      input, textarea { font-size: 16px !important; }
    `}</style>
    <div
      className="relative flex min-h-screen flex-col overflow-hidden bg-[#FAF9F6] text-[var(--primary-color)]"
      style={{ ["--primary-color" as string]: PRIMARY }}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <main className="mx-auto w-full max-w-lg flex-1 space-y-10 px-6 pb-32 pt-20 sm:px-8">
          {initialData?.handoverId && (
            <p className="text-[11px] font-medium text-[#5D4037]">
              Melanjutkan paket{initialData.serialNumber ? ` · ${initialData.serialNumber}` : ""}
            </p>
          )}

          {!initialData && pendingHandovers.length > 0 && (
            <div className="rounded-xl border border-[#E0DED7] bg-white overflow-hidden">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A1887F] px-4 pt-4 pb-2">
                Paket belum selesai
              </p>
              {pendingHandovers.slice(0, 3).map((h) => {
                const isPro = Boolean((h as any).destination_address)
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => { window.location.href = `/package?handover_id=${encodeURIComponent(h.id)}` }}
                    className="w-full flex items-center justify-between px-4 py-3 border-t border-[#E0DED7] text-left active:bg-[#F5F4F0] transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                          isPro ? "bg-[#EAF3DE] text-[#3B6D11]" : "bg-[#F0EDE8] text-[#A1887F]"
                        }`}>
                          {isPro ? "PRO" : "LITE"}
                        </span>
                        <p className="text-sm font-medium text-[#3E2723]">{h.receiver_target_name || "-"}</p>
                      </div>
                      <p className="text-[11px] text-[#A1887F]">
                        {new Date(h.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#3E2723] font-medium shrink-0 ml-3">Lanjut →</span>
                  </button>
                )
              })}
              <div className="border-t border-[#E0DED7] px-4 py-3">
                <p className="text-[11px] text-[#A1887F]">Atau isi form di bawah untuk buat paket baru.</p>
              </div>
            </div>
          )}

          {/* Sender section */}
          <section className="space-y-6">
            <p className="text-base font-medium">Siapa yang kirim paket ini?</p>
            <div className="flex border-b border-[#E0DED7]">
              {(["self", "other"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSenderType(type)}
                  className={`flex-1 pb-2.5 text-sm font-medium transition-colors active:scale-[0.97]
                    ${senderType === type
                      ? "border-b-2 border-[#3E2723] text-[#3E2723] -mb-px"
                      : "text-[#A1887F]"
                    }`}
                >
                  {type === "self" ? "Saya" : "Orang lain"}
                </button>
              ))}
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
                    readOnly={isPro}
                  />
                  {isPro && (
                    <p className="mt-1.5 text-[11px] text-[#9A8F88]">
                      Mode Pro: nama pengirim dikunci ke nama perusahaan.
                    </p>
                  )}
                </div>
                <div>
                <label className={labelClass}>Nomor WA pengirim</label>
                <input className={inputClass} placeholder="08123..." inputMode="tel" value={senderContact} onChange={(e) => setSenderContact(e.target.value)} />
                <p className="mt-2 text-[11px] text-[#9A8F88]">Pengirim akan mendapat notifikasi saat paket diterima.</p>
                </div>
              </div>
            )}
          </section>

          {/* Receiver section */}
          <section className="space-y-6">
            <p className="text-base font-medium">Paket ini untuk siapa?</p>
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Nama penerima</label>
                <input className={inputClass} placeholder="Tulis nama penerima paket" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>WhatsApp penerima</label>
                <input className={inputClass} placeholder="0812..." inputMode="tel" autoComplete="tel" value={receiverWhatsapp} onChange={(e) => setReceiverWhatsapp(e.target.value)} />
                <p className="mt-2 text-[11px] leading-relaxed text-[#9A8F88]">
                  Pastikan nomor ini benar — digunakan untuk notifikasi dan membuka tanda terima digital.
                </p>
              </div>
              {isPro && (
                <div>
                  <label className={labelClass}>Email penerima</label>
                  <input className={inputClass} type="email" inputMode="email" autoComplete="email" placeholder="nama@email.com" value={receiverEmail} onChange={(e) => setReceiverEmail(e.target.value)} />
                  <p className="mt-2 text-[11px] leading-relaxed text-[#9A8F88]">Opsional. Untuk salinan tanda terima digital (PDF).</p>
                </div>
              )}
            </div>
          </section>

          {/* Address section (Pro only) */}
          {isPro && (
            <section className="space-y-4">
              <p className="text-base font-medium">Alamat tujuan</p>
              <div ref={wrapRef} className="relative space-y-4">
                <div>
                  <label className={labelClass}>Alamat lengkap</label>
                  <input
                    className={inputClass}
                    placeholder="Alamat tujuan"
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
                    className="font-medium underline underline-offset-2 transition active:scale-[0.96] disabled:opacity-50"
                  >
                    {locationPhase === "gps" ? "Mengambil lokasi…" : locationPhase === "reverse" ? "Mencari alamat…" : "Gunakan lokasi saat ini"}
                  </button>
                  {userProximity && <span className="text-[#A1887F]">GPS siap</span>}
                </div>
                {geocodeLoading && AZURE_MAPS_KEY && <span className="text-[10px] opacity-50">Mencari patokan…</span>}
                {AZURE_MAPS_KEY && suggestions.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[#A1887F]">Patokan / POI</p>
                    <ul className="max-h-48 overflow-auto rounded-2xl border border-[#E0DED7] bg-white text-sm shadow-sm">
                      {suggestions.map((f) => (
                        <li key={f.id}>
                          <button type="button" className="w-full px-4 py-3 text-left transition hover:bg-[#F5F4F0] active:scale-[0.98]" onClick={() => selectSuggestion(f)}>
                            {f.place_name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="col-span-3">
                    <label className={labelClass}>Kecamatan / Kelurahan</label>
                    <input className={inputClass} placeholder="Kec. / Kel." autoComplete="off" value={destinationDistrict}
                      onChange={(e) => { setDestinationDistrict(e.target.value); localStorage.setItem("draft_destination_district", e.target.value) }} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Kota</label>
                    <input className={inputClass} placeholder="Kota" autoComplete="off" value={destinationCity} onChange={(e) => onCityChange(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Kode Pos</label>
                    <input className={inputClass} placeholder="12345" autoComplete="off" inputMode="numeric" value={destinationPostalCode} onChange={(e) => onPostalChange(e.target.value)} />
                  </div>
                </div>
              </div>
            </section>
          )}

          {!isPro && (
            <p className="text-[12px] leading-relaxed text-[#9A8F88]">
              Mode Lite memakai lokasi perangkat Anda sebagai koordinat penerimaan. Pastikan izin lokasi aktif.
            </p>
          )}

          <div className="space-y-3 pt-4">
            <button
              type="button"
              onClick={submit}
              className="w-full py-4 rounded-xl bg-[#3E2723] text-sm font-bold uppercase tracking-wider text-[#FAF9F6] transition-transform active:scale-[0.97] disabled:opacity-50"
            >
              Lanjut →
            </button>
            <Link
              href="/handover/select"
              className="block w-full text-center py-3 rounded-xl border border-[#E0DED7] bg-white text-[11px] font-medium text-[#A1887F] transition-transform active:scale-[0.97] active:bg-[#F5F4F0]"
            >
              Salah pilih mode? Kembali ke awal
            </Link>
          </div>
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-[7rem] left-1/2 z-[55] -translate-x-1/2 rounded-full bg-[var(--primary-color)] px-6 py-3 text-sm text-[#FAF9F6] shadow-lg sm:bottom-[7.5rem]">
          {toast}
        </div>
      )}

      <StudioFooter />
    </div>
    </>
  )
}

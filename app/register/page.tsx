"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { fetchReverseAddressParts } from "@/lib/mapbox-reverse-geocode"
import { sanitizeWhatsappDigits } from "@/lib/whatsapp-sanitize"
import { parseApiErrorBody } from "@/lib/parse-api-error"

const BG = "#FAF9F6"
const INK = "#3E2723"
const MAPBOX = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const inputClass =
  "line-input w-full text-[#3E2723] placeholder:text-[#C1BFB9]"
const lbl =
  "mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#6D5D54]"

function RegisterInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/paket"
  const [displayName, setDisplayName] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [streetAddress, setStreetAddress] = useState("")
  const [district, setDistrict] = useState("")
  const [city, setCity] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [pinning, setPinning] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [gate, setGate] = useState<"loading" | "ready">("loading")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createBrowserSupabaseClient()
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (cancelled) return
      if (!session) {
        router.replace(
          `/login?redirect=${encodeURIComponent(`/register?redirect=${encodeURIComponent(redirect)}`)}`
        )
        return
      }
      const res = await fetch("/api/profile")
      const data = await res.json()
      if (cancelled) return
      if (data.profile?.onboarded_at) {
        router.replace("/paket")
        return
      }
      setGate("ready")
    })()
    return () => {
      cancelled = true
    }
  }, [redirect, router])

  function pinLocation() {
    setFormError(null)
    if (!navigator.geolocation) {
      setFormError("Peramban tidak mendukung GPS.")
      return
    }
    setPinning(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setLatitude(lat)
        setLongitude(lng)
        try {
          if (MAPBOX) {
            const parts = await fetchReverseAddressParts(lat, lng, MAPBOX)
            if (parts) {
              setStreetAddress(parts.streetLine || parts.fullPlaceName)
              setDistrict(parts.district)
              setCity(parts.city)
              setPostalCode(parts.postalCode)
            }
          }
        } catch {
          setFormError("Gagal mengambil alamat dari Mapbox — isi manual.")
        } finally {
          setPinning(false)
        }
      },
      () => {
        setPinning(false)
        setFormError("Akses lokasi ditolak atau tidak tersedia.")
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const name = displayName.trim()
    const wa = sanitizeWhatsappDigits(whatsapp)
    const street = streetAddress.trim()
    const dist = district.trim()
    const kota = city.trim()
    const pos = postalCode.trim()
    if (!name) return setFormError("Nama tampilan wajib diisi.")
    if (!wa) return setFormError("Nomor WhatsApp wajib diisi.")
    if (!street) return setFormError("Alamat jalan wajib diisi.")
    if (!dist) return setFormError("Kecamatan/Kelurahan wajib diisi.")
    if (!kota) return setFormError("Kota/Kabupaten wajib diisi.")
    if (!pos) return setFormError("Kode pos wajib diisi.")
    if (latitude == null || longitude == null) {
      return setFormError("Gunakan PIN LOKASI SEKARANG untuk menyimpan koordinat GPS.")
    }
    setLoading(true)
    const supabase = createBrowserSupabaseClient()
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setFormError("Sesi tidak valid. Silakan masuk lagi.")
        return
      }
      const res = await fetch("/api/profile/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          type: "personal",
          display_name: name,
          whatsapp: wa,
          street_address: street,
          district: dist,
          city: kota,
          postal_code: pos,
          latitude,
          longitude
        })
      })
      if (!res.ok) throw new Error(await parseApiErrorBody(res))
      try {
        localStorage.setItem("user_name", name)
      } catch {
        /* ignore */
      }
      router.replace(redirect)
      router.refresh()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan.")
    } finally {
      setLoading(false)
    }
  }

  const clr = () => setFormError(null)

  if (gate === "loading") {
    return (
      <div
        className="flex min-h-screen items-center justify-center text-sm text-[#A1887F]"
        style={{ backgroundColor: BG }}
      >
        Memuat…
      </div>
    )
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: BG, color: INK }}
    >
      <div className="absolute right-6 top-6 z-10 flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
        <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#3E2723]/60">
          Systems Online
        </span>
      </div>
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16 sm:px-8">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#9A8F88]">
            NEST76 STUDIO
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-[#3E2723]">
            Lengkapi Profil Pribadi
          </h1>
          <p className="text-[12px] leading-relaxed text-[#6D5D54]">
            Data Anda untuk identitas Tanda Terima Digital — tidak disebarluaskan.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className={lbl}>
              Nama tampilan <span className="text-[#8D6E63]">*</span>
            </label>
            <input
              className={inputClass}
              autoComplete="name"
              placeholder="Nama yang tampil di bukti kirim"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value)
                clr()
              }}
            />
          </div>
          <div>
            <label className={lbl}>
              Nomor WhatsApp <span className="text-[#8D6E63]">*</span>
            </label>
            <input
              className={inputClass}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0812..."
              value={whatsapp}
              onChange={(e) => {
                setWhatsapp(e.target.value)
                clr()
              }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-transparent pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6D5D54]">
              Alamat terstruktur
            </p>
            <button
              type="button"
              onClick={pinLocation}
              disabled={pinning}
              className="text-[10px] font-bold uppercase tracking-wider text-[#3E2723] underline-offset-4 hover:underline disabled:opacity-50"
            >
              {pinning ? "Memuat lokasi…" : "📍 PIN LOKASI SEKARANG"}
            </button>
          </div>

          <div>
            <label className={lbl}>
              Alamat jalan <span className="text-[#8D6E63]">*</span>
            </label>
            <textarea
              className={`${inputClass} min-h-[72px] resize-y py-2`}
              placeholder="No. rumah, nama jalan, RT/RW"
              value={streetAddress}
              onChange={(e) => {
                setStreetAddress(e.target.value)
                clr()
              }}
            />
          </div>
          <div>
            <label className={lbl}>
              Kecamatan / Kelurahan <span className="text-[#8D6E63]">*</span>
            </label>
            <input
              className={inputClass}
              placeholder="Kec. / Kel."
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value)
                clr()
              }}
            />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={lbl}>
                Kota / Kabupaten <span className="text-[#8D6E63]">*</span>
              </label>
              <input
                className={inputClass}
                placeholder="Kota / Kab."
                value={city}
                onChange={(e) => {
                  setCity(e.target.value)
                  clr()
                }}
              />
            </div>
            <div>
              <label className={lbl}>
                Kode pos <span className="text-[#8D6E63]">*</span>
              </label>
              <input
                className={inputClass}
                inputMode="numeric"
                placeholder="12345"
                value={postalCode}
                onChange={(e) => {
                  setPostalCode(e.target.value)
                  clr()
                }}
              />
            </div>
          </div>

          <div className="mt-8 space-y-3 border-l-[3px] border-[#3E2723] bg-[#EFEBE9]/40 p-5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3E2723]" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#3E2723]">
                Panduan Privasi
              </p>
            </div>
            <p className="text-[11px] leading-relaxed text-[#5D4037]">
              Nama, WhatsApp, alamat terstruktur, dan koordinat dipakai untuk
              identitas pengirim pada tanda terima. Kami tidak menjual data ke
              pihak ketiga.
            </p>
          </div>
          {formError && (
            <p className="text-center text-[11px] leading-snug text-[#5D4037]">
              {formError}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 bg-[#3E2723] py-4 text-xs font-bold uppercase tracking-[0.2em] text-[#FAF9F6] shadow-md transition-all hover:bg-[#2D1B19] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Simpan & Lanjut"
            )}
          </button>
        </form>
        <p className="mt-16 text-[9px] text-center font-mono font-bold uppercase tracking-[0.2em] text-[#3E2723] opacity-60">
          © 2026 NEST76 STUDIO
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] text-sm text-[#A1887F]">
          Memuat…
        </div>
      }
    >
      <RegisterInner />
    </Suspense>
  )
}

'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { LogOut, Loader2 } from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { fetchReverseAddressParts } from "@/lib/azure-reverse-geocode"
import { sanitizeWhatsappDigits } from "@/lib/whatsapp-sanitize"

const AZURE_MAPS_KEY = process.env.NEXT_PUBLIC_AZURE_MAPS_KEY
const inputClass = "line-input w-full text-[#3E2723] placeholder:text-[#C1BFB9]"
const lbl = "mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#6D5D54]"

function clearSessionLocalStorage() {
  const keys = ["user_name","user_contact","nest_onboarding_type","nest_onboarding_redirect"]
  for (const k of keys) { try { localStorage.removeItem(k) } catch { /* ignore */ } }
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k?.startsWith("draft_")) localStorage.removeItem(k)
    }
  } catch { /* ignore */ }
}

type ProfileRow = {
  user_type:        "personal" | "umkm"
  company_name:     string | null
  company_logo_url: string | null
  company_address:  string | null
  display_name:     string | null
  whatsapp:         string | null
  street_address:   string | null
  district:         string | null
  city:             string | null
  postal_code:      string | null
  onboarded_at:     string | null
}

export default function ProfilePage() {
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [pinning,     setPinning]     = useState(false)
  const [email,       setEmail]       = useState<string | null>(null)
  const [profile,     setProfile]     = useState<ProfileRow | null>(null)
  const [toast,       setToast]       = useState<string | null>(null)

  // UMKM fields
  const [companyName,   setCompanyName]   = useState("")
  const [whatsapp,      setWhatsapp]      = useState("")
  const [streetAddress, setStreetAddress] = useState("")
  const [district,      setDistrict]      = useState("")
  const [city,          setCity]          = useState("")
  const [postalCode,    setPostalCode]    = useState("")
  const [logoFile,      setLogoFile]      = useState<File | null>(null)
  const [logoPreview,   setLogoPreview]   = useState<string | null>(null)

  // Personal upgrade fields
  const [upgradeName,  setUpgradeName]  = useState("")
  const [upgradeLogoFile, setUpgradeLogoFile] = useState<File | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    const supabase = createBrowserSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setEmail(user.email ?? null)
    const res  = await fetch("/api/profile")
    if (!res.ok) { setLoading(false); return }
    const data = await res.json()
    const p    = data.profile as ProfileRow | null
    setProfile(p)
    if (p?.user_type === "umkm") {
      setCompanyName(p.company_name ?? "")
      setWhatsapp(p.whatsapp ?? "")
      setStreetAddress(p.street_address ?? "")
      setDistrict(p.district ?? "")
      setCity(p.city ?? "")
      setPostalCode(p.postal_code ?? "")
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleLogout() {
    const supabase = createBrowserSupabaseClient()
    clearSessionLocalStorage()
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  function pinLocation() {
    if (!navigator.geolocation) { showToast("Browser tidak mendukung GPS"); return }
    setPinning(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          if (AZURE_MAPS_KEY) {
            const parts = await fetchReverseAddressParts(pos.coords.latitude, pos.coords.longitude, AZURE_MAPS_KEY)
            if (parts) {
              setStreetAddress(parts.streetLine || parts.fullPlaceName)
              setDistrict(parts.district || "")
              setCity(parts.city)
              setPostalCode(parts.postalCode)
              showToast("Lokasi berhasil dipin!")
            }
          }
        } catch { showToast("GPS OK tapi alamat gagal — isi manual") }
        finally { setPinning(false) }
      },
      () => { setPinning(false); showToast("GPS ditolak — isi manual") },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    )
  }

  function onLogoPick(f: File | null) {
    if (!f) { setLogoFile(null); setLogoPreview(null); return }
    const img = new Image()
    img.onload = () => {
      const max = 512
      const scale = Math.min(max / img.width, max / img.height, 1)
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale)
      const canvas = document.createElement("canvas")
      canvas.width = w; canvas.height = h
      canvas.getContext("2d")?.drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => {
        if (!blob) return
        const file = new File([blob], "logo.png", { type: "image/png" })
        setLogoFile(file)
        setLogoPreview(URL.createObjectURL(file))
      }, "image/png", 0.92)
    }
    img.src = URL.createObjectURL(f)
  }

  async function saveUmkm() {
    const cn   = companyName.trim()
    const wa   = sanitizeWhatsappDigits(whatsapp)
    const street = streetAddress.trim()
    const kota = city.trim()
    if (!cn)     return showToast("Nama usaha wajib diisi")
    if (!street) return showToast("Alamat jalan wajib diisi")
    if (!kota)   return showToast("Kota / Kabupaten wajib diisi")

    setSaving(true)
    try {
      const fd = new FormData()
      fd.set("company_name",   cn)
      fd.set("whatsapp",       wa)
      fd.set("street_address", street)
      fd.set("district",       district.trim())
      fd.set("city",           kota)
      fd.set("postal_code",    postalCode.trim())
      if (logoFile) fd.set("logo", logoFile)

      const res = await fetch("/api/profile", { method: "PATCH", body: fd })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || "Gagal simpan") }
      showToast("Profil berhasil disimpan ✓")
      await load()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  async function upgradeToUmkm() {
    if (!upgradeName.trim()) return showToast("Isi nama perusahaan / UMKM")
    setSaving(true)
    try {
      const fd = new FormData()
      fd.set("company_name", upgradeName.trim())
      if (upgradeLogoFile) fd.set("logo", upgradeLogoFile)
      const res  = await fetch("/api/profile/upgrade", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal upgrade")
      showToast("Selamat! Akun UMKM aktif ✓")
      setUpgradeName(""); setUpgradeLogoFile(null)
      await load()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-[#A1887F]">Memuat…</div>
  }

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-sm">Anda belum masuk.</p>
        <Link href="/login?redirect=/profile" className="text-sm underline">Masuk</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-8">

      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-medium mb-1">Profil</h1>
          <p className="text-xs text-[#A1887F] break-all">{email}</p>
          <span className="inline-block mt-2 text-[10px] uppercase tracking-widest px-2 py-1 border border-[#E0DED7] rounded">
            {profile?.user_type === "umkm" ? "UMKM" : "Personal"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="shrink-0 inline-flex items-center gap-2 text-sm text-[#5D4037] border border-[#E0DED7] rounded-sm px-3 py-2 hover:bg-[#F5F4F0] transition-colors"
        >
          <LogOut size={18} strokeWidth={1.5} />
          Log out
        </button>
      </header>

      {/* ── UMKM form ── */}
      {profile?.user_type === "umkm" && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6D5D54]">Data UMKM</h2>

          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-sm border border-[#E0DED7] bg-[#FAF9F6] overflow-hidden flex items-center justify-center shrink-0">
              {(logoPreview || profile.company_logo_url) ? (
                // mix-blend-mode: multiply hilangkan background putih dari PNG logo
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview || profile.company_logo_url!}
                  alt="Logo"
                  className="w-full h-full object-contain"
                  style={{ mixBlendMode: "multiply" }}
                />
              ) : (
                <span className="text-[10px] text-[#C4B8B0] text-center leading-tight px-1">Belum ada logo</span>
              )}
            </div>
            <div className="flex-1">
              <label className={lbl}>Ganti Logo <span className="text-[#A1887F] normal-case font-normal">(opsional)</span></label>
              <input type="file" accept="image/*" className="w-full text-xs text-[#5D4037]"
                onChange={e => onLogoPick(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          {/* Nama usaha */}
          <div>
            <label className={lbl}>Nama usaha <span className="text-[#8D6E63]">*</span></label>
            <input className={inputClass} placeholder="Nama bisnis / UMKM"
              value={companyName} onChange={e => setCompanyName(e.target.value)} />
          </div>

          {/* WhatsApp */}
          <div>
            <label className={lbl}>Nomor WhatsApp</label>
            <input className={inputClass} type="tel" inputMode="tel" placeholder="0812..."
              value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
          </div>

          {/* Alamat */}
          <div className="flex items-center justify-between pt-1">
            <p className={lbl.replace("mb-1.5 block ", "")}>
              Alamat <span className="text-[#A1887F] normal-case font-normal">(PIN untuk isi otomatis)</span>
            </p>
            <button type="button" onClick={pinLocation} disabled={pinning}
              className="text-[10px] font-bold uppercase tracking-wider text-[#3E2723] underline-offset-4 hover:underline disabled:opacity-50">
              {pinning ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "📍 PIN LOKASI"}
            </button>
          </div>

          <div>
            <label className={lbl}>Alamat jalan <span className="text-[#8D6E63]">*</span></label>
            <textarea className={`${inputClass} min-h-[72px] resize-y py-2`}
              placeholder="No. bangunan, nama jalan, RT/RW"
              value={streetAddress} onChange={e => setStreetAddress(e.target.value)} />
          </div>

          <div>
            <label className={lbl}>Kecamatan / Kelurahan <span className="text-[#A1887F] normal-case font-normal">(opsional)</span></label>
            <input className={inputClass} placeholder="Kec. Gambir, Kel. Petojo, dst."
              value={district} onChange={e => setDistrict(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Kota / Kabupaten <span className="text-[#8D6E63]">*</span></label>
              <input className={inputClass} placeholder="Jakarta, Bandung, dst."
                value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Kode pos <span className="text-[#A1887F] normal-case font-normal">(opsional)</span></label>
              <input className={inputClass} inputMode="numeric" placeholder="12345"
                value={postalCode} onChange={e => setPostalCode(e.target.value)} />
            </div>
          </div>

          <button type="button" disabled={saving} onClick={saveUmkm}
            className="w-full py-3 bg-[#3E2723] text-[#FAF9F6] text-xs font-bold uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Perubahan"}
          </button>
        </section>
      )}

      {/* ── Personal: upgrade ke UMKM ── */}
      {profile?.user_type === "personal" && (
        <section className="space-y-3 border border-[#E0DED7] rounded-sm p-4 bg-white/50">
          <h2 className="text-sm font-medium">Upgrade ke UMKM</h2>
          <p className="text-[11px] text-[#A1887F] leading-relaxed">
            Satu arah: tidak bisa di-downgrade. Batas paket aktif naik menjadi 100.
          </p>
          <input className="line-input w-full" placeholder="Nama perusahaan / UMKM"
            value={upgradeName} onChange={e => setUpgradeName(e.target.value)} />
          <label className="block text-[10px] font-medium uppercase tracking-wider text-[#A1887F]">
            Logo (opsional, PNG)
          </label>
          <input type="file" accept="image/*" className="text-xs w-full"
            onChange={e => setUpgradeLogoFile(e.target.files?.[0] ?? null)} />
          <button type="button" disabled={saving} onClick={upgradeToUmkm}
            className="w-full py-3 bg-[#3E2723] text-[#FAF9F6] text-xs font-bold uppercase tracking-widest disabled:opacity-50">
            Upgrade ke UMKM
          </button>
        </section>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-[#3E2723] px-4 py-2 text-xs text-white sm:bottom-28">
          {toast}
        </div>
      )}
    </div>
  )
}

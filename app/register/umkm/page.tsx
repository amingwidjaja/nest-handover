"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"

const BG = "#FAF9F6"
const INK = "#3E2723"

const inputClass =
  "line-input w-full text-[#3E2723] placeholder:text-[#C1BFB9]"

function RegisterUmkmInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/paket"

  const [companyName, setCompanyName] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
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
        const next = `/register/umkm?redirect=${encodeURIComponent(redirect)}`
        router.replace(`/login?redirect=${encodeURIComponent(next)}`)
        return
      }
      const res = await fetch("/api/profile")
      const data = await res.json()
      if (cancelled) return
      if (data.profile?.onboarded_at) {
        router.replace(redirect)
        return
      }
      setGate("ready")
    })()
    return () => {
      cancelled = true
    }
  }, [redirect, router])

  async function parseJsonError(res: Response): Promise<string> {
    const text = await res.text()
    try {
      const j = JSON.parse(text) as { error?: string }
      return j.error || text || `HTTP ${res.status}`
    } catch {
      return text || `HTTP ${res.status}`
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const cn = companyName.trim()
    const ca = companyAddress.trim()
    const wa = whatsapp.trim()

    if (!cn || !ca) {
      setFormError("Nama bisnis dan alamat wajib diisi.")
      return
    }
    if (!wa) {
      setFormError("Nomor WhatsApp wajib diisi.")
      return
    }

    setLoading(true)
    const supabase = createBrowserSupabaseClient()
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setFormError("Sesi tidak valid. Silakan masuk lagi.")
        setLoading(false)
        return
      }

      const fd = new FormData()
      fd.set("type", "umkm")
      fd.set("company_name", cn)
      fd.set("company_address", ca)
      fd.set("whatsapp", wa)
      if (logoFile && logoFile.size > 0) {
        fd.set("logo", logoFile)
      }

      const res = await fetch("/api/profile/onboard", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: fd
      })

      if (!res.ok) throw new Error(await parseJsonError(res))

      try {
        localStorage.setItem("user_name", cn)
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
            Lengkapi Profil UMKM
          </h1>
          <p className="text-[12px] leading-relaxed text-[#6D5D54]">
            Branding & kontak untuk tanda terima profesional.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#6D5D54]">
              Nama usaha <span className="text-[#8D6E63]">*</span>
            </label>
            <input
              className={inputClass}
              placeholder="Nama bisnis / UMKM"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value)
                setFormError(null)
              }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#6D5D54]">
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
                setFormError(null)
              }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#6D5D54]">
              Alamat bisnis <span className="text-[#8D6E63]">*</span>
            </label>
            <textarea
              className={`${inputClass} min-h-[88px] resize-y py-2`}
              placeholder="Alamat lengkap"
              value={companyAddress}
              onChange={(e) => {
                setCompanyAddress(e.target.value)
                setFormError(null)
              }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#6D5D54]">
              Logo (opsional)
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full text-xs text-[#5D4037]"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="mt-8 p-5 bg-[#EFEBE9]/40 border-l-[3px] border-[#3E2723] space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3E2723] animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#3E2723]">
                Panduan Privasi
              </p>
            </div>
            <p className="text-[11px] text-[#5D4037] leading-relaxed">
              Nama usaha, logo, dan kontak dipakai untuk branding tanda terima
              dan notifikasi. Data tidak dijual ke pihak ketiga.
            </p>
          </div>

          {formError && (
            <p className="text-[11px] leading-snug text-[#5D4037] text-center">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 bg-[#3E2723] py-4 text-xs font-bold uppercase tracking-[0.2em] text-[#FAF9F6] shadow-md transition-all hover:bg-[#2D1B19] disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Simpan & Lanjut"
            )}
          </button>
        </form>

        <p className="mt-16 text-[9px] text-center text-[#3E2723] font-mono tracking-[0.2em] uppercase font-bold opacity-60">
          © 2026 NEST76 STUDIO • Build with Passion and Integrity
        </p>
      </div>
    </div>
  )
}

export default function RegisterUmkmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-[#A1887F] bg-[#FAF9F6]">
          Memuat…
        </div>
      }
    >
      <RegisterUmkmInner />
    </Suspense>
  )
}

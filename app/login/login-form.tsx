"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Loader2, MapPin, Smartphone, Lock } from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/paket"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [profileExists, setProfileExists] = useState<boolean | null>(null)
  const [checkingEmail, setCheckingEmail] = useState(false)

  const seqRef = useRef(0)

  useEffect(() => {
    const t = email.trim()
    if (!t || !EMAIL_RE.test(t)) {
      setProfileExists(null)
      setCheckingEmail(false)
      return
    }

    seqRef.current += 1
    const mySeq = seqRef.current
    setCheckingEmail(true)

    const id = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/profile/check-email?email=${encodeURIComponent(t)}`
        )
        const json = (await res.json()) as { exists?: boolean; error?: string }
        if (mySeq !== seqRef.current) return
        if (!res.ok) {
          setProfileExists(null)
          return
        }
        setProfileExists(Boolean(json.exists))
      } catch {
        if (mySeq !== seqRef.current) return
        setProfileExists(null)
      } finally {
        if (mySeq === seqRef.current) setCheckingEmail(false)
      }
    }, 800)

    return () => {
      window.clearTimeout(id)
    }
  }, [email])

  async function submit() {
    const em = email.trim()
    if (!em || !password) {
      setMsg("Email dan password wajib diisi")
      return
    }
    if (password.length < 6) {
      setMsg("Password minimal 6 digit ya, Bro! 🛡️")
      return
    }

    let exists = profileExists
    if (exists === null && EMAIL_RE.test(em)) {
      try {
        const res = await fetch(
          `/api/profile/check-email?email=${encodeURIComponent(em)}`
        )
        const json = (await res.json()) as { exists?: boolean; error?: string }
        if (!res.ok) {
          setMsg(json.error || "Gagal memeriksa email. Coba lagi.")
          return
        }
        exists = Boolean(json.exists)
        setProfileExists(exists)
      } catch {
        setMsg("Gagal memeriksa email. Coba lagi.")
        return
      }
    }

    if (exists === null) {
      setMsg("Masukkan alamat email yang valid")
      return
    }

    setLoading(true)
    setMsg(null)
    const supabase = createBrowserSupabaseClient()

    try {
      if (exists) {
        const { error } = await supabase.auth.signInWithPassword({
          email: em,
          password
        })
        if (error) throw error
        router.replace(redirect)
        router.refresh()
        return
      }

      const { error: signErr } = await supabase.auth.signUp({
        email: em,
        password
      })
      if (signErr) throw signErr

      await new Promise((r) => setTimeout(r, 400))
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (session?.access_token) {
        router.replace(
          `/choose-type?redirect=${encodeURIComponent(redirect)}`
        )
      } else {
        router.push(`/register/verify?email=${encodeURIComponent(em)}`)
      }
      router.refresh()
    } catch (e: unknown) {
      const err = e as { message?: string }
      const m = (err.message || "").toLowerCase()
      if (!exists && (m.includes("already registered") || m.includes("already been registered"))) {
        setMsg("Email ini sudah terdaftar. Silakan masuk.")
        setProfileExists(true)
      } else {
        setMsg(
          e instanceof Error ? e.message : "Gagal. Cek kembali email & password."
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const em = email.trim()
  const emailValid = EMAIL_RE.test(em)
  let ctaLabel = "DAFTAR GRATIS"
  if (checkingEmail && emailValid) {
    ctaLabel = "MEMUAT…"
  } else if (profileExists === true) {
    ctaLabel = "MASUK NEST76 PAKET"
  } else if (profileExists === false) {
    ctaLabel = "DAFTAR GRATIS"
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center space-y-6">
          <img
            src="/logo-nest-paket.png"
            alt="NEST76 Paket Logo"
            className="mx-auto w-40 drop-shadow-sm"
          />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tighter uppercase text-[#3E2723]">
              NEST76 Paket
            </h1>
            <p className="text-[10px] font-bold text-[#A1887F] tracking-[0.2em] uppercase opacity-80 max-w-[280px] mx-auto leading-relaxed">
              Tanda Terima Digital Gratis untuk Indonesia
            </p>
          </div>
        </div>

        <div className="bg-[#EFEBE9]/40 p-6 border-l-[3px] border-[#3E2723] space-y-3">
          <p className="text-sm text-[#5D4037] leading-relaxed">
            <strong>NEST76 Paket</strong> adalah sistem serah terima digital profesional. Memastikan setiap paket tervalidasi secara <strong>GPS-Lock</strong> dan terkirim otomatis via <strong>WhatsApp</strong> tanpa resi kertas. Sistem ini dirancang untuk segala kebutuhan, mulai dari dokumentasi <strong>barang pribadi</strong> (titipan/kado), hingga <strong>operasional UMKM</strong> (kirim Laundry/Air Galon).
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <input
                className="w-full bg-transparent border-b border-[#D7CCC8] py-3 px-1 focus:border-[#3E2723] outline-none transition-all placeholder:text-[#D7CCC8] text-sm"
                type="email"
                placeholder="Alamat e-mail yg masih aktif"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              {checkingEmail && emailValid && (
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-[#A1887F] font-medium">
                  Memeriksa…
                </span>
              )}
            </div>
            <input
              className="w-full bg-transparent border-b border-[#D7CCC8] py-3 px-1 focus:border-[#3E2723] outline-none transition-all placeholder:text-[#D7CCC8] text-sm"
              type="password"
              placeholder="Password minimum 6 digit"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {msg && (
            <div className="bg-[#FBE9E7] p-3 text-[11px] text-center text-[#D84315] font-medium">
              {msg}
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 bg-[#3E2723] text-white py-4 hover:bg-[#2D1B19] transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-xs font-bold shadow-md"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              ctaLabel
            )}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-6 border-t border-[#D7CCC8]/30">
          <div className="text-center space-y-2 opacity-60">
            <MapPin className="w-5 h-5 mx-auto text-[#3E2723]" />
            <p className="text-[9px] uppercase font-bold tracking-tighter">GPS Lock</p>
          </div>
          <div className="text-center space-y-2 opacity-60">
            <Smartphone className="w-5 h-5 mx-auto text-[#3E2723]" />
            <p className="text-[9px] uppercase font-bold tracking-tighter">Auto WA</p>
          </div>
          <div className="text-center space-y-2 opacity-60">
            <Lock className="w-5 h-5 mx-auto text-[#3E2723]" />
            <p className="text-[9px] uppercase font-bold tracking-tighter">Encrypted</p>
          </div>
        </div>

        <p className="text-[9px] text-center text-[#3E2723] font-mono tracking-[0.2em] uppercase font-bold opacity-60 pt-6">
          © 2026 NEST76 STUDIO • Build with Passion and Integrity
        </p>
      </div>
    </div>
  )
}

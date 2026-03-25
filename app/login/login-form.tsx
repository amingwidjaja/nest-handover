"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Loader2, ShieldCheck, Lock } from "lucide-react" // Tambah icon buat trust
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/paket"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function submit() {
    if (!email.trim() || !password) {
      setMsg("Email dan password wajib diisi")
      return
    }
    setLoading(true)
    setMsg(null)
    const supabase = createBrowserSupabaseClient()
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })
      if (error) throw error

      const pr = await fetch("/api/profile")
      const pj = await pr.json()
      const profile = pj.profile as { onboarded_at?: string | null } | null

      if (!profile || !profile.onboarded_at) {
        const t = (() => {
          try {
            return localStorage.getItem("nest_onboarding_type")
          } catch {
            return null
          }
        })()
        if (t === "personal" || t === "umkm") {
          router.replace(
            `/register?type=${t}&redirect=${encodeURIComponent(redirect)}`
          )
          router.refresh()
          return
        }
        router.replace(
          `/choose-type?redirect=${encodeURIComponent(redirect)}`
        )
        router.refresh()
        return
      }

      router.replace(redirect)
      router.refresh()
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Gagal masuk. Cek kembali email & password.")
    } finally {
      setLoading(false)
    }
  }

  const chooseHref = `/choose-type?redirect=${encodeURIComponent(redirect)}`

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-8">
        
        {/* Header Section: Branding Baru */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4 text-[#3E2723]">
            <ShieldCheck className="w-10 h-10" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">NEST76 STUDIO</h1>
          <p className="text-[13px] text-[#A1887F] leading-relaxed italic">
            "Protokol keamanan untuk integritas serah terima Anda."
          </p>
        </div>

        <div className="space-y-4">
          <input
            className="line-input w-full bg-transparent border-b border-[#D7CCC8] py-2 focus:border-[#3E2723] outline-none transition-all placeholder:text-[#D7CCC8]"
            type="email"
            autoComplete="email"
            placeholder="Email Bisnis / Personal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="line-input w-full bg-transparent border-b border-[#D7CCC8] py-2 focus:border-[#3E2723] outline-none transition-all placeholder:text-[#D7CCC8]"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {msg && (
          <div className="bg-[#EFEBE9] p-3 rounded text-[11px] text-center text-[#5D4037]">
            {msg}
          </div>
        )}

        <div className="space-y-4">
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 bg-[#3E2723] text-white py-3 hover:bg-[#2D1B19] transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Akses Protokol"
            )}
          </button>

          {/* Micro-copy yang menenangkan */}
          <div className="flex items-start gap-2 px-2 py-4 bg-[#F5F5F5] rounded-lg">
            <Lock className="w-4 h-4 text-[#A1887F] mt-0.5" />
            <p className="text-[10px] text-[#A1887F] leading-relaxed">
              <strong>Privasi Terjamin:</strong> Identitas Anda hanya digunakan untuk verifikasi paket. Data dienkripsi secara profesional oleh NEST76 STUDIO.
            </p>
          </div>
        </div>

        <div className="text-center space-y-6">
          <p className="text-xs text-[#A1887F]">
            Belum terdaftar?{" "}
            <Link href={chooseHref} className="font-bold text-[#3E2723] underline underline-offset-4">
              Pilih Personal / UMKM
            </Link>
          </p>

          <Link href="/" className="inline-block text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
            ← Kembali ke Beranda
          </Link>
        </div>

        {/* Branding Footer */}
        <p className="text-[9px] text-center text-[#D7CCC8] font-mono pt-4">
          © 2026 NEST76 STUDIO • Build with Integrity
        </p>
      </div>
    </div>
  )
}
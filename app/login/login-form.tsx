"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"
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
      setMsg("Email dan password wajib")
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
      setMsg(e instanceof Error ? e.message : "Gagal")
    } finally {
      setLoading(false)
    }
  }

  const chooseHref = `/choose-type?redirect=${encodeURIComponent(redirect)}`

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-xl text-center font-medium">Masuk ke NEST</h1>
        <p className="text-xs text-center text-[#A1887F]">
          Akun diperlukan untuk batas paket dan penyimpanan bukti.
        </p>

        <input
          className="line-input w-full"
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="line-input w-full"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {msg && (
          <p className="text-xs text-center text-[#5D4037]">{msg}</p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 border border-[#3E2723] py-3 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#3E2723]" />
          ) : (
            "Masuk"
          )}
        </button>

        <p className="text-xs text-center text-[#A1887F] leading-relaxed">
          Belum punya akun?{" "}
          <Link href={chooseHref} className="font-medium text-[#3E2723] underline">
            Pilih Personal atau UMKM
          </Link>{" "}
          lalu daftar.
        </p>

        <Link href="/" className="block text-center text-xs opacity-50">
          ← Kembali
        </Link>
      </div>
    </div>
  )
}

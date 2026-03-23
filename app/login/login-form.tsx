'use client'

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/paket"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<"signin" | "signup">("signin")
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
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password
        })
        if (error) throw error
        setMsg("Cek email untuk verifikasi (jika diaktifkan di Supabase).")
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        })
        if (error) throw error
        router.replace(redirect)
        router.refresh()
      }
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Gagal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-xl text-center font-medium">Masuk ke NEST</h1>
        <p className="text-xs text-center text-[#A1887F]">
          Akun diperlukan untuk batas paket dan penyimpanan bukti.
        </p>

        <div className="flex gap-4 text-sm justify-center">
          <button
            type="button"
            className={mode === "signin" ? "font-medium border-b border-[#3E2723]" : "opacity-50"}
            onClick={() => setMode("signin")}
          >
            Masuk
          </button>
          <button
            type="button"
            className={mode === "signup" ? "font-medium border-b border-[#3E2723]" : "opacity-50"}
            onClick={() => setMode("signup")}
          >
            Daftar
          </button>
        </div>

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
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
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
          className="w-full py-3 border border-[#3E2723] disabled:opacity-50"
        >
          {loading ? "…" : mode === "signup" ? "Buat akun" : "Masuk"}
        </button>

        <Link href="/" className="block text-center text-xs opacity-50">
          ← Kembali
        </Link>
      </div>
    </div>
  )
}

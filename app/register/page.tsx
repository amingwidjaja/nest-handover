"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"

function RegisterInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const typeParam = searchParams.get("type")
  const redirect = searchParams.get("redirect") || "/paket"

  const type =
    typeParam === "personal" || typeParam === "umkm" ? typeParam : null

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [needsAuth, setNeedsAuth] = useState(true)

  useEffect(() => {
    if (!type) {
      router.replace(`/choose-type?redirect=${encodeURIComponent(redirect)}`)
      return
    }
    try {
      localStorage.setItem("nest_onboarding_type", type)
    } catch {
      /* ignore */
    }
  }, [type, redirect, router])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createBrowserSupabaseClient()
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (cancelled) return
      if (!session) {
        setNeedsAuth(true)
        setChecking(false)
        return
      }
      const res = await fetch("/api/profile")
      const data = await res.json()
      if (cancelled) return
      if (data.profile?.onboarded_at) {
        router.replace(redirect)
        return
      }
      setNeedsAuth(false)
      setChecking(false)
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

  async function runOnboardPersonal(accessToken: string) {
    const res = await fetch("/api/profile/onboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        type: "personal",
        display_name: displayName.trim()
      })
    })
    if (!res.ok) throw new Error(await parseJsonError(res))
    try {
      localStorage.setItem("user_name", displayName.trim())
    } catch {
      /* ignore */
    }
  }

  async function runOnboardUmkm(accessToken: string) {
    const fd = new FormData()
    fd.set("type", "umkm")
    fd.set("company_name", companyName.trim())
    fd.set("company_address", companyAddress.trim())
    if (logoFile && logoFile.size > 0) {
      fd.set("logo", logoFile)
    }
    const res = await fetch("/api/profile/onboard", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: fd
    })
    if (!res.ok) throw new Error(await parseJsonError(res))
    try {
      localStorage.setItem("user_name", companyName.trim())
    } catch {
      /* ignore */
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!type) return
    setMsg(null)

    if (type === "personal") {
      if (!displayName.trim()) {
        setMsg("Nama wajib diisi")
        return
      }
    } else {
      if (!companyName.trim() || !companyAddress.trim()) {
        setMsg("Nama bisnis dan alamat wajib diisi")
        return
      }
    }

    setLoading(true)
    const supabase = createBrowserSupabaseClient()

    try {
      let accessToken: string | null = null

      if (needsAuth) {
        if (!email.trim() || !password) {
          setMsg("Email dan password wajib")
          setLoading(false)
          return
        }
        const { error: signErr } = await supabase.auth.signUp({
          email: email.trim(),
          password
        })
        if (signErr) throw signErr

        await new Promise((r) => setTimeout(r, 450))

        const {
          data: { session }
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
          setMsg(
            "Jika verifikasi email aktif, cek inbox lalu masuk untuk melanjutkan onboarding."
          )
          setLoading(false)
          return
        }
        accessToken = session.access_token
      } else {
        const {
          data: { session }
        } = await supabase.auth.getSession()
        if (!session?.access_token) {
          setMsg("Sesi tidak valid. Silakan masuk lagi.")
          setLoading(false)
          return
        }
        accessToken = session.access_token
      }

      if (type === "personal") {
        await runOnboardPersonal(accessToken)
      } else {
        await runOnboardUmkm(accessToken)
      }

      router.replace(redirect)
      router.refresh()
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Gagal")
    } finally {
      setLoading(false)
    }
  }

  if (!type) {
    return null
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-sm text-[#A1887F]">
        Memuat…
      </div>
    )
  }

  const title = type === "personal" ? "Daftar — Personal" : "Daftar — UMKM"

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-center p-8">
      <div className="w-full max-w-sm mx-auto space-y-6">
        <h1 className="text-xl text-center font-medium">{title}</h1>
        <p className="text-[11px] text-center text-[#A1887F] leading-relaxed">
          Data kamu hanya untuk identitas Tanda Terima Digital &amp; tidak
          disebarluaskan.
        </p>

        <form onSubmit={submit} className="space-y-4">
          {needsAuth && (
            <>
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
                autoComplete="new-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </>
          )}

          {type === "personal" && (
            <input
              className="line-input w-full"
              placeholder="Nama lengkap"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          )}

          {type === "umkm" && (
            <>
              <input
                className="line-input w-full"
                placeholder="Nama bisnis / UMKM"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <textarea
                className="line-input w-full min-h-[88px] py-2"
                placeholder="Alamat bisnis (lengkap)"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
              />
              <input
                type="file"
                accept="image/*"
                className="text-xs w-full"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-[10px] text-[#A1887F]">Logo opsional</p>
            </>
          )}

          {msg && (
            <p className="text-xs text-center text-[#5D4037]">{msg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#3E2723] text-[#FAF9F6] text-sm font-medium disabled:opacity-50"
          >
            {loading ? "…" : needsAuth ? "Daftar & lanjut" : "Simpan & lanjut"}
          </button>
        </form>

        <div className="flex flex-col gap-2 text-center text-xs text-[#A1887F]">
          <Link
            href={`/login?redirect=${encodeURIComponent(redirect)}`}
            className="underline underline-offset-2"
          >
            Sudah punya akun? Masuk
          </Link>
          <Link href={`/choose-type?redirect=${encodeURIComponent(redirect)}`}>
            ← Ganti jenis akun
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-sm text-[#A1887F]">
          Memuat…
        </div>
      }
    >
      <RegisterInner />
    </Suspense>
  )
}

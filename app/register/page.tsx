"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"

const BG = "#FAF9F6"
const INK = "#3E2723"

function mapAuthError(err: { message?: string }): {
  field: "email" | "password" | null
  message: string
} {
  const m = (err.message || "").toLowerCase()
  if (
    m.includes("already registered") ||
    m.includes("already been registered") ||
    m.includes("user already exists") ||
    m.includes("email address is already")
  ) {
    return {
      field: "email",
      message: "Email ini sudah terdaftar. Silakan masuk atau gunakan email lain."
    }
  }
  if (
    m.includes("password") &&
    (m.includes("weak") ||
      m.includes("least") ||
      m.includes("short") ||
      m.includes("characters"))
  ) {
    return {
      field: "password",
      message:
        "Password terlalu lemah. Gunakan kombinasi yang lebih panjang dan kuat."
    }
  }
  if (m.includes("invalid") && m.includes("email")) {
    return { field: "email", message: "Format email tidak valid." }
  }
  return {
    field: null,
    message: err.message || "Terjadi kesalahan. Coba lagi."
  }
}

function RegisterInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/paket"
  const typeParam = searchParams.get("type")
  const prefilled =
    typeParam === "personal" || typeParam === "umkm" ? typeParam : null

  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [accountType, setAccountType] = useState<"personal" | "umkm">(
    prefilled ?? "personal"
  )
  const [companyName, setCompanyName] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [needsAuth, setNeedsAuth] = useState(true)

  useEffect(() => {
    if (prefilled) {
      setAccountType(prefilled)
      try {
        localStorage.setItem("nest_onboarding_type", prefilled)
      } catch {
        /* ignore */
      }
    }
  }, [prefilled])

  useEffect(() => {
    try {
      localStorage.setItem("nest_onboarding_type", accountType)
      localStorage.setItem("nest_onboarding_redirect", redirect)
    } catch {
      /* ignore */
    }
  }, [accountType, redirect])

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

  async function runOnboardUmkmJson(accessToken: string) {
    const res = await fetch("/api/profile/onboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        type: "umkm",
        display_name: displayName.trim(),
        company_name: displayName.trim(),
        company_address: ""
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

  function validateStep1(): boolean {
    setFormError(null)
    setEmailError(null)
    if (!displayName.trim()) {
      setFormError("Nama tampilan wajib diisi.")
      return false
    }
    const em = email.trim()
    if (!em) {
      setEmailError("Email wajib diisi.")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setEmailError("Format email tidak valid.")
      return false
    }
    return true
  }

  function goNext() {
    if (!validateStep1()) return
    setStep(2)
    setPasswordError(null)
    setFormError(null)
  }

  function goBack() {
    setStep(1)
    setPasswordError(null)
    setFormError(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!needsAuth) return
    setEmailError(null)
    setPasswordError(null)
    setFormError(null)

    if (step === 1) {
      goNext()
      return
    }

    if (!password) {
      setPasswordError("Password wajib diisi.")
      return
    }
    if (password.length < 6) {
      setPasswordError("Password minimal 6 karakter.")
      return
    }

    setLoading(true)
    const supabase = createBrowserSupabaseClient()

    try {
      const { error: signErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
            user_type: accountType
          }
        }
      })
      if (signErr) {
        const mapped = mapAuthError(signErr)
        if (mapped.field === "email") setEmailError(mapped.message)
        else if (mapped.field === "password") setPasswordError(mapped.message)
        else setFormError(mapped.message)
        setLoading(false)
        return
      }

      await new Promise((r) => setTimeout(r, 400))

      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        router.push(
          `/register/verify?email=${encodeURIComponent(email.trim())}`
        )
        setLoading(false)
        return
      }

      if (accountType === "personal") {
        await runOnboardPersonal(session.access_token)
      } else {
        await runOnboardUmkmJson(session.access_token)
      }

      router.replace(redirect)
      router.refresh()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Gagal")
    } finally {
      setLoading(false)
    }
  }

  async function submitLegacy(e: React.FormEvent) {
    e.preventDefault()
    const t =
      typeParam === "personal" || typeParam === "umkm"
        ? typeParam
        : (() => {
            try {
              return localStorage.getItem("nest_onboarding_type") as
                | "personal"
                | "umkm"
                | null
            } catch {
              return null
            }
          })()
    if (!t) {
      setFormError("Pilih jenis akun terlebih dahulu.")
      return
    }

    setFormError(null)
    if (t === "personal") {
      if (!displayName.trim()) {
        setFormError("Nama wajib diisi")
        return
      }
    } else {
      if (!companyName.trim() || !companyAddress.trim()) {
        setFormError("Nama bisnis dan alamat wajib diisi")
        return
      }
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
      if (t === "personal") {
        await runOnboardPersonal(session.access_token)
      } else {
        await runOnboardUmkm(session.access_token)
      }
      router.replace(redirect)
      router.refresh()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Gagal")
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div
        className="flex min-h-screen items-center justify-center text-sm text-[#A1887F]"
        style={{ backgroundColor: BG }}
      >
        Memuat…
      </div>
    )
  }

  if (!needsAuth) {
    const legacyType =
      typeParam === "personal" || typeParam === "umkm"
        ? typeParam
        : undefined
    const title =
      legacyType === "personal"
        ? "Lengkapi — Personal"
        : legacyType === "umkm"
          ? "Lengkapi — UMKM"
          : "Lengkapi profil"

    return (
      <div
        className="flex min-h-screen flex-col justify-center p-8"
        style={{ backgroundColor: BG, color: INK }}
      >
        <div className="absolute right-6 top-6 flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#3E2723]/60">
            Systems Online
          </span>
        </div>
        <div className="mx-auto w-full max-w-sm space-y-6">
          <h1 className="text-center text-xl font-medium">{title}</h1>
          <p className="text-center text-[11px] leading-relaxed text-[#A1887F]">
            Data kamu hanya untuk identitas Tanda Terima Digital &amp; tidak
            disebarluaskan.
          </p>
          <form onSubmit={submitLegacy} className="space-y-4">
            {legacyType === "personal" && (
              <input
                className="line-input w-full"
                placeholder="Nama lengkap"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            )}
            {legacyType === "umkm" && (
              <>
                <input
                  className="line-input w-full"
                  placeholder="Nama bisnis / UMKM"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                <textarea
                  className="line-input min-h-[88px] w-full py-2"
                  placeholder="Alamat bisnis (lengkap)"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-xs"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-[10px] text-[#A1887F]">Logo opsional</p>
              </>
            )}
            {!legacyType && (
              <p className="text-center text-xs text-[#A1887F]">
                Buka halaman{" "}
                <Link
                  href={`/choose-type?redirect=${encodeURIComponent(redirect)}`}
                  className="underline"
                >
                  pilih jenis akun
                </Link>{" "}
                atau daftar ulang.
              </p>
            )}
            {formError && (
              <p className="text-center text-xs text-[#6D4C41]">{formError}</p>
            )}
            {legacyType && (
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 py-3 text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: INK, color: BG }}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Simpan & lanjut"
                )}
              </button>
            )}
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

  const step1Active = step === 1
  const step2Active = step === 2

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
            NEST76 STUDIO · Pendaftaran
          </p>
          <h1 className="text-2xl font-light tracking-tight">Buat akun</h1>
          <p className="text-[12px] leading-relaxed text-[#6D5D54]">
            Data Anda untuk identitas Tanda Terima Digital — tidak
            disebarluaskan.
          </p>
        </div>

        <form onSubmit={submit} className="relative min-h-[420px]">
          <div
            className={`transition-all duration-500 ease-out ${
              step1Active
                ? "relative translate-x-0 opacity-100"
                : "pointer-events-none absolute inset-0 -translate-x-6 opacity-0"
            }`}
          >
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#6D5D54]">
                  Nama tampilan
                </label>
                <input
                  className={`line-input w-full ${formError && !displayName.trim() ? "border-b border-red-400/70" : ""}`}
                  autoComplete="name"
                  placeholder="Nama yang tampil di bukti kirim"
                  value={displayName}
                  disabled={!step1Active}
                  onChange={(e) => {
                    setDisplayName(e.target.value)
                    setFormError(null)
                  }}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#6D5D54]">
                  Email
                </label>
                <input
                  className={`line-input w-full ${emailError ? "border-b border-red-400/70" : ""}`}
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  disabled={!step1Active}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailError(null)
                  }}
                />
                {emailError && (
                  <p className="mt-2 text-[11px] leading-snug text-[#5D4037]">
                    {emailError}
                  </p>
                )}
              </div>
              {formError && step === 1 && (
                <p className="text-[11px] leading-snug text-[#5D4037]">
                  {formError}
                </p>
              )}
              <button
                type="button"
                onClick={goNext}
                className="mt-4 w-full py-3.5 text-sm font-medium transition-all active:scale-95"
                style={{ backgroundColor: INK, color: BG }}
              >
                Lanjut
              </button>
            </div>
          </div>

          <div
            className={`transition-all duration-500 ease-out ${
              step2Active
                ? "relative translate-x-0 opacity-100"
                : "pointer-events-none absolute inset-0 translate-x-6 opacity-0"
            }`}
          >
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#6D5D54]">
                  Password
                </label>
                <input
                  className={`line-input w-full ${passwordError ? "border-b border-red-400/70" : ""}`}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  disabled={!step2Active}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordError(null)
                  }}
                />
                {passwordError && (
                  <p className="mt-2 text-[11px] leading-snug text-[#5D4037]">
                    {passwordError}
                  </p>
                )}
              </div>

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#6D5D54]">
                  Jenis akun
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setAccountType("personal")}
                    className={`rounded-sm border px-4 py-3 text-left text-sm transition-all active:scale-95 ${
                      accountType === "personal"
                        ? "border-[#3E2723] bg-white shadow-sm"
                        : "border-[#E0DED7] bg-white/50"
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#5D4037]">
                      Personal
                    </span>
                    <span className="mt-1 block text-[11px] leading-snug opacity-80">
                      Pengiriman pribadi
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("umkm")}
                    className={`rounded-sm border px-4 py-3 text-left text-sm transition-all active:scale-95 ${
                      accountType === "umkm"
                        ? "border-[#3E2723] bg-white shadow-sm"
                        : "border-[#E0DED7] bg-white/50"
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#5D4037]">
                      Kantor &amp; Bisnis
                    </span>
                    <span className="mt-1 block text-[11px] leading-snug opacity-80">
                      UMKM &amp; kebutuhan resmi
                    </span>
                  </button>
                </div>
              </div>

              {formError && step === 2 && (
                <p className="text-[11px] leading-snug text-[#5D4037]">
                  {formError}
                </p>
              )}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={loading}
                  className="order-2 py-2 text-sm text-[#8D6E63] underline-offset-4 transition-all active:scale-95 hover:underline sm:order-1"
                >
                  ← Kembali
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="order-1 flex min-h-[48px] flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-all active:scale-95 disabled:opacity-50 sm:order-2 sm:max-w-[200px]"
                  style={{ backgroundColor: INK, color: BG }}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Daftar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="mt-10 flex flex-col gap-2 text-center text-xs text-[#A1887F]">
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
        <div className="flex min-h-screen items-center justify-center text-sm text-[#A1887F]">
          Memuat…
        </div>
      }
    >
      <RegisterInner />
    </Suspense>
  )
}

'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"

type ProfileRow = {
  user_type: "personal" | "umkm"
  company_name: string | null
  company_logo_url: string | null
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [companyName, setCompanyName] = useState("")
  const [saving, setSaving] = useState(false)
  const [upgradeName, setUpgradeName] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  async function load() {
    const supabase = createBrowserSupabaseClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    setEmail(user.email ?? null)
    const res = await fetch("/api/profile")
    if (!res.ok) {
      setLoading(false)
      return
    }
    const data = await res.json()
    const p = data.profile as ProfileRow | null
    setProfile(p)
    setCompanyName(p?.company_name ?? "")
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function signOut() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  async function saveCompany() {
    if (profile?.user_type !== "umkm") return
    setSaving(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: companyName })
      })
      if (!res.ok) throw new Error("Gagal simpan")
      setToast("Disimpan")
      setTimeout(() => setToast(null), 2500)
    } catch {
      setToast("Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  async function upgradeToUmkm() {
    if (!upgradeName.trim()) {
      setToast("Isi nama perusahaan / UMKM")
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.set("company_name", upgradeName.trim())
      if (logoFile) {
        fd.set("logo", logoFile)
      }
      const res = await fetch("/api/profile/upgrade", {
        method: "POST",
        body: fd
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal upgrade")
      setToast("Selamat! Akun UMKM aktif.")
      setUpgradeName("")
      setLogoFile(null)
      await load()
    } catch (e: unknown) {
      setToast(e instanceof Error ? e.message : "Gagal")
    } finally {
      setSaving(false)
      setTimeout(() => setToast(null), 4000)
    }
  }

  function onLogoPick(f: File | null) {
    if (!f) {
      setLogoFile(null)
      return
    }
    const img = new Image()
    img.onload = () => {
      const max = 512
      const scale = Math.min(max / img.width, max / img.height, 1)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        (blob) => {
          if (!blob) return
          setLogoFile(new File([blob], "logo.png", { type: "image/png" }))
        },
        "image/png",
        0.92
      )
    }
    img.src = URL.createObjectURL(f)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-sm text-[#A1887F]">
        Memuat…
      </div>
    )
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-sm">Anda belum masuk.</p>
        <Link href="/login?redirect=/profile" className="text-sm underline">
          Masuk
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] p-8 max-w-md mx-auto space-y-10">
      <header>
        <h1 className="text-xl font-medium mb-1">Profil</h1>
        <p className="text-xs text-[#A1887F] break-all">{email}</p>
        <span className="inline-block mt-2 text-[10px] uppercase tracking-widest px-2 py-1 border border-[#E0DED7] rounded">
          {profile?.user_type === "umkm" ? "UMKM" : "Personal"}
        </span>
      </header>

      {profile?.user_type === "personal" && (
        <section className="space-y-2 border border-[#E0DED7] rounded-sm p-4 bg-white/50">
          <h2 className="text-sm font-medium">Upgrade ke UMKM</h2>
          <p className="text-[11px] text-[#A1887F] leading-relaxed">
            Satu arah: tidak bisa di-downgrade. Batas paket aktif naik menjadi 100.
          </p>
          <input
            className="line-input w-full"
            placeholder="Nama perusahaan / UMKM"
            value={upgradeName}
            onChange={(e) => setUpgradeName(e.target.value)}
          />
          <label className="block text-[10px] font-medium uppercase tracking-wider text-[#A1887F]">
            Logo (opsional, PNG)
          </label>
          <input
            type="file"
            accept="image/*"
            className="text-xs w-full"
            onChange={(e) => onLogoPick(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            disabled={saving}
            onClick={upgradeToUmkm}
            className="w-full py-3 bg-[#3E2723] text-[#FAF9F6] text-xs font-bold uppercase tracking-widest disabled:opacity-50"
          >
            Upgrade ke UMKM
          </button>
        </section>
      )}

      {profile?.user_type === "umkm" && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Data UMKM</h2>
          <input
            className="line-input w-full"
            placeholder="Nama perusahaan"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          {profile.company_logo_url && (
            <div className="relative w-24 h-24 border border-[#E0DED7] rounded-sm overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.company_logo_url}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={saveCompany}
            className="w-full py-2 border border-[#3E2723] text-sm disabled:opacity-50"
          >
            Simpan nama perusahaan
          </button>
        </section>
      )}

      <div className="flex justify-between text-sm pt-8 border-t border-[#E0DED7]">
        <Link href="/paket" className="opacity-60">
          ← Paket
        </Link>
        <button type="button" onClick={signOut} className="opacity-60">
          Keluar
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#3E2723] text-white text-xs px-4 py-2 rounded-full z-30">
          {toast}
        </div>
      )}
    </div>
  )
}

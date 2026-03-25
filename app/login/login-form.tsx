"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Loader2, ShieldCheck, MapPin, Smartphone, Lock } from "lucide-react"
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
      router.replace(redirect)
      router.refresh()
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Gagal masuk. Cek kembali email & password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-md space-y-10">
        
        {/* SECTION 1: Branding NEST76 Paket */}
        <div className="text-center space-y-4">
          <div className="flex justify-center text-[#3E2723]">
            <ShieldCheck className="w-14 h-14" strokeWidth={1} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tighter uppercase">NEST76 Paket</h1>
            <p className="text-sm font-medium text-[#A1887F] tracking-[0.15em]">STUDIO EDITION</p>
          </div>
        </div>

        {/* SECTION 2: Apa sih NEST76 Paket? */}
        <div className="bg-[#EFEBE9]/50 p-6 rounded-none border-l-4 border-[#3E2723] space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider">Apa itu NEST76 Paket?</h2>
          <p className="text-sm text-[#5D4037] leading-relaxed">
            Protokol serah terima digital yang menggantikan resi kertas manual. Dirancang untuk memastikan setiap pengiriman tervalidasi secara <strong>GPS-Lock</strong>, terdokumentasi secara <strong>Eksklusif</strong>, dan terkirim otomatis via <strong>WhatsApp</strong>.
          </p>
        </div>

        {/* SECTION 3: Login Form */}
        <div className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="group">
              <label className="text-[10px] uppercase tracking-widest text-[#A1887F] font-bold ml-1">Kredensial Akses</label>
              <input
                className="w-full bg-transparent border-b border-[#D7CCC8] py-3 px-1 focus:border-[#3E2723] outline-none transition-all placeholder:text-[#D7CCC8] text-sm"
                type="email"
                placeholder="Email Bisnis / Personal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <input
              className="w-full bg-transparent border-b border-[#D7CCC8] py-3 px-1 focus:border-[#3E2723] outline-none transition-all placeholder:text-[#D7CCC8] text-sm"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {msg && (
            <div className="bg-[#EFEBE9] p-3 text-[11px] text-center text-[#5D4037]">
              {msg}
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 bg-[#3E2723] text-white py-4 hover:bg-[#2D1B19] transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-xs font-bold shadow-lg"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Masuk ke Protokol"}
          </button>
        </div>

        {/* SECTION 4: The Pillars (Quick Trust) */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#D7CCC8]/30">
          <div className="text-center space-y-2">
            <MapPin className="w-5 h-5 mx-auto text-[#A1887F] opacity-60" />
            <p className="text-[9px] uppercase font-bold tracking-tighter">GPS Validated</p>
          </div>
          <div className="text-center space-y-2">
            <Smartphone className="w-5 h-5 mx-auto text-[#A1887F] opacity-60" />
            <p className="text-[9px] uppercase font-bold tracking-tighter">Auto WA Send</p>
          </div>
          <div className="text-center space-y-2">
            <Lock className="w-5 h-5 mx-auto text-[#A1887F] opacity-60" />
            <p className="text-[9px] uppercase font-bold tracking-tighter">Encrypted</p>
          </div>
        </div>

        {/* Branding Footer */}
        <p className="text-[9px] text-center text-[#D7CCC8] font-mono">
          © 2026 NEST76 STUDIO • Build with Integrity
        </p>
      </div>
    </div>
  )
}
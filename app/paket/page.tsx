'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function HomePage() {
  const router = useRouter();

  const [pending,setPending] = useState(0);
  const [last,setLast] = useState<string | null>(null);
  const [savedSerial, setSavedSerial] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(()=>{

    async function gate() {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login?redirect=/paket");
        return;
      }
      const pr = await fetch("/api/profile");
      const pj = await pr.json();
      const profile = pj.profile as { onboarded_at?: string | null } | null;
      if (!profile || !profile.onboarded_at) {
        router.replace("/choose-type?redirect=/paket");
        return;
      }
      setAuthReady(true);

      async function load(){

        const res = await fetch("/api/handover/list");
        const data = await res.json();

        if(!data.handovers) return;

        const pendingList = data.handovers.filter((h:any)=>h.status !== "accepted");

        setPending(pendingList.length);

        if(data.handovers.length){

          const date = new Date(data.handovers[0].created_at).toLocaleDateString(
            "id-ID",
            { day:"2-digit", month:"short", year:"numeric" }
          );

          setLast(date);

        }

      }

      load();
    }

    gate();

  },[router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sn = new URLSearchParams(window.location.search).get("sn");
    if (sn) setSavedSerial(sn);
  }, []);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-sm text-[#A1887F]">
        Memuat…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] px-8 text-center flex flex-col justify-between">

      <div>

        {savedSerial && (
          <div className="max-w-md mx-auto mt-6 mb-2 rounded-sm border border-[#C8B8A8] bg-white/80 px-4 py-3 text-left shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8D6E63] mb-1">
              Tersimpan
            </p>
            <p className="text-sm font-mono font-medium text-[#3E2723] break-all">
              {savedSerial}
            </p>
            <button
              type="button"
              onClick={() => {
                setSavedSerial(null);
                router.replace("/paket");
              }}
              className="mt-2 text-[11px] text-[#8D6E63] underline underline-offset-2"
            >
              Tutup
            </button>
          </div>
        )}

        <img
          src="/logo-nest-paket.png"
          alt="NEST Paket"
          className="w-44 mx-auto mt-20"
        />

        <div className="text-base tracking-widest mt-2 opacity-60">
          NEST PAKET
        </div>

        <h1 className="text-xl sm:text-2xl font-light leading-snug mt-10 mb-4 max-w-md mx-auto">
          Bukti kirim jadi lebih jelas. Say bye-bye ke kertas! 🌿
        </h1>

        <p className="text-sm sm:text-base opacity-80 font-light leading-relaxed mb-12 max-w-lg mx-auto px-2">
          Solusi Tanda Terima Digital yang rapi, cepat, dan 100% GRATIS.
        </p>

        <Link
          href="/handover/select"
          className="block w-full max-w-xs mx-auto py-4 bg-[#3E2723] text-[#FAF9F6] rounded-sm font-medium"
        >
          Buat Tanda Terima Digital
        </Link>

        {/* 🔥 EDIT USER LINK */}
        <Link
          href="/profile"
          className="block mt-4 text-sm opacity-50"
        >
          Profil
        </Link>

        <Link
          href="/dashboard"
          className="block mt-6 text-base opacity-60"
        >
          Lihat Daftar Paket
        </Link>

      </div>


      {(pending > 0 || last) && (

        <div className="text-xs opacity-50 mb-8 leading-relaxed">

          {pending > 0 && (
            <div>
              {pending} paket sedang dalam proses
            </div>
          )}

          {last && (
            <div>
              Terakhir dibuat {last}
            </div>
          )}

        </div>

      )}

    </div>
  );
}
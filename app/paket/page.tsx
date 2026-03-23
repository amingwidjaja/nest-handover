'use client';

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomePage() {

  const [pending,setPending] = useState(0);
  const [last,setLast] = useState<string | null>(null);

  useEffect(()=>{

    const user = localStorage.getItem("user_name")

    if(!user){
      window.location.href = "/user"
      return
    }

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

  },[]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] px-8 text-center flex flex-col justify-between">

      <div>

        <img
          src="/logo-nest-paket.png"
          alt="NEST Paket"
          className="w-44 mx-auto mt-20"
        />

        <div className="text-base tracking-widest mt-2 opacity-60">
          NEST PAKET
        </div>

        <h1 className="text-2xl font-light leading-relaxed mt-10 mb-16">
          Serah terima barang <br/> sekarang lebih tenang.
        </h1>

        <Link
          href="/handover/create"
          className="block w-full max-w-xs mx-auto py-4 bg-[#3E2723] text-[#FAF9F6] rounded-sm font-medium"
        >
          Buat Serah Terima
        </Link>

        {/* 🔥 EDIT USER LINK */}
        <Link
          href="/user"
          className="block mt-4 text-sm opacity-50"
        >
          Edit Profil
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
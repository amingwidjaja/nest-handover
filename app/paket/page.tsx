'use client';

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] px-8 text-center">

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
        href="/create"
        className="block w-full max-w-xs mx-auto py-4 bg-[#3E2723] text-[#FAF9F6] rounded-sm font-medium"
      >
        Buat Serah Terima
      </Link>

      <Link
        href="/events"
        className="block mt-6 text-base opacity-60"
      >
        Lihat Daftar Paket
      </Link>

    </div>
  );
}
'use client';

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col items-center justify-center px-8 text-center">

      <img
        src="/logo-nest-paket.png"
        alt="NEST Paket"
        className="w-42"
      />

      <div className="text-sm tracking-widest mb-8 opacity-60">
        NEST PAKET
      </div>

      <h1 className="text-2xl font-light leading-relaxed mb-16">
        Serah terima barang <br/> sekarang lebih tenang.
      </h1>

      <Link
        href="/create"
        className="w-full max-w-xs py-4 bg-[#3E2723] text-[#FAF9F6] rounded-sm font-medium"
      >
        Buat Serah Terima
      </Link>

      <Link
        href="/events"
        className="mt-6 text-base opacity-60"
      >
        Lihat Logbook
      </Link>

    </div>
  );
}
'use client';

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col items-center justify-center px-8 text-center">

      {/* Logo */}

      <img
        src="/nest-logo-muji.svg"
        alt="NEST Paket"
        className="w-20 mb-10 opacity-80"
      />

      {/* Headline */}

      <h1 className="text-2xl font-light tracking-tight leading-relaxed mb-4">
        Serah terima barang
        <br />
        sekarang lebih tenang.
      </h1>

      {/* Sub text */}

      <p className="text-sm opacity-60 mb-16 max-w-xs">
        Catatan serah terima digital.
        Simpan bukti, kirim notifikasi, tanpa ribet.
      </p>

      {/* Primary action */}

      <Link
        href="/create"
        className="w-full max-w-xs py-4 bg-[#3E2723] text-[#FAF9F6] rounded-sm font-medium tracking-wide active:opacity-80 transition-opacity"
      >
        Buat Serah Terima
      </Link>

      {/* Secondary action */}

      <Link
        href="/events"
        className="mt-6 text-sm opacity-60 active:opacity-100 transition-opacity"
      >
        Lihat Logbook
      </Link>

    </div>
  );
}
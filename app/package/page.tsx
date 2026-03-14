'use client';

import Link from "next/link";
import { Camera } from "lucide-react";

export default function PackagePage() {

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">

      <main className="p-8 pt-16">

        {/* Title */}

        <h2 className="text-xs font-medium uppercase tracking-[0.2em] mb-12 opacity-60">
          tulis rincian paket kamu di sini
        </h2>

        {/* Notebook Lines */}

        <div className="space-y-0 mb-16">

          <input
            className="line-input"
            placeholder="1. Nama barang..."
          />

          <input
            className="line-input"
          />

          <input
            className="line-input"
          />

          <input
            className="line-input"
          />

        </div>

        {/* Photo Box */}

        <div className="w-full aspect-[4/3] border border-dashed border-[#E0DED7] flex flex-col items-center justify-center rounded-sm active:bg-[#F2F1ED] transition-colors">

          <Camera
            className="text-[#A1887F] mb-2"
            size={24}
            strokeWidth={1.5}
          />

          <span className="text-xs text-[#A1887F]">
            Tambahkan foto paketmu di sini
          </span>

        </div>

      </main>

      {/* Navigation */}

      <div className="flex justify-between px-8 pb-8 text-sm">

        <Link href="/create" className="opacity-60">
          ← Sebelumnya
        </Link>

        <Link href="/handover">
          Lanjut →
        </Link>

      </div>

    </div>
  );
}
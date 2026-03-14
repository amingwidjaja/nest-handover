'use client';

import { useState } from "react";
import Link from "next/link";
import { Camera, QrCode } from "lucide-react";

export default function HandoverPage() {

  const [mode, setMode] = useState("direct");

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">

      <main className="p-8 pt-16">

        {/* Title */}

        <h2 className="text-xl font-light mb-12">
          Paket untuk <span className="font-medium">Budi Santoso</span>
        </h2>

        {/* Tabs */}

        <div className="flex gap-8 mb-12 border-b border-[#E0DED7] pb-4">

          <button
            onClick={() => setMode("direct")}
            className={`text-sm pb-4 -mb-[18px] ${
              mode === "direct"
                ? "font-bold border-b-2 border-[#3E2723]"
                : "opacity-40"
            }`}
          >
            Penerima langsung
          </button>

          <button
            onClick={() => setMode("delegate")}
            className={`text-sm pb-4 -mb-[18px] ${
              mode === "delegate"
                ? "font-bold border-b-2 border-[#3E2723]"
                : "opacity-40"
            }`}
          >
            Diwakilkan
          </button>

        </div>

        {/* Delegate Fields */}

        {mode === "delegate" && (

          <div className="space-y-4 mb-12">

            <input
              className="line-input"
              placeholder="Nama"
            />

            <input
              className="line-input"
              placeholder="Hubungan dengan penerima"
            />

          </div>

        )}

        {/* Proof Options */}

        <div className="grid grid-cols-2 gap-4">

          <div className="aspect-square border border-[#E0DED7] flex flex-col items-center justify-center rounded-sm active:bg-[#F2F1ED] transition-colors">

            <QrCode
              className="text-[#3E2723] mb-3"
              size={32}
              strokeWidth={1.5}
            />

            <span className="text-xs">
              QR Code
            </span>

          </div>

          <div className="aspect-square border border-[#E0DED7] flex flex-col items-center justify-center rounded-sm active:bg-[#F2F1ED] transition-colors">

            <Camera
              className="text-[#3E2723] mb-3"
              size={32}
              strokeWidth={1.5}
            />

            <span className="text-xs text-center">
              Ambil foto
              <br/>
              serah terima
            </span>

          </div>

        </div>

      </main>

      {/* Navigation */}

      <div className="flex justify-between px-8 pb-8 text-sm">

        <Link href="/package" className="opacity-60">
          ← Sebelumnya
        </Link>

        <Link href="/events">
          Selesai →
        </Link>

      </div>

    </div>
  );
}
'use client';

import { useState, useRef } from "react";
import Link from "next/link";
import { Camera } from "lucide-react";

export default function PackagePage() {

  const [item1, setItem1] = useState("");
  const [item2, setItem2] = useState("");
  const [item3, setItem3] = useState("");
  const [item4, setItem4] = useState("");

  const fileInput = useRef<HTMLInputElement>(null);

  const openCamera = () => {
    fileInput.current?.click();
  };

  const canContinue =
    item1.trim() !== "" ||
    item2.trim() !== "" ||
    item3.trim() !== "" ||
    item4.trim() !== "";

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">

      <main className="p-8 pt-10">

        <h2 className="text-xs font-medium uppercase tracking-[0.2em] mb-12 opacity-60">
          tulis rincian paket kamu di sini
        </h2>

        <div className="space-y-0 mb-10">

          <input
            className="line-input"
            placeholder="1. Nama barang..."
            value={item1}
            onChange={(e)=>setItem1(e.target.value)}
          />

          <input
            className="line-input"
            value={item2}
            onChange={(e)=>setItem2(e.target.value)}
          />

          <input
            className="line-input"
            value={item3}
            onChange={(e)=>setItem3(e.target.value)}
          />

          <input
            className="line-input"
            value={item4}
            onChange={(e)=>setItem4(e.target.value)}
          />

        </div>

        <div
          onClick={openCamera}
          className="w-full aspect-[4/3] border border-dashed border-[#E0DED7] flex flex-col items-center justify-center rounded-sm active:bg-[#F2F1ED] transition-colors cursor-pointer"
        >

          <Camera
            className="text-[#A1887F] mb-2"
            size={24}
            strokeWidth={1.5}
          />

          <span className="text-xs text-[#A1887F]">
            Tambahkan foto paketmu di sini
          </span>

        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
        />

      </main>

      <div className="flex justify-between px-8 pb-8 text-sm">

        <Link href="/create" className="opacity-60">
          ← Sebelumnya
        </Link>

        {canContinue ? (
          <Link href="/events">
            Lanjut →
          </Link>
        ) : (
          <span className="opacity-30">
            Lanjut →
          </span>
        )}

      </div>

    </div>
  );
}
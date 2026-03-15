'use client';

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Camera } from "lucide-react";

export default function HandoverPage() {
  const params = useParams();
  const id = params.id;

  const [mode, setMode] = useState("direct");
  const [delegateName, setDelegateName] = useState("");
  const [relation, setRelation] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">
      <main className="p-8 pt-16">
        <h2 className="text-xl font-light mb-6">
          Serah terima paket
        </h2>

        <p className="text-xs opacity-60 mb-12 leading-relaxed">
          Selesaikan Serah Terima dengan menunjukkan QR untuk difoto penerima,
          atau kamu juga bisa mengambil foto sebagai bukti.
        </p>

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

        {mode === "delegate" && (
          <div className="space-y-8 mb-12">
            <div>
              <div className="text-sm mb-2">
                Nama yang mewakili:
              </div>

              <input
                value={delegateName}
                onChange={(e) => setDelegateName(e.target.value)}
                className="line-input w-full"
              />
            </div>

            <div>
              <div className="text-sm mb-2">
                Hubungan dengan penerima:
              </div>

              <input
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="line-input w-full"
              />
            </div>

            <div>
              <div className="text-sm mb-2">
                Catatan: <span className="opacity-40">(kalau ada)</span>
              </div>

              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="line-input w-full"
              />
            </div>
          </div>
        )}

        {mode === "direct" && (
          <div className="mb-12">
            <div className="text-sm mb-2">
              Catatan: <span className="opacity-40">(kalau ada)</span>
            </div>

            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="line-input w-full"
            />
          </div>
        )}

        <div className="mb-12">
          <img
            src={`/api/handover/qr?id=${id}`}
            alt="QR Code"
            className="w-full rounded-sm border border-[#E0DED7]"
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Link
            href={`/receive/${id}`}
            className="aspect-square border border-[#E0DED7] flex flex-col items-center justify-center rounded-sm active:bg-[#F2F1ED] cursor-pointer"
          >
            <Camera
              className="text-[#3E2723] mb-3"
              size={32}
              strokeWidth={1.5}
            />

            <span className="text-xs text-center">
              Buka halaman
              <br />
              penerimaan
            </span>
          </Link>
        </div>
      </main>

      <div className="flex justify-between px-8 pb-8 text-sm">
        <Link href="/package" className="opacity-60">
          ← Sebelumnya
        </Link>

        <Link href="/">
          Batal
        </Link>
      </div>
    </div>
  );
}
'use client';

import { useState } from "react";
import Link from "next/link";

export default function CreatePage() {

  const [senderType, setSenderType] = useState("self");
  const [receiverName, setReceiverName] = useState("");

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">

      <main className="p-8 pt-16 space-y-12">

        <section>
          <p className="text-sm font-medium mb-6">
            Siapa yang kirim paket ini?
          </p>

          <div className="flex gap-8 mb-8">

            <button
              onClick={() => setSenderType("self")}
              className="flex items-center gap-2"
            >
              <div className="w-4 h-4 border border-[#3E2723] rounded-full flex items-center justify-center">
                {senderType === "self" && (
                  <div className="w-2 h-2 bg-[#3E2723] rounded-full"></div>
                )}
              </div>
              <span className="text-sm">Saya</span>
            </button>

            <button
              onClick={() => setSenderType("other")}
              className="flex items-center gap-2"
            >
              <div className="w-4 h-4 border border-[#3E2723] rounded-full flex items-center justify-center">
                {senderType === "other" && (
                  <div className="w-2 h-2 bg-[#3E2723] rounded-full"></div>
                )}
              </div>
              <span className="text-sm">Orang lain</span>
            </button>

          </div>

          {senderType === "other" && (

            <div className="space-y-4 mb-8">

              <input
                className="line-input"
                placeholder="Nama pengirim"
              />

              <input
                className="line-input"
                placeholder="WA / Email"
              />

            </div>

          )}

        </section>

        <section>

          <p className="text-sm font-medium mb-6">
            Paket ini untuk siapa?
          </p>

          <div className="space-y-4">

            <input
              className="line-input"
              placeholder="Nama penerima"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
            />

            <input
              className="line-input"
              placeholder="WA / Email"
            />

          </div>

        </section>

      </main>

      <div className="flex justify-between px-8 pb-8 text-sm">

        <Link href="/" className="opacity-60">
          ← Sebelumnya
        </Link>

        {receiverName ? (
          <Link href="/package">
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
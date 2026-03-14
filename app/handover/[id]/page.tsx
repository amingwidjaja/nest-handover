// app/handover/[id]/page.tsx
'use client';

import React from 'react';
import { ArrowLeft, Share2, Info, Clock } from 'lucide-react';
import Link from 'next/link';
import QRCode from 'react-qr-code';

export default function HandoverDetail() {

  const data = {
    receiver_name: "Budi Santoso",
    items: ["1x Paket Dokumen A4", "2x Box Sepatu"],
    token: "nst-76-x9y2z",
    status: "created"
  };

  const shareUrl = `https://nest76.app/r/${data.token}`;

  return (
    <div className="min-h-screen bg-white text-[#1E293B] antialiased">

      {/* Navigation */}
      <nav className="p-6 flex justify-between items-center">
        <Link
          href="/dashboard"
          className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>

        <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <Share2 size={20} className="text-slate-600" />
        </button>
      </nav>

      <main className="px-6 pb-12 flex flex-col items-center text-center">

        {/* Status */}
        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-amber-100">
          <Clock size={14}/>
          Menunggu Scan
        </div>

        <h1 className="text-2xl font-bold mt-6">
          Serahkan ke {data.receiver_name}
        </h1>

        <p className="text-slate-500 mt-1 mb-10 text-sm">
          Tunjukkan QR ini kepada penerima
        </p>

        {/* QR Section */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-indigo-500/5 rounded-[40px] blur-xl group-hover:bg-indigo-500/10 transition-all"></div>

          <div className="relative bg-white p-10 rounded-[32px] border border-slate-100 shadow-lg">
            <QRCode
              value={shareUrl}
              size={220}
              level="H"
              className="mx-auto"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="w-full max-w-sm mt-14 bg-slate-50 rounded-3xl p-6 text-left border border-slate-100">

          <div className="flex items-center gap-2 mb-4 text-slate-400">
            <Info size={16}/>
            <span className="text-xs font-semibold uppercase tracking-wider">
              Ringkasan Barang
            </span>
          </div>

          <ul className="space-y-3">
            {data.items.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-3 text-slate-700 font-medium"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                {item}
              </li>
            ))}
          </ul>

        </div>

        <p className="mt-8 text-xs text-slate-400 leading-relaxed px-8">
          NEST76 mencatat koordinat dan waktu saat tombol terima ditekan oleh penerima.
        </p>

      </main>

    </div>
  );
}
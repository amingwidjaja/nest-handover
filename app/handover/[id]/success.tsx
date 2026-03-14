'use client';

import React from 'react';
import { CheckCircle2, MapPin, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HandoverSuccess({ receiverName = "Budi Santoso" }) {

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-6 pt-20 pb-10 text-center">

      {/* Success Icon */}

      <div className="relative mb-10">

        <div className="absolute inset-0 bg-emerald-100 rounded-full scale-150 opacity-30 animate-pulse"></div>

        <div className="relative w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">

          <CheckCircle2 size={56} />

        </div>

      </div>


      {/* Hero */}

      <h1 className="text-3xl font-black text-slate-900 mb-2">
        Berhasil Terkirim!
      </h1>

      <p className="text-slate-500 text-lg">
        Barang telah diterima oleh{" "}
        <span className="font-bold text-slate-900">
          {receiverName}
        </span>
      </p>


      {/* Proof Card */}

      <div className="w-full mt-12 bg-slate-50 rounded-[32px] p-6 border border-slate-100 text-left space-y-4">

        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">
          Bukti Digital
        </h3>


        <div className="space-y-4">

          <div className="flex items-start gap-4">

            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
              <Clock size={18}/>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Waktu Terima
              </p>
              <p className="font-semibold text-slate-700">
                14:20 WIB, 12 Okt 2026
              </p>
            </div>

          </div>


          <div className="flex items-start gap-4">

            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
              <MapPin size={18}/>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Lokasi Konfirmasi
              </p>
              <p className="font-semibold text-slate-700">
                Jakarta Selatan, Indonesia
              </p>
            </div>

          </div>

        </div>

      </div>


      {/* Actions */}

      <div className="mt-16 w-full space-y-3">

        <Link href="/dashboard" className="block w-full">

          <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition">

            Kembali ke Dashboard

            <ArrowRight size={18}/>

          </button>

        </Link>


        <button className="w-full text-slate-400 py-3 text-sm font-medium hover:text-indigo-600 transition">
          Lihat Sertifikat Handover (PDF)
        </button>

      </div>

    </div>
  );
}
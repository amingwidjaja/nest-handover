'use client';

import React, { useState, useEffect } from 'react';
import { PackageCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { HandoverLoading } from '@/components/HandoverLoading';
import HandoverError from './error';

export default function ReceivePage() {

  const [status, setStatus] = useState('loading');
  const [isReceived, setIsReceived] = useState(false);

  useEffect(() => {

    // simulasi fetch token validation
    const timer = setTimeout(() => {
      setStatus('ready');
    }, 1200);

    return () => clearTimeout(timer);

  }, []);

  if (status === 'loading') return <HandoverLoading />;

  if (status === 'error') {
    return <HandoverError message="QR Code tidak valid atau sudah digunakan" />;
  }

  if (isReceived) {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-8 text-white">

        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={48}/>
        </div>

        <h1 className="text-3xl font-bold mb-2">
          Selesai!
        </h1>

        <p className="text-indigo-100 text-center max-w-sm">
          Serah terima berhasil dicatat oleh sistem NEST76.
        </p>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">

      <main className="flex-1 p-8 pt-16 max-w-xl mx-auto w-full">

        <header className="mb-12">

          <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <PackageCheck size={26}/>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Halo, Budi
          </h1>

          <p className="text-slate-400 mt-2">
            Konfirmasi penerimaan barang Anda.
          </p>

        </header>


        <section className="space-y-6">

          <div className="bg-slate-800/60 rounded-3xl p-6 border border-slate-700">

            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-5">
              Barang yang Anda terima
            </h2>

            <div className="space-y-4">

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                  📦
                </div>
                <span className="font-medium">
                  1x Paket Dokumen A4
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                  📦
                </div>
                <span className="font-medium">
                  2x Box Sepatu
                </span>
              </div>

            </div>

          </div>


          <div className="flex items-center gap-3 px-2 text-slate-400">
            <ShieldCheck size={18} className="text-emerald-500"/>
            <span className="text-sm">
              Verifikasi lokasi aktif
            </span>
          </div>

        </section>

      </main>


      <footer className="p-8 pb-12 max-w-xl mx-auto w-full">

        <button
          onClick={() => setIsReceived(true)}
          className="w-full bg-indigo-500 hover:bg-indigo-400 py-6 rounded-2xl font-bold text-xl shadow-lg active:scale-[0.97] transition"
        >
          KONFIRMASI TERIMA
        </button>

        <p className="text-center mt-6 text-slate-500 text-xs px-6">
          Dengan menekan tombol di atas, Anda menyatakan telah menerima barang tersebut.
        </p>

      </footer>

    </div>
  );
}
'use client';

import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function HandoverError({
  message = "QR Code tidak valid atau sudah digunakan"
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">

      <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mb-8">
        <AlertCircle size={40}/>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-3">
        Tautan Tidak Valid
      </h1>

      <p className="text-slate-500 mb-10 leading-relaxed max-w-xs">
        {message}
      </p>

      <div className="w-full max-w-xs space-y-3">

        <button
          onClick={() => window.location.reload()}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold active:scale-95 transition"
        >
          <RefreshCcw size={18}/>
          Muat Ulang
        </button>

        <Link
          href="/"
          className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold active:scale-95 transition"
        >
          <Home size={18}/>
          Beranda
        </Link>

      </div>

      <p className="mt-12 text-xs text-slate-300 font-mono tracking-widest uppercase">
        ERROR_TOKEN_INVALID
      </p>

    </div>
  );
}
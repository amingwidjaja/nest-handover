'use client';

import React, { useState, useEffect } from 'react';
import { PackageCheck, ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react';

export default function ReceivePage({ params }: { params: { token: string } }) {

  const [isReceived, setIsReceived] = useState(false);
  const [location, setLocation] = useState<string | null>(null);

  // ambil lokasi user
  useEffect(() => {

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {

        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setLocation(`${lat},${lng}`);

      },
      () => {
        setLocation("location unavailable");
      }
    );

  }, []);

  const handleReceive = async () => {

    const payload = {
      token: params.token,
      received_at: new Date().toISOString(),
      location: location
    };

    try {

      await fetch('/api/handover/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

    } catch (e) {
      console.error(e);
    }

    setIsReceived(true);
  };


  if (isReceived) {

    return (

      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-8 text-white">

        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={48}/>
        </div>

        <h1 className="text-3xl font-bold mb-2">
          Selesai!
        </h1>

        <p className="text-indigo-100 text-center max-w-xs">
          Serah terima telah tercatat oleh sistem NEST76.
        </p>

      </div>

    );

  }


  return (

    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">

      <main className="flex-1 p-8 pt-16">

        <header className="mb-12">

          <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <PackageCheck size={28}/>
          </div>

          <h1 className="text-3xl font-bold">
            Konfirmasi Terima
          </h1>

          <p className="text-slate-400 mt-2">
            Pastikan barang sudah Anda terima.
          </p>

        </header>


        <section className="space-y-6">

          <div className="bg-slate-800/50 rounded-3xl p-6 border border-slate-700/50">

            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">
              Barang
            </h2>

            <div className="space-y-4">

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                  📦
                </div>
                <span className="font-medium">1x Paket Dokumen</span>
              </div>

            </div>

          </div>


          <div className="flex items-center gap-3 px-2 text-slate-400">

            <ShieldCheck size={18} className="text-emerald-500"/>

            <span className="text-sm">
              Sistem akan mencatat waktu dan lokasi konfirmasi
            </span>

          </div>


          {location && (

            <div className="flex items-center gap-3 px-2 text-slate-500">

              <MapPin size={16}/>

              <span className="text-xs">
                Lokasi: {location}
              </span>

            </div>

          )}

        </section>

      </main>


      <footer className="p-8 pb-12">

        <button
          onClick={handleReceive}
          className="w-full bg-indigo-500 hover:bg-indigo-400 active:scale-[0.97] transition-all py-6 rounded-[24px] font-bold text-xl shadow-lg"
        >
          KONFIRMASI TERIMA
        </button>

        <p className="text-center mt-6 text-slate-500 text-xs px-6">
          Dengan menekan tombol ini, Anda menyatakan telah menerima barang.
        </p>

      </footer>

    </div>

  );

}
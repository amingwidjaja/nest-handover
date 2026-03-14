// app/create/page.tsx
'use client';

import React, { useState } from 'react';
import { ArrowLeft, Package, Camera, Plus, QrCode, X } from 'lucide-react';
import Link from 'next/link';

export default function CreateHandover() {

  const [items, setItems] = useState([{ id: 1, description: '' }]);

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: '' }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 antialiased pb-32">

      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-100/80 backdrop-blur px-6 py-5 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="p-2 -ml-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <ArrowLeft size={20}/>
        </Link>

        <h1 className="text-xl font-semibold tracking-tight">
          Kirim Barang
        </h1>
      </header>


      <main className="px-6 max-w-xl mx-auto">

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">


          {/* Receiver */}
          <section className="p-6 border-b border-slate-100 space-y-6">

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                Nama Penerima
              </label>

              <input
                type="text"
                placeholder="Budi Santoso"
                className="w-full px-4 py-4 bg-white border border-slate-200 rounded-xl text-base placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>


            <div className="space-y-2">

              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                Nomor WhatsApp
              </label>

              <div className="relative">

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                  +62
                </span>

                <input
                  type="tel"
                  placeholder="812345678"
                  className="w-full pl-14 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-base placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                />

              </div>

            </div>

          </section>


          {/* Items */}
          <section className="p-6 bg-slate-50">

            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1 mb-4">
              Daftar Barang
            </h2>

            <div className="space-y-4">

              {items.map((item) => (
                <div
                  key={item.id}
                  className="relative flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200"
                >

                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                    <Package size={20}/>
                  </div>

                  <input
                    type="text"
                    placeholder="Deskripsi barang"
                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                  >
                    <Camera size={20}/>
                  </button>

                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500"
                    >
                      <X size={14}/>
                    </button>
                  )}

                </div>
              ))}


              <button
                onClick={addItem}
                className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-2 text-slate-500 font-medium hover:border-indigo-400 hover:text-indigo-600 transition"
              >
                <Plus size={18}/>
                Tambah Barang
              </button>

            </div>

          </section>

        </div>

      </main>


      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200 max-w-xl mx-auto">

        <button
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold text-lg shadow-md flex items-center justify-center gap-3 active:scale-[0.97] transition"
        >
          <QrCode size={22}/>
          Buat QR Serah Terima
        </button>

      </div>

    </div>
  );
}
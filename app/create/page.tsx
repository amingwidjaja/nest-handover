'use client';

import React, { useState } from 'react';
import { ArrowLeft, Package, Camera, Plus, QrCode, X, ChevronLeft } from 'lucide-react';

export default function CreateHandoverPage() {
  const [items, setItems] = useState([{ id: Date.now(), description: '' }]);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white selection:bg-indigo-500/30">
      {/* Background Gradient Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] bg-indigo-900/20 blur-[120px] rounded-full" />
        <div className="absolute top-[40%] -right-[10%] w-[400px] h-[400px] bg-blue-900/10 blur-[100px] rounded-full" />
      </div>

      <header className="relative px-6 py-6 flex items-center justify-between z-10">
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-medium tracking-tight">Kirim Barang</h1>
        <div className="w-10" /> 
      </header>

      <main className="relative px-6 pb-32 z-10 max-w-lg mx-auto">
        <div className="space-y-8">
          
          {/* Receiver Glass Card */}
          <section className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl rounded-[32px] p-6 shadow-2xl">
            <div className="space-y-5">
              <div>
                <label className="text-[11px] font-semibold text-indigo-300 uppercase tracking-widest ml-1 mb-2 block">
                  Nama Penerima
                </label>
                <input 
                  type="text" 
                  placeholder="Contoh: Budi Santoso"
                  className="w-full bg-transparent border-b border-white/10 py-3 text-lg placeholder:text-white/20 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-indigo-300 uppercase tracking-widest ml-1 mb-2 block">
                  Nomor WhatsApp
                </label>
                <input 
                  type="tel" 
                  placeholder="+62 812..."
                  className="w-full bg-transparent border-b border-white/10 py-3 text-lg placeholder:text-white/20 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Items Glass Card */}
          <section className="space-y-4">
            <h2 className="text-[11px] font-semibold text-indigo-300 uppercase tracking-widest ml-2">
              Detail Barang
            </h2>
            
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.id} className="group relative bg-white/[0.05] border border-white/[0.05] rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                    <Package size={20} />
                  </div>
                  <input 
                    className="flex-1 bg-transparent border-none focus:outline-none text-white/90 placeholder:text-white/20"
                    placeholder="Deskripsi barang..."
                  />
                  <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                    <Camera size={18} />
                  </button>
                  <button 
                    onClick={() => setItems(items.filter((_, i) => i !== idx))}
                    className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setItems([...items, { id: Date.now(), description: '' }])}
              className="w-full py-4 rounded-2xl border border-dashed border-white/10 text-indigo-300 font-medium hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Tambah Barang
            </button>
          </section>
        </div>
      </main>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B] to-transparent z-20">
        <button className="w-full py-5 rounded-[20px] bg-white text-[#0A0A0B] font-bold text-lg flex items-center justify-center gap-3 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-transform">
          <QrCode size={22} />
          Buat QR Serah Terima
        </button>
      </div>
    </div>
  );
}